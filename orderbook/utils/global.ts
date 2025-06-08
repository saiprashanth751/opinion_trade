export interface INRBalance{
    balance: number
    lockedBalance: number
}

export const inr_balances : { [userId : string] : INRBalance } = {};