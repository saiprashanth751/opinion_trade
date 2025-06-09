import express from "express"
import cors from "cors"
import { PrismaClient } from "@prisma/client"
import { redis } from "./redisClient"

const app = express()
app.use(cors())
app.use(express.json())

const prisma = new PrismaClient()

await redis.connect().then(() => {
    console.log("connected to redis");
    startArchiver();
})

async function startArchiver() {
    const eventGroup = "event_streams";
    const consumerName = "consume_archiver";
    let lastId = ">"

    while (true) {
        const message = await redis.xReadGroup(
            consumerName,
            "archiver_consumer",
            [{ key: eventGroup, id: lastId }],
            { BLOCK: 0, COUNT: 1 }
        );

        if (Array.isArray(message) && message.length > 0) {
            const streamData = message[0] as { messages?: any[] };
            if (streamData && Array.isArray(streamData.messages) && streamData.messages.length > 0) {
                const messages = streamData.messages;

                for (const { id, message } of messages) {
                    const messageData = JSON.parse(message.data);

                    if (message.type == "order_creation") {
                        const order = await prisma.order.upsert({
                            where: {
                                id: messageData.id
                            },
                            update: {
                                userId: messageData.userId,
                                price: messageData.price,
                                quantity: messageData.quantity,
                                type: messageData.type,
                                status: messageData.status,
                                eventId: messageData.eventId,
                                side: messageData.side,
                            },
                            create: {
                                id: messageData.id,
                                userId: messageData.userId,
                                price: messageData.price,
                                quantity: messageData.quantity,
                                type: messageData.type,
                                status: messageData.status,
                                eventId: messageData.eventId,
                                side: messageData.side,
                            }
                        })
                    } else if (message.type == "trade") {
                        const trade = await prisma.trade.upsert({
                            where: {
                                id: messageData.id,
                            },
                            update: {
                                eventId: messageData.eventId,
                                sellerId: messageData.sellerId,
                                sellerOrderId: messageData.sellerOrder_id,
                                buyerOrderId: messageData.buyerOrder_id,
                                sellQty: messageData.sell_qty,
                                buyerId: messageData.buyerId,
                                buyQty: messageData.buy_qty,
                                buyPrice: messageData.Buyprice,
                                sellPrice: messageData.Sellprice,
                            },
                            create: {
                                id: messageData.id,
                                eventId: messageData.eventId,
                                sellerId: messageData.sellerId,
                                sellerOrderId: messageData.sellerOrder_id,
                                buyerOrderId: messageData.buyerOrder_id,
                                sellQty: messageData.sell_qty,
                                buyerId: messageData.buyerId,
                                buyQty: messageData.buy_qty,
                                buyPrice: messageData.Buyprice,
                                sellPrice: messageData.Sellprice,
                            },
                        });
                    } else if (message.type == "order_update") {
                        console.log("order_update", message.data);
                        const order = await prisma.order.update({
                            where: { id: messageData.id },
                            data: { type: messageData.type },
                        });
                    } else if (message.type == "order_exit") {
                        console.log("order_exit", message.data);
                        const order = await prisma.order.update({
                            where: { id: messageData.id },
                            data: { status: messageData.type },
                        });
                    }
                    await redis.xAck(eventGroup, consumerName, id);
                }
            }
        }
    }
}