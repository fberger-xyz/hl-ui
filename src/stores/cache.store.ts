import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { L2BookData, Trade, HyperliquidCandle } from '@/types/hyperliquid.types'

interface CachedData<T> {
    data: T
    timestamp: number
}

interface CacheState {
    // cache storage
    orderbookCache: Record<string, CachedData<L2BookData>>
    tradesCache: Record<string, CachedData<Trade[]>>
    candleCache: Record<string, CachedData<HyperliquidCandle[]>>

    // cache methods
    getCachedOrderbook: (symbol: string) => L2BookData | null
    setCachedOrderbook: (symbol: string, data: L2BookData) => void

    getCachedTrades: (symbol: string) => Trade[] | null
    setCachedTrades: (symbol: string, data: Trade[]) => void

    getCachedCandles: (key: string) => HyperliquidCandle[] | null
    setCachedCandles: (key: string, data: HyperliquidCandle[]) => void

    // cleanup old cache entries
    cleanExpiredCache: () => void
}

// cache expiry times in milliseconds
const ORDERBOOK_CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const TRADES_CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const CANDLES_CACHE_TTL = 10 * 60 * 1000 // 10 minutes

export const useCacheStore = create<CacheState>()(
    persist(
        (set, get) => ({
            orderbookCache: {},
            tradesCache: {},
            candleCache: {},

            getCachedOrderbook: (symbol) => {
                const cached = get().orderbookCache[symbol]
                // return if still fresh
                if (cached && Date.now() - cached.timestamp < ORDERBOOK_CACHE_TTL) {
                    return cached.data
                }
                return null
            },

            setCachedOrderbook: (symbol, data) => {
                set((state) => ({
                    orderbookCache: {
                        ...state.orderbookCache,
                        [symbol]: { data, timestamp: Date.now() },
                    },
                }))
            },

            getCachedTrades: (symbol) => {
                const cached = get().tradesCache[symbol]
                // return if still fresh
                if (cached && Date.now() - cached.timestamp < TRADES_CACHE_TTL) {
                    return cached.data
                }
                return null
            },

            setCachedTrades: (symbol, data) => {
                set((state) => ({
                    tradesCache: {
                        ...state.tradesCache,
                        [symbol]: { data, timestamp: Date.now() },
                    },
                }))
            },

            getCachedCandles: (key) => {
                const cached = get().candleCache[key]
                // return if still fresh
                if (cached && Date.now() - cached.timestamp < CANDLES_CACHE_TTL) {
                    return cached.data
                }
                return null
            },

            setCachedCandles: (key, data) => {
                set((state) => ({
                    candleCache: {
                        ...state.candleCache,
                        [key]: { data, timestamp: Date.now() },
                    },
                }))
            },

            cleanExpiredCache: () => {
                const now = Date.now()
                set((state) => {
                    // clean expired orderbook cache
                    const orderbookCache = Object.entries(state.orderbookCache).reduce(
                        (acc, [key, value]) => {
                            if (now - value.timestamp < ORDERBOOK_CACHE_TTL) {
                                acc[key] = value
                            }
                            return acc
                        },
                        {} as Record<string, CachedData<L2BookData>>,
                    )

                    // clean expired trades cache
                    const tradesCache = Object.entries(state.tradesCache).reduce(
                        (acc, [key, value]) => {
                            if (now - value.timestamp < TRADES_CACHE_TTL) {
                                acc[key] = value
                            }
                            return acc
                        },
                        {} as Record<string, CachedData<Trade[]>>,
                    )

                    // clean expired candle cache
                    const candleCache = Object.entries(state.candleCache).reduce(
                        (acc, [key, value]) => {
                            if (now - value.timestamp < CANDLES_CACHE_TTL) {
                                acc[key] = value
                            }
                            return acc
                        },
                        {} as Record<string, CachedData<HyperliquidCandle[]>>,
                    )

                    return { orderbookCache, tradesCache, candleCache }
                })
            },
        }),
        {
            name: 'hyperliquid-cache',
            // only persist the cache data
            partialize: (state) => ({
                orderbookCache: state.orderbookCache,
                tradesCache: state.tradesCache,
                candleCache: state.candleCache,
            }),
            version: 1,
        },
    ),
)

// auto-clean expired cache every 5 minutes
if (typeof window !== 'undefined') {
    setInterval(
        () => {
            useCacheStore.getState().cleanExpiredCache()
        },
        5 * 60 * 1000,
    )
}
