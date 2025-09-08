// type guards for websocket messages

import type { WebData2, WsOrder, WsUserFills } from '@/types/hyperliquid.types'

export const isWebData2Message = (data: unknown): data is WebData2 => {
    if (!data || typeof data !== 'object') return false
    const d = data as Record<string, unknown>
    const hasClearinghouse = 'clearinghouseState' in d
    const hasMarginSummary = 'marginSummary' in d
    return hasClearinghouse || hasMarginSummary
}

export const isWebSocketOrderMessage = (data: unknown): data is WsOrder => {
    if (!data || typeof data !== 'object') return false
    const d = data as Record<string, unknown>
    const hasRequiredFields = 'order' in d && 'status' in d && d.order && typeof d.order === 'object'
    if (hasRequiredFields) {
        const order = d.order as Record<string, unknown>
        return 'oid' in order && 'coin' in order && 'side' in order
    }
    return false
}

export const isWebSocketOrderArrayMessage = (data: unknown): data is WsOrder[] => {
    if (!Array.isArray(data)) return false
    return data.length === 0 || data.every(isWebSocketOrderMessage)
}

export const isWebSocketUserFillsMessage = (data: unknown): data is WsUserFills => {
    if (!data || typeof data !== 'object') return false
    const d = data as Record<string, unknown>
    return 'fills' in d && Array.isArray(d.fills)
}

// guard: candle data
export const isWebSocketCandleDataMessage = (data: unknown): data is { t: number; o: string; h: string; l: string; c: string; v: string } => {
    if (!data || typeof data !== 'object') return false
    const d = data as Record<string, unknown>
    return 't' in d && 'o' in d && 'h' in d && 'l' in d && 'c' in d && 'v' in d
}

// guard: orderbook data
export const isWebSocketOrderbookL2Message = (data: unknown): data is { coin: string; levels: [[string, string][], [string, string][]] } => {
    if (!data || typeof data !== 'object') return false
    const d = data as Record<string, unknown>
    return 'coin' in d && 'levels' in d && Array.isArray(d.levels) && d.levels.length === 2
}

// guard: trade data
export const isWebSocketTradeDataMessage = (data: unknown): data is { coin: string; side: string; px: string; sz: string; time: number } => {
    if (!data || typeof data !== 'object') return false
    const d = data as Record<string, unknown>
    return 'coin' in d && 'side' in d && 'px' in d && 'sz' in d && 'time' in d
}

// guard: funding data
export const isWebSocketFundingDataMessage = (data: unknown): data is { fundings: unknown[]; isSnapshot?: boolean } => {
    if (!data || typeof data !== 'object') return false
    const d = data as Record<string, unknown>
    return 'fundings' in d && Array.isArray(d.fundings)
}

// guard: twap history
export const isWebSocketTwapHistoryMessage = (data: unknown): data is { history: unknown[]; isSnapshot?: boolean } => {
    if (!data || typeof data !== 'object') return false
    const d = data as Record<string, unknown>
    return 'history' in d && Array.isArray(d.history)
}
