import { useCallback, useEffect, useRef, useState } from 'react'
import { hyperliquidWS } from '@/services/hyperliquid-websocket'
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
    const [candles, setCandles] = useState<HyperliquidCandle[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isConnected, setIsConnected] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [currentInterval, setCurrentInterval] = useState(interval)

    const candleMapRef = useRef(new Map<number, HyperliquidCandle>())
    const unsubscribeRef = useRef<(() => void) | null>(null)
    const lastUpdateTimeRef = useRef(0)
    const symbolRef = useRef(symbol)
    const intervalRef = useRef(currentInterval)

    // keep refs updated
    symbolRef.current = symbol
    intervalRef.current = currentInterval

    const fetchInitialCandlesFromRest = useCallback(
        async (sym: string, int: CandleInterval) => {
            try {
                setIsLoading(true)
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
                    throw new Error('Invalid candle data format')
                }

                // normalize candle data
                const normalizedCandles: HyperliquidCandle[] = data
                    .map((candle: Record<string, string | number>) => {
                        const timestamp = Number(candle.t || candle.T)
                        if (isNaN(timestamp) || timestamp <= 0) return null
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

                // rebuild candle map
                candleMapRef.current.clear()
                normalizedCandles.forEach((candle) => {
                    candleMapRef.current.set(candle.t, candle)
                })

                setCandles(normalizedCandles)
            } catch (err) {
                console.error('Error fetching candles:', err)
                setError(err instanceof Error ? err.message : 'Failed to fetch candles')
            } finally {
                setIsLoading(false)
            }
        },
        [lookbackHours],
    )

    // throttle to 100ms for consistent updates
    const handleCandleUpdateFromWebSocket = useCallback((data: unknown) => {
        const now = Date.now()
        // throttle: 100ms between updates
        if (now - lastUpdateTimeRef.current < 100) return
        lastUpdateTimeRef.current = now

        if (!data || typeof data !== 'object') return

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

        // update or add candle
        candleMapRef.current.set(newCandle.t, newCandle)

        // sort and update state
        const sortedCandles = Array.from(candleMapRef.current.values()).sort((a, b) => a.t - b.t)
        setCandles(sortedCandles)
        setIsConnected(true)
        setIsLoading(false)
        setError(null)
    }, [])

    const changeInterval = useCallback((newInterval: CandleInterval) => {
        setCurrentInterval(newInterval)
        // clear existing data when interval changes
        candleMapRef.current.clear()
        setCandles([])
    }, [])

    useEffect(() => {
        if (!symbol || !currentInterval) return

        // fetch initial data from REST
        fetchInitialCandlesFromRest(symbol, currentInterval)

        // subscribe to websocket updates
        unsubscribeRef.current = hyperliquidWS.subscribe(
            {
                type: HyperliquidWebSocketSubscriptionType.CANDLE,
                coin: symbol,
                interval: currentInterval,
            },
            handleCandleUpdateFromWebSocket,
        )

        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current()
                unsubscribeRef.current = null
            }
        }
    }, [symbol, currentInterval, fetchInitialCandlesFromRest, handleCandleUpdateFromWebSocket])

    return {
        candles,
        isLoading,
        isConnected,
        error,
        changeInterval,
    }
}
