// trading ui types - components for displaying trading data

// orderbook level for UI display
export interface OrderLevel {
    px: string // price
    sz: string // size
    n?: number // number of orders
    total?: string // cumulative total (UI calculation)
}

// orderbook data structure for UI
export interface OrderbookData {
    bids: OrderLevel[]
    asks: OrderLevel[]
    spread: number
    spreadPercentage: number
    midPrice: number
    lastUpdateTime?: number
}

// market data for list/grid views (UI representation)
export interface MarketData {
    symbol: string
    name: string
    px: string // price (official field)
    change24h: number
    changePercent24h: number
    dayNtlVlm: string // daily notional volume (official field)
    funding: string // funding rate (official field)
    openInterest: string
    type: 'perp' | 'spot'
    maxLeverage?: number
}

// market KPIs using official field names
export interface MarketKPIs {
    markPx: number // mark price
    oraclePx: number // oracle price
    change24h: number
    change24hAbs: number
    prevDayPx: number // previous day price
    dayNtlVlm: number // daily notional volume
    openInterest: number
    funding: number // funding rate
}
