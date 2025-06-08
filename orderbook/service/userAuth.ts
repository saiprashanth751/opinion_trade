import { PrismaClient } from "@prisma/client";
import {redis} from "./redisClient"
import { inr_balances } from "../utils/global";

const prisma = new PrismaClient();

