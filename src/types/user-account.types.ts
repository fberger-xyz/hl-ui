// ui-friendly types for displaying user account data
// these types transform api data into display-ready formats

export interface UIBalance {
    coin: string
    chain?: string // for display like "(Perps)"
    contract?: string // contract address
    total: string
    available: string
    lockedInOrders?: string
    usdcValue: string
    pnl?: number
    roe?: number
}

export interface UIPosition {
    coin: string
    side: 'long' | 'short'
    size: string
    value: string
    entryPrice: string
    markPrice: string
    pnl: number
    pnlPercentage: number
    liqPrice?: string
    margin: string
    funding: string
    leverage?: number
}

export interface UIOpenOrder {
    id: string | number
    time: number
    type: 'limit' | 'market' | 'stop' | 'stop_limit'
    coin: string
    side: 'buy' | 'sell'
    size: string
    filledSize?: string
    originalSize: string
    price: string
    value: string
    reduceOnly: boolean
    postOnly?: boolean
    triggerCondition?: string
    tpsl?: string
    status?: string
}

export interface UITwapOrder {
    id: string
    coin: string
    side: 'buy' | 'sell'
    size: string
    executedSize: string
    averagePrice: string
    runningTime: number
    totalTime: number
    reduceOnly: boolean
    creationTime: number
    status: 'active' | 'completed' | 'cancelled'
}

export interface UITrade {
    time: number
    coin: string
    side: 'buy' | 'sell'
    direction?: 'Open' | 'Close' // for display like "Open Short"
    price: string
    size: string
    value: string
    fee: string
    feeRate?: number
    closedPnl?: number
    orderType?: string
    orderId?: string
}

export interface UIFundingPayment {
    time: number
    coin: string
    size: string
    positionSide: 'long' | 'short'
    payment: string
    rate: number
}

export interface UIOrderHistory {
    time: number
    type: 'limit' | 'market' | 'stop' | 'stop_limit'
    coin: string
    side: 'buy' | 'sell'
    filledSize: string
    originalSize: string
    price: string
    value: string
    reduceOnly: boolean
    triggerCondition?: string
    tpsl?: string
    status: 'filled' | 'cancelled' | 'rejected' | 'partially_filled'
    orderId: string
    cancelReason?: string
}

// keep old names as aliases temporarily for easier migration
export type Balance = UIBalance
export type Position = UIPosition
export type OpenOrder = UIOpenOrder
export type TwapOrder = UITwapOrder
export type Trade = UITrade
export type FundingPayment = UIFundingPayment
export type OrderHistory = UIOrderHistory

export interface UserAccountData {
    balances: Balance[]
    positions: Position[]
    openOrders: OpenOrder[]
    twapOrders: TwapOrder[]
    tradeHistory: Trade[]
    fundingHistory: FundingPayment[]
    orderHistory: OrderHistory[]
}

export interface ClearinghouseState {
    marginSummary?: {
        accountValue: string
        totalNtlPos: string
        totalRawUsd: string
        totalMarginUsed: string
    }
    crossMarginSummary?: {
        accountValue: string
        totalNtlPos: string
        totalRawUsd: string
        totalMarginUsed: string
    }
    assetPositions?: Array<{
        position: {
            coin: string
            entryPx?: string
            positionValue: string
            returnOnEquity: number
            szi: string
            unrealizedPnl: number
            cumFunding?: {
                allTime: string
                sinceChange: string
                sinceOpen: string
            }
            liquidationPx?: string | null
            marginUsed?: string
            maxLeverage?: number
        }
        type: 'oneWay'
    }>
    withdrawable?: string
}

export interface PortfolioData {
    pnlHistory?: Array<{
        time: number
        pnl: number
        accountValue: number
    }>
    volumeHistory?: Array<{
        time: number
        volume: number
    }>
    metrics?: {
        allTime?: {
            pnl: number
            volume: number
            accountValue: number
        }
        month?: {
            pnl: number
            volume: number
            accountValue: number
        }
        week?: {
            pnl: number
            volume: number
            accountValue: number
        }
        day?: {
            pnl: number
            volume: number
            accountValue: number
        }
    }
}
