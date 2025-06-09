import { inMemory_OrderId } from "../utils/global";
import {redis, startEngine} from "./redisClient"
import { createId } from "@paralleldrive/cuid2";
import { broadcastChannel } from "./redisClient";
import { initializeOrder } from "./initialiseOrder";
import {exit} from "./exit"

export async function initiateOrder(message: any){
    const{responseId, userId, eventId, side, price, quantity} = message;
    if(!responseId || !userId || !eventId || !side || !price || !quantity){
        const data = JSON.stringify({
            responseId,
            status: "FAILED"
        })
        redis.publish("initiateOrder", data);
        return;
    }
    const orderId = createId();
    inMemory_OrderId[orderId] = {
        userId,
        eventId,
        side,
        type: "BUY",
        price,
        quantity,
        status: "LIVE"
    }
    const orderData = {
        id: orderId,
        userId,
        eventId,
        side,
        type: "BUY",
        price,
        quantity,
        status: "LIVE"
    }
    await broadcastChannel("order_creation", orderData);
    console.log(inMemory_OrderId);
    await initializeOrder(userId, eventId, side as "YES" | "NO", price, quantity, orderId);
    const data = JSON.stringify({
        responseId,
        status: "SUCCESS"
    })
    redis.publish("initiateOrder", data);
    return;
}

export const exitOrder = async (message: any) => {
  const { userId, eventId, side, price, quantity, orderId, responseId } =
    message;
  if (
    !userId ||
    !eventId ||
    !side ||
    !price ||
    !quantity ||
    !inMemory_OrderId[orderId] ||
    !responseId
  ) {
    const data = JSON.stringify({
      responseId,
      status: "FAILED",
    });
    redis.publish("orderExit", data);
    return;
  }
  await exit(eventId, side, price, quantity, orderId, userId);
  const data = JSON.stringify({
    responseId,
    status: "SUCCESS",
  });
  redis.publish("orderExit", data);
  return;
};
