import  express  from "express";
import cors from "cors";
import userRouter from "./routes/user";
import eventRouter from "./routes/event";
import { redis, redis2 } from "./services/redisClient";

const app = express();

await redis.connect().then(() => {
    console.log("Connected to Redis");
})

await redis2.connect().then(() => {
    console.log("Connected to Redis2");
})

app.use(express.json());
app.use(cors());
app.use("/v1/user", userRouter);
app.use("/v1/event", eventRouter);

app.listen(3000, () => {
    console.log("Server is running on 3000");
});