export interface INRBalance{
    balance: number
    lockedBalance: number
}

export interface Trades {
    eventId : string
    sellerId: string
    sell_qty: number
    buyerId: string
    buy_qty: number
    buyPrice: number
    sellPrice: number
    sellerOrder_id: string
    buyerOrder_id: string
}

export interface Orderbook{
    YES: Order[]
    NO: Order[]
}

export interface Order{
    price: number
    quantity: number
    userQuantities: UserQuantities[] 
}

export interface UserQuantities{
    userId?: string
    quantity?: number
    orderId?: string
}

export interface OrderSchema {
    userId: string
    eventId: string
    side: "YES" | "NO"
    type: "BUY" | "SELL"
    price: number
    quantity: number
    status: "LIVE" | "EXECUTED"
}

export interface Event {
    title: string
    description: string
}

export const inMemoryOrderBooks: { [eventId: string] : Orderbook } = {};
export const inr_balances : { [userId : string] : INRBalance } = {};
export const inMemory_trades : { [tradeId: string] : Trades} = {};
export const inMemory_OrderId: { [orderId: string] : OrderSchema} = {};
export const inMemory_events: {[eventId: string] : Event} = {};

export const generateOrderbook = () => {
    const YES = []
    const NO = []

    for(let price = 0.5; price <= 9.5; price += 0.5){
        YES.push({
            price: price,
            quantity: 0,
            userQuantities: []
        });
        NO.push({
            price: price,
            quantity: 0,
            userQuantities: []
        })
    }

    return {YES, NO};
}

const eventId = "testevent";
inMemoryOrderBooks[eventId] = generateOrderbook();

const users = ["user1", "user2", "user3", "user4"];

users.forEach(user => {
    inr_balances[user] = {
        balance: 1000,
        lockedBalance: 0
    }
});