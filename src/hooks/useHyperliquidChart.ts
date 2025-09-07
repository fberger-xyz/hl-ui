import { useCallback, useEffect, useRef, useState } from 'react'
import { hyperliquidWS } from '@/services/hyperliquid-websocket-client'
import { useCacheStore } from '@/stores/cache.store'
import type { CandleInterval, HyperliquidCandle, WebSocketCandleData, ChartData } from '@/types/hyperliquid.types'
import { HyperliquidWebSocketSubscriptionType } from '@/enums/hyperliquid.enum'

interface UseHyperliquidChartOptions {
    symbol: string
    interval: CandleInterval
    lookbackHours?: number
}

export function useHyperliquidChart({ symbol, interval, lookbackHours = 24 }: UseHyperliquidChartOptions): ChartData & {
    changeInterval: (newInterval: CandleInterval) => void
} {
    const { getCachedCandles, setCachedCandles } = useCacheStore()
    const cacheKey = `${symbol}:${interval}`

    // initialize with cached data for instant display
    const [candles, setCandles] = useState<HyperliquidCandle[]>(() => {
        const cached = getCachedCandles(cacheKey)
        return cached || []
    })
    const [isLoading, setIsLoading] = useState(true)
    const [isConnected, setIsConnected] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [currentInterval, setCurrentInterval] = useState(interval)

    const candleMapRef = useRef(new Map<number, HyperliquidCandle>())
    const unsubscribeRef = useRef<(() => void) | null>(null)
    const previousSymbolRef = useRef(symbol)

    const fetchCandles = useCallback(
        async (sym: string, int: CandleInterval) => {
            try {
                // show cached data immediately while fetching fresh
                const cachedData = getCachedCandles(`${sym}:${int}`)
                if (cachedData && cachedData.length > 0) {
                    setCandles(cachedData)
                    setIsLoading(false) // don't show spinner if we have cached data
                } else {
                    setIsLoading(true)
                }
                setError(null)

                const endTime = Date.now()
                const startTime = endTime - lookbackHours * 60 * 60 * 1000

                const requestBody = {
                    req: {
                        coin: sym,
                        interval: int,
                        startTime,
                        endTime,
                    },
                }

                const data = await hyperliquidWS.fetchInfo('candleSnapshot', requestBody)
                if (!data || !Array.isArray(data)) {
                    console.error('Invalid candle data format:', data)
                    throw new Error('Invalid candle data format')
                }

                // map api response to our format (api uses uppercase field names)
                const normalizedCandles: HyperliquidCandle[] = data
                    .map((candle: Record<string, string | number>) => {
                        const timestamp = Number(candle.t || candle.T)
                        // validate timestamp
                        if (isNaN(timestamp) || timestamp <= 0) {
                            console.warn('Invalid candle timestamp:', candle)
                            return null
                        }
                        return {
                            t: timestamp,
                            o: String(candle.o || candle.O),
                            h: String(candle.h || candle.H),
                            l: String(candle.l || candle.L),
                            c: String(candle.c || candle.C),
                            v: String(candle.v || candle.V),
                        }
                    })
                    .filter((candle): candle is HyperliquidCandle => candle !== null)

                candleMapRef.current.clear()
                normalizedCandles.forEach((candle: HyperliquidCandle) => {
                    candleMapRef.current.set(candle.t, candle)
                })

                setCandles(normalizedCandles)
                setCachedCandles(cacheKey, normalizedCandles) // cache for instant load
            } catch (err) {
                console.error('Error fetching candles:', err)
                setError(err instanceof Error ? err.message : 'Failed to fetch candles')
            } finally {
                setIsLoading(false)
            }
        },
        [lookbackHours, getCachedCandles, setCachedCandles, cacheKey],
    )

    const handleCandleUpdate = useCallback(
        (data: unknown) => {
            // guard: invalid data
            if (!data || typeof data !== 'object' || data === null) return

            const candleData = data as WebSocketCandleData['data']
            if (!candleData.t || !candleData.o || !candleData.h || !candleData.l || !candleData.c || !candleData.v) return

            const newCandle: HyperliquidCandle = {
                t: candleData.t,
                o: candleData.o,
                h: candleData.h,
                l: candleData.l,
                c: candleData.c,
                v: candleData.v,
            }

            // always update the candle map with latest data
            candleMapRef.current.set(newCandle.t, newCandle)

            // create new sorted array for state update
            const sortedCandles = Array.from(candleMapRef.current.values()).sort((a, b) => a.t - b.t)
            setCandles(sortedCandles)
            setCachedCandles(`${symbol}:${currentInterval}`, sortedCandles) // cache updates
            setIsConnected(true)
        },
        [symbol, currentInterval, setCachedCandles],
    )

    const changeInterval = useCallback((newInterval: CandleInterval) => {
        setCurrentInterval(newInterval)
    }, [])

    useEffect(() => {
        // clear candle map when symbol changes
        if (previousSymbolRef.current !== symbol) {
            candleMapRef.current.clear()
            setCandles([])
            previousSymbolRef.current = symbol
        }

        fetchCandles(symbol, currentInterval)

        unsubscribeRef.current = hyperliquidWS.subscribe(
            {
                type: HyperliquidWebSocketSubscriptionType.CANDLE,
                coin: symbol,
                interval: currentInterval,
            },
            handleCandleUpdate,
        )

        return () => {
            if (unsubscribeRef.current) unsubscribeRef.current()
            unsubscribeRef.current = null
        }
    }, [symbol, currentInterval, fetchCandles, handleCandleUpdate, setCachedCandles])

    // connection status is updated via WebSocket callbacks

    return {
        candles,
        isLoading,
        isConnected,
        error,
        changeInterval,
    }
}
