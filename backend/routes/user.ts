import express from "express";
import { createId } from "@paralleldrive/cuid2";
import { engineQueue, redis } from "../services/redisClient";

const app = express.Router();

app.post("/signin", async (req, res) => {
    const { userId } = req.body;
    const responseId = createId();

    const data = JSON.stringify({
        responseId,
        userId,
        type: "userLogin",
    });
    
    const timeout = setTimeout(() => {
        redis.unsubscribe("userLogin");
        return res.status(401).json({
            message: "Timeout: User not found"
        })
    }, 5000)

    await redis.subscribe("userLogin", (data) => {
        const parsedData = JSON.parse(data);
        if (parsedData.responseId === responseId && parsedData.status == "SUCCESS") {
            clearTimeout(timeout);
            redis.unsubscribe("userLogin");
            return res.status(200).json({
                message: "User Login Successfull"
            })
        }
    })

    await engineQueue(data);
});

app.post("/create", async (req, res) => {
    const userId = createId();
    const responseId = createId();

    const data = JSON.stringify({
        responseId,
        userId,
        type: "userCreation",
    });

    const timeout = setTimeout(() => {
        redis.unsubscribe("userCreation");
        return res.status(500).json({
            message: "Timeout: User failed to create"
        })
    }, 5000)

    await redis.subscribe("userCreation", (data) => {
        const parsedData = JSON.parse(data);

        if(parsedData.responseId === responseId){
            clearTimeout(timeout);
            redis.unsubscribe("userCreation");
            return res.status(200).json({
                message: `User addded successfully with id: ${userId}`
            })
        }
        // redis.unsubscribe("userCreation");
        // return res.status(401).json({
        //     message: "User failed to create"
        // })
    })

    await engineQueue(data);
})

app.post("/recharge", async(req, res) => {
    const {userId, amount} = req.body;
    const responseId = createId();

    const data = JSON.stringify({
        responseId,
        userId,
        amount,
        type: "userRecharge",
    })

    const timeout = setTimeout(() => {
        redis.unsubscribe("userRecharge");
        return res.status(401).json({
            message: "Timeout: User Recharge failed"
        })
    }, 5000)

    await redis.subscribe("userRecharge", (data) => {
        const parsedData = JSON.parse(data);
        if(parsedData.responseId === responseId && parsedData.status == "SUCCESS"){
            clearTimeout(timeout);
            redis.unsubscribe("userRecharge")
            return res.status(200).json({
            message: `Total available balance: ${parsedData.balance}`
        })
        }
    })

    await engineQueue(data);
})


app.post("/balance", async(req, res) => {
    const {userId} = req.body;
    const responseId = createId();

    const data = JSON.stringify({
        responseId,
        userId,
        type: "userBalance"
    })

    const timeout = setTimeout(() => {
        redis.unsubscribe("userBalance");
        return res.status(401).json({
            message: "Timeout: Error fetching user balance"
        })
    }, 5000)

    await redis.subscribe("userBalance", (data) => {
        const parsedData = JSON.parse(data);

        if(parsedData.responseId === responseId && parsedData.status === "SUCCESS"){
            clearTimeout(timeout)
            redis.unsubscribe("userBalance");
            return res.status(200).json({
                balance: parsedData.balance
            })
        }
    })

    await engineQueue(data);
})

export default app;