import { PrismaClient } from "@prisma/client";
import {redis} from "./redisClient"
import { INRBalance } from "../utils/global";

const prisma = new PrismaClient();

