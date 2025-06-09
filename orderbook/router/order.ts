import { createId } from "@paralleldrive/cuid2"
import express from "express"
import { generateOrderbook, inMemory_events, inMemoryOrderBooks } from "../utils/global"
import { PrismaClient } from "@prisma/client"
import { broadcastChannel } from "../service/redisClient"

const prisma = new PrismaClient()

const app = express.Router()

app.post("/event", async(require, res) => {
    const {title, description} = require.body
    if(!title || !description) {
        res.status(401).json({
            message: "Invalid details"
        })
    }
    const eventId = createId();
    inMemory_events[eventId] = {
        title: title,
        description: description
    }
    await prisma.event.create({
        data: {
            id: eventId,
            title: title,
            description: description
        }
    })
    
    inMemoryOrderBooks[eventId] = generateOrderbook()
    const orderbook = inMemoryOrderBooks[eventId]
    const broadcastData = {
        eventId,
        orderbook: {
            yes: orderbook.YES,
            no: orderbook.NO
        }
    }
    await broadcastChannel("orderbook", broadcastData);
    res.json({
        message: "Event added successfully"
    })
})

export default app;