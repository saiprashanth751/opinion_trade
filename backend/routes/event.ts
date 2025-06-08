import express from "express"
import { createId } from "@paralleldrive/cuid2"
import { engineQueue, redis } from "../services/redisClient"

const app = express.Router();

app.post("/", async (req, res) => {
    const responseId = createId();

    const data = JSON.stringify({
        responseId,
        type: "getEvents"
    })

    const timeout = setTimeout(() => {
        redis.unsubscribe("getEvents")
        return res.status(401).json({
            message: "Timeout: Failed to get events"
        })
    }, 5000)

    await redis.subscribe("getEvents", (data) => {
        const parsedData = JSON.parse(data);

        if(parsedData.responseId === responseId && parsedData.status == "SUCCESS"){
            clearTimeout(timeout)
            redis.unsubscribe("getEvents");
            return res.status(200).json({
                events: parsedData.events
            })
        }
    })

    await engineQueue(data);
})

app.post("/initiate", async(req, res) => {
    const{userId, eventId, side, price, quantity} = req.body;
    if(!userId || !eventId || !side || !price || !quantity){
        res.status(401).json({
            message: "Invalid information"
        })
        return;
    }

    const responseId = createId();

    const data = JSON.stringify({
        responseId,
        userId,
        eventId,
        side,
        price,
        quantity,
        type: "initiateOrder"
    })

    const timeout = setTimeout(() => {
        redis.unsubscribe("initiateOrder")
        return res.status(401).json({
            message: "Timeout: Failed to place order"
        })
    }, 5000)

    await redis.subscribe("initiateOrder", (data) => {
        const parsedData = JSON.parse(data);

        if(parsedData.responseId === responseId && parsedData.status == "SUCCESS"){
            clearTimeout(timeout)
            redis.unsubscribe("initiateOrder");
            return res.status(200).json({
                message: "Order placed successfully"
            })
        }
    })

    await engineQueue(data);
})

app.post("/exit", async(req, res) => {
    const { userId, eventId, orderId, side, price, quantity } = req.body;
    const responseId = createId();

    const data = JSON.stringify({
        responseId,
        userId,
        eventId,
        orderId,
        side, 
        price,
        quantity,
        type: "orderExit",
    });

    const timeout = setTimeout(() => {
        redis.unsubscribe("orderExit")
        return res.status(401).json({
            message: "Timeout: Failed to exit order"
        })
    }, 5000)

    await redis.subscribe("orderExit", (data) => {
        const parsedData = JSON.parse(data);

        if(parsedData.responseId === responseId && parsedData.status == "SUCCESS"){
            clearTimeout(timeout)
            redis.unsubscribe("orderExit");
            return res.status(200).json({
                message: "Order exited successfully"
            })
        }
    })

    await engineQueue(data);
})

app.post("/getEvent", async(req, res) => {
    const { eventId } = req.body;
    const responseId = createId();

    const data = JSON.stringify({
        responseId,
        eventId,
        type: "eventDetails",
    })

    const timeout = setTimeout(() => {
        redis.unsubscribe("eventDetails")
        return res.status(401).json({
            message: "Timeout: Failed to get event details"
        })
    }, 5000)

    await redis.subscribe("eventDetails", (data) => {
        const parsedData = JSON.parse(data);
        
        if(parsedData.responseId === responseId && parsedData.status == "SUCCESS"){
            clearTimeout(timeout)
            redis.unsubscribe("eventDetails");
            return res.status(200).json({
                details: parsedData.event
            })
        }
    })

    await engineQueue(data);
})

export default app;