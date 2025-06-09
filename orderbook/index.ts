import express from "express"
import cors from "cors"
import orderRouter from "./router/order"
import {redis2} from "./service/redisClient"
import { userCreate, userLogin } from "./service/userAuth"
import { userBalance, userRecharge } from "./service/userBalance"
import { exitOrder, initiateOrder } from "./service/orderHandlers"
import { fetchEvent } from "./service/events"

const app = express()
app.use(express.json())
app.use(cors())

app.use("/v1/worker", orderRouter);

async function processQueue(){
    while(true){

        const data = await redis2.brPop("engineQueue", 0);

        if(!data) continue;
        console.log(data);

        const {element} = data;
        const message = JSON.parse(element);
        console.log(message);
        
        const {type} = message;

        switch(type){
            case "userCreation":
                await userCreate(message);
                break;
            
            case "userLogin":
                await userLogin(message);
                break;
            
            case "userRecharge":
                await userRecharge(message);
                break;

            case "userBalance":
                await userBalance(message);
                break;

            case "initiateOrder":
                await initiateOrder(message);
                break;
            
            case "orderExit":
                await exitOrder(message);
                break;
            
            case "eventDetails":
                await fetchEvent(message);
                break;
        }
    }
}

app.listen(3002, () => {
    console.log("Worker running on 3002");
})

setInterval(() => {
    processQueue();
}, 1000)