import { inMemory_OrderId } from "../utils/global";
import {redis, startEngine} from "./redisClient"
import { createId } from "@paralleldrive/cuid2";
import { broadcastChannel } from "./redisClient";
import { initializeOrder } from "./initialiseOrder";

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
    await initializeOrder(userId, eventId, orderId, side, price, quantity);
    const data = JSON.stringify({
        responseId,
        status: "SUCCESS"
    })
    redis.publish("initiateOrder", data);
    return;
}