// hyperliquid api types - official documentation

// ============================================
// core types
// ============================================

export type AssetIndex = number
export type UserAddress = string
export type OrderId = number
export type ClientOrderId = string
export type Timestamp = number
export type HexString = string

// ============================================
// market data types
// ============================================

export interface MarketMeta {
    universe: AssetInfo[]
}

export interface AssetInfo {
    name: string
    szDecimals: number
    maxLeverage?: number
    onlyIsolated?: boolean
    isDelisted?: boolean
}

export interface AssetContext {
    coin: string
    dayNtlVlm: string
    funding: string
    impactPxs?: [string, string]
    markPx: string
    midPx?: string
    openInterest: string
    oraclePx: string
    premium?: string
    prevDayPx: string
}

export interface MetaAndAssetCtx {
    meta: MarketMeta
    assetCtxs: AssetContext[]
}

// ============================================
// order book types
// ============================================

export interface L2BookData {
    coin: string
    levels: [
        Array<[string, string]>, // bids: [price, size]
        Array<[string, string]>, // asks: [price, size]
    ]
    time: Timestamp
}

export interface OrderLevel {
    px: string
    sz: string
    n: number // number of orders at this level
}

// ============================================
// trade types
// ============================================

export interface Trade {
    coin: string
    side: 'B' | 'A' // buy or ask(sell)
    px: string // price
    sz: string // size
    hash: string
    time: Timestamp
    tid: number // trade id
    users?: [string, string] // [buyer, seller]
}

export interface UserFill extends Trade {
    oid: OrderId
    crossed: boolean
    fee: string
    startPosition: string
    dir: 'Open Long' | 'Close Long' | 'Open Short' | 'Close Short'
    closedPnl?: string
}

// ============================================
// candle/chart types
// ============================================

export type CandleInterval = '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '8h' | '12h' | '1d' | '3d' | '1w' | '1M'

export interface HyperliquidCandle {
    t: Timestamp // timestamp
    o: string // open
    h: string // high
    l: string // low
    c: string // close
    v: string // volume
}

export interface CandleSnapshotRequest {
    type: 'candleSnapshot'
    req: {
        coin: string
        interval: CandleInterval
        startTime: Timestamp
        endTime: Timestamp
    }
}

// chart hook return type
export interface ChartData {
    candles: HyperliquidCandle[]
    isLoading: boolean
    isConnected: boolean
    error: string | null
}

// ============================================
// user account types
// ============================================

export interface ClearinghouseState {
    assetPositions: AssetPosition[]
    crossMarginSummary: MarginSummary
    marginSummary: MarginSummary
    withdrawable: string
    time: Timestamp
}

export interface AssetPosition {
    position: Position
    type: 'oneWay'
}

export interface Position {
    coin: string
    szi: string // signed size (+ for long, - for short)
    entryPx?: string
    positionValue: string
    unrealizedPnl: string
    returnOnEquity: string
    liquidationPx?: string | null
    marginUsed: string
    maxTradeSz: string
    funding: FundingInfo
}

export interface FundingInfo {
    hourlyFundingRate: string
    cumFunding: {
        allTime: string
        sinceChange: string
        sinceOpen: string
    }
}

export interface MarginSummary {
    accountValue: string
    totalMarginUsed: string
    totalNtlPos: string
    totalRawUsd: string
    withdrawable: string
}

// ============================================
// order types
// ============================================

export interface OpenOrder {
    coin: string
    limitPx: string
    oid: OrderId
    side: 'B' | 'A'
    sz: string
    timestamp: Timestamp
    origSz: string
    cloid?: ClientOrderId
}

export interface OrderRequest {
    a: AssetIndex // asset index from meta
    b: boolean // is buy
    p: string // price
    s: string // size
    r: boolean // reduce only
    t: OrderType
    c?: ClientOrderId // client order id
}

export type OrderType = { limit: { tif: TimeInForce } } | { trigger: TriggerOrderType }

export type TimeInForce = 'Gtc' | 'Ioc' | 'Alo'

export interface TriggerOrderType {
    triggerPx: string
    isMarket: boolean
    tpsl: 'tp' | 'sl'
}

// ============================================
// websocket types
// ============================================

export interface WebSocketMessage {
    channel?: string
    data?: unknown
    method?: string
    subscription?: unknown
    error?: string
}

import { HyperliquidWebSocketSubscriptionType } from '@/enums'

// Re-export for backward compatibility
export { HyperliquidWebSocketSubscriptionType } from '@/enums'

export interface WebSocketSubscription {
    method: 'subscribe' | 'unsubscribe'
    subscription: {
        type: HyperliquidWebSocketSubscriptionType
        coin?: string
        interval?: CandleInterval
        user?: UserAddress
    }
}

export interface SubscriptionOptions {
    type: HyperliquidWebSocketSubscriptionType
    coin?: string
    interval?: string
    user?: string
}

export type SubscriptionCallback = (data: unknown) => void

export interface WebSocketCandleData {
    channel: 'candle'
    data: {
        t: Timestamp
        o: string
        h: string
        l: string
        c: string
        v: string
        coin: string
        interval: CandleInterval
    }
}

export interface WebSocketTradeData {
    channel: 'trades'
    data: Trade | Trade[]
}

export interface WebSocketL2Data {
    channel: 'l2Book'
    data: L2BookData
}

export interface AllMidsData {
    mids: Record<string, string> // coin -> mid price
}

// ============================================
// request/response types
// ============================================

export interface InfoRequest {
    type: string
    [key: string]: unknown
}

export interface ExchangeRequest {
    action: ExchangeAction
    nonce: Timestamp
    signature: HexString
}

export type ExchangeAction =
    | { type: 'order'; orders: OrderRequest[] }
    | { type: 'cancel'; cancels: CancelRequest[] }
    | { type: 'cancelByCloid'; cancels: CancelByCloidRequest[] }
    | { type: 'modify'; modifies: ModifyRequest[] }
    | { type: 'batchModify'; modifies: BatchModifyRequest[] }

export interface CancelRequest {
    a: AssetIndex
    o: OrderId
}

export interface CancelByCloidRequest {
    asset: AssetIndex
    cloid: ClientOrderId
}

export interface ModifyRequest {
    oid: OrderId
    limitPx: string
    sz?: string
}

export interface BatchModifyRequest {
    a: AssetIndex
    modifies: ModifyRequest[]
}

// ============================================
// response status types
// ============================================

export interface OrderStatusResponse {
    status: 'success' | 'error'
    response?: {
        type: 'order'
        data: {
            statuses: OrderStatus[]
        }
    }
    error?: string
}

export interface OrderStatus {
    resting?: {
        oid: OrderId
        cloid?: ClientOrderId
    }
    filled?: {
        totalSz: string
        avgPx: string
        oid: OrderId
        cloid?: ClientOrderId
    }
    error?: string
}

// ============================================
// funding types
// ============================================

export interface FundingHistory {
    coin: string
    fundingRate: string
    premium: string
    time: Timestamp
}

export interface UserFunding {
    time: Timestamp
    coin: string
    usdc: string
    fundingRate: string
}

// ============================================
// fee types
// ============================================

export interface UserFees {
    dailyUserVlm: string
    feeSchedule: {
        taker: string
        maker: string
    }
}

// ============================================
// helper type guards
// ============================================

export function isL2BookData(data: unknown): data is L2BookData {
    return (
        !!data &&
        typeof data === 'object' &&
        'coin' in data &&
        typeof (data as L2BookData).coin === 'string' &&
        'levels' in data &&
        Array.isArray((data as L2BookData).levels) &&
        (data as L2BookData).levels.length === 2
    )
}

export function isTrade(data: unknown): data is Trade {
    return (
        !!data &&
        typeof data === 'object' &&
        'coin' in data &&
        'px' in data &&
        'sz' in data &&
        'side' in data &&
        typeof (data as Trade).coin === 'string' &&
        typeof (data as Trade).px === 'string' &&
        typeof (data as Trade).sz === 'string' &&
        ((data as Trade).side === 'B' || (data as Trade).side === 'A')
    )
}

export function isCandle(data: unknown): data is HyperliquidCandle {
    return (
        !!data &&
        typeof data === 'object' &&
        't' in data &&
        'o' in data &&
        'h' in data &&
        'l' in data &&
        'c' in data &&
        'v' in data &&
        typeof (data as HyperliquidCandle).t === 'number' &&
        typeof (data as HyperliquidCandle).o === 'string' &&
        typeof (data as HyperliquidCandle).h === 'string' &&
        typeof (data as HyperliquidCandle).l === 'string' &&
        typeof (data as HyperliquidCandle).c === 'string' &&
        typeof (data as HyperliquidCandle).v === 'string'
    )
}

// ============================================
// constants
// ============================================

export const HYPERLIQUID_ENDPOINTS = {
    INFO_UI: 'https://api-ui.hyperliquid.xyz/info',
    INFO_PUBLIC: 'https://api.hyperliquid.xyz/info',
    EXCHANGE: 'https://api.hyperliquid.xyz/exchange',
    WS_UI: 'wss://api-ui.hyperliquid.xyz/ws',
    WS_PUBLIC: 'wss://api.hyperliquid.xyz/ws',
} as const

export const RATE_LIMIT_WEIGHTS = {
    l2Book: 2,
    allMids: 2,
    clearinghouseState: 2,
    orderStatus: 2,
    userRole: 60,
    default: 20,
} as const

export const CACHE_DURATIONS = {
    meta: 3600000, // 1 hour
    spotMeta: 3600000, // 1 hour
    userFees: 300000, // 5 minutes
    allMids: 1000, // 1 second
    l2Book: 0, // never cache
    clearinghouseState: 0, // never cache
    candleSnapshot: 60000, // 1 minute
} as const
