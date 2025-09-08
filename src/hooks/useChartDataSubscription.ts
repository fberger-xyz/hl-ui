import { useEffect, useRef } from 'react'
import { hyperliquidWS } from '@/services/hyperliquid-websocket'
import { subscriptionManager } from '@/services/subscription-manager'
import { HyperliquidWebSocketSubscriptionType } from '@/enums/hyperliquid.enum'
import type { CandleInterval, HyperliquidCandle, WebSocketCandleData } from '@/types/hyperliquid.types'

interface ChartUpdateCallback {
    (candles: HyperliquidCandle[]): void
}

// decoupled chart data: updates outside render cycle
export function useChartDataSubscription(symbol: string, interval: CandleInterval, onUpdate: ChartUpdateCallback) {
    // map deduplicates candles by timestamp
    const candleMapRef = useRef(new Map<number, HyperliquidCandle>())
    const unsubscribeRef = useRef<(() => void) | null>(null)

    useEffect(() => {
        if (!symbol || !interval) return

        // rest: initial historical candles
        const fetchInitialCandles = async () => {
            try {
                const endTime = Date.now()
                const startTime = endTime - 24 * 60 * 60 * 1000 // 24h lookback

                const data = await hyperliquidWS.fetchInfo('candleSnapshot', {
                    req: {
                        coin: symbol,
                        interval,
                        startTime,
                        endTime,
                    },
                })

                if (Array.isArray(data)) {
                    candleMapRef.current.clear()
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

                    normalizedCandles.forEach((candle) => {
                        candleMapRef.current.set(candle.t, candle)
                    })

                    const sortedCandles = Array.from(candleMapRef.current.values()).sort((a, b) => a.t - b.t)
                    console.log('Initial candles fetched:', sortedCandles.length)
                    onUpdate(sortedCandles)
                }
            } catch (error) {
                console.error('Error fetching initial candles:', error)
            }
        }

        fetchInitialCandles()

        // ws: real-time candle updates
        unsubscribeRef.current = subscriptionManager.subscribe(
            {
                type: HyperliquidWebSocketSubscriptionType.CANDLE,
                coin: symbol,
                interval,
            },
            (data: unknown) => {
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

                candleMapRef.current.set(newCandle.t, newCandle)
                const sortedCandles = Array.from(candleMapRef.current.values()).sort((a, b) => a.t - b.t)
                onUpdate(sortedCandles)
            },
        )

        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current()
                unsubscribeRef.current = null
            }
        }
    }, [symbol, interval, onUpdate])
}
