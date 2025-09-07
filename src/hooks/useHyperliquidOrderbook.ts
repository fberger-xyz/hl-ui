import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { hyperliquidWS } from '@/services/hyperliquid-websocket-client'
import { HyperliquidWebSocketSubscriptionType } from '@/enums'
import { throttle } from '@/utils'
import { useCacheStore } from '@/stores/cache.store'
import type { L2BookData } from '@/types/hyperliquid.types'
import type { OrderbookData } from '@/types/trading.types'

interface UseHyperliquidOrderbookOptions {
    symbol: string
    levels?: number
}

export function useHyperliquidOrderbook({ symbol, levels = 20 }: UseHyperliquidOrderbookOptions): OrderbookData & {
    isLoading: boolean
    isConnected: boolean
    error: string | null
} {
    const { getCachedOrderbook, setCachedOrderbook } = useCacheStore()

    // process orderbook data function
    const processOrderbookData = useCallback(
        (data: L2BookData): OrderbookData => {
            const bidsArray = Array.isArray(data.levels) && Array.isArray(data.levels[0]) ? data.levels[0] : []
            const asksArray = Array.isArray(data.levels) && Array.isArray(data.levels[1]) ? data.levels[1] : []

            let runningBidTotal = 0
            const bids = bidsArray.slice(0, levels).map((level: [string, string] | { px: string; sz: string }) => {
                const px = Array.isArray(level) ? level[0] : level.px
                const sz = Array.isArray(level) ? level[1] : level.sz
                runningBidTotal += parseFloat(sz)
                return {
                    px: String(px),
                    sz: String(sz),
                    total: runningBidTotal.toFixed(4),
                }
            })

            let runningAskTotal = 0
            const asks = asksArray.slice(0, levels).map((level: [string, string] | { px: string; sz: string }) => {
                const px = Array.isArray(level) ? level[0] : level.px
                const sz = Array.isArray(level) ? level[1] : level.sz
                runningAskTotal += parseFloat(sz)
                return {
                    px: String(px),
                    sz: String(sz),
                    total: runningAskTotal.toFixed(4),
                }
            })

            const bestBid = parseFloat(bids[0]?.px || '0')
            const bestAsk = parseFloat(asks[0]?.px || '0')
            const spread = bestAsk - bestBid
            const midPrice = (bestBid + bestAsk) / 2
            const spreadPercentage = midPrice > 0 ? (spread / midPrice) * 100 : 0

            return {
                bids,
                asks,
                spread,
                spreadPercentage,
                midPrice,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                lastUpdateTime: (data as any).time || Date.now(),
            }
        },
        [levels],
    )

    // initialize with cached data
    const [orderbook, setOrderbook] = useState<OrderbookData>(() => {
        const cached = getCachedOrderbook(symbol)
        if (cached) return processOrderbookData(cached)
        return {
            bids: [],
            asks: [],
            spread: 0,
            spreadPercentage: 0,
            midPrice: 0,
            lastUpdateTime: Date.now(),
        }
    })
    const [isLoading, setIsLoading] = useState(true)
    const [isConnected, setIsConnected] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const unsubscribeRef = useRef<(() => void) | null>(null)

    const fetchOrderbook = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)

            const data = await hyperliquidWS.fetchInfo('l2Book', {
                coin: symbol,
                nSigFigs: 5,
            })

            const orderbookData = data as L2BookData
            // guard: invalid data
            if (!orderbookData || !orderbookData.levels) throw new Error('Invalid orderbook data structure')

            const processedData = processOrderbookData(orderbookData)
            setOrderbook(processedData)
            setCachedOrderbook(symbol, orderbookData) // cache raw data
            setIsConnected(true)
        } catch (err) {
            console.error('Error fetching orderbook:', err)
            setError(err instanceof Error ? err.message : 'Failed to fetch orderbook')
        } finally {
            setIsLoading(false)
        }
    }, [symbol, processOrderbookData, setCachedOrderbook])

    // throttle updates to 30fps for smooth ui without overwhelming
    const handleOrderbookUpdate = useMemo(
        () =>
            throttle((data: unknown) => {
                // guard: invalid data
                if (!data || typeof data !== 'object' || data === null) return

                const orderbookData = data as L2BookData
                // guard: no levels
                if (!orderbookData.levels || !Array.isArray(orderbookData.levels)) return

                const processedData = processOrderbookData(orderbookData)
                setOrderbook(processedData)
                setCachedOrderbook(symbol, orderbookData) // cache raw data
                setIsConnected(true)
            }, 33), // 33ms = ~30fps
        [processOrderbookData, setCachedOrderbook, symbol],
    )

    useEffect(() => {
        fetchOrderbook()

        unsubscribeRef.current = hyperliquidWS.subscribe(
            {
                type: HyperliquidWebSocketSubscriptionType.L2_BOOK,
                coin: symbol,
            },
            handleOrderbookUpdate,
        )

        return () => {
            if (unsubscribeRef.current) unsubscribeRef.current()
            unsubscribeRef.current = null
        }
    }, [symbol, fetchOrderbook, handleOrderbookUpdate])

    // connection status is updated via WebSocket callbacks

    return {
        ...orderbook,
        isLoading,
        isConnected,
        error,
    }
}
