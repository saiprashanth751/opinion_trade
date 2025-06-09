import { createId } from "@paralleldrive/cuid2";
import {
  inMemory_OrderId,
  inMemory_trades,
  inMemoryOrderBooks,
  inr_balances,
} from "../utils/global";
import { broadcastChannel } from "./redisClient";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function initializeOrder(
  userId: string,
  eventId: string,
  side: "YES" | "NO",
  price: number,
  quantity: number,
  orderId: string
) {
  const orderbook = inMemoryOrderBooks[eventId];
  if (!orderbook) {
    throw new Error(`Orderbook for eventId ${eventId} not found.`);
  }
  const oppType = side === "YES" ? "NO" : "YES";
  const sortedOrders = orderbook[oppType].sort(
    (a: any, b: any) => b.price - a.price
  );

  const cost = price * quantity;
  if (!inr_balances[userId]) {
    throw new Error(`Balance record for userId ${userId} not found.`);
  }
  inr_balances[userId].balance -= cost;
  inr_balances[userId].lockedBalance += cost;

  let remainingQty = quantity;

  for (let order of sortedOrders) {
    if (order.price + price !== 10 || remainingQty === 0) continue;

    while (order.quantity > 0 && remainingQty > 0 && order.userQuantities.length > 0) {
      const userOrder = order.userQuantities[0];
      if (!userOrder) {
        break;
      }
      const userTradeQty = Math.min(remainingQty, userOrder.quantity!);

      // Flip type when matched
      const existingOrder = inMemory_OrderId[userOrder.orderId!];

      if (existingOrder && existingOrder.status === "EXECUTED" && existingOrder.type === "BUY") {
        existingOrder.type = "SELL";
        await broadcastChannel("order_update", {
          id: userOrder.orderId,
          type: "SELL",
        });
      } else if (existingOrder && existingOrder.status === "LIVE" && existingOrder.type === "SELL") {
        existingOrder.type = "BUY";
        await broadcastChannel("order_update", {
          id: userOrder.orderId,
          type: "BUY",
        });
      }

      const tradeId = createId();
      inMemory_trades[tradeId] = {
        eventId,
        sellerId: userOrder.userId!,
        sellerOrder_id: userOrder.orderId!,
        buyerOrder_id: orderId,
        sell_qty: userTradeQty,
        buyerId: userId,
        buy_qty: userTradeQty,
        buyPrice: price,
        sellPrice: order.price,
      };

      await broadcastChannel("trade", inMemory_trades[tradeId]);

      // Balance updates
      const userBalance = inr_balances[userOrder.userId!];
      if (userBalance) {
        userBalance.lockedBalance -= order.price * userTradeQty;
      } else {
        throw new Error(`Balance record for userId ${userOrder.userId!} not found.`);
      }
      inr_balances[userId].lockedBalance -= price * userTradeQty;

      userOrder.quantity! -= userTradeQty;
      remainingQty -= userTradeQty;
      order.quantity -= userTradeQty;

      if (userOrder.quantity === 0) {
        order.userQuantities.shift();
      }
    }
  }

  // Add remaining to orderbook if unmatched
  if (remainingQty > 0) {
    const newOrder = {
      userId,
      price,
      quantity: remainingQty,
      orderId,
      userQuantities: [
        {
          userId,
          quantity: remainingQty,
          orderId,
        },
      ],
    };
    orderbook[side].push(newOrder);
    if (inMemory_OrderId[orderId]) {
      inMemory_OrderId[orderId].status = "LIVE";
      inMemory_OrderId[orderId].type = "BUY"; // or "OPEN", if you track fresh orders separately
    }
  }

  await broadcastChannel("orderbook", {
    eventId,
    orderbook: {
      yes: orderbook.YES,
      no: orderbook.NO,
    },
  });

  return;
}
