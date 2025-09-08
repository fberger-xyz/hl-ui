import { useCallback, useEffect, useRef, useState } from 'react'
import { subscriptionManager } from '@/services/subscription-manager'
import { HyperliquidWebSocketSubscriptionType } from '@/enums'
import type { L2BookData } from '@/types/hyperliquid.types'
import type { OrderbookData } from '@/types/trading.types'

let hookInstanceCount = 0

interface UseHyperliquidOrderbookOptions {
    symbol: string
    levels?: number
}

export function useHyperliquidOrderbook({ symbol, levels = 20 }: UseHyperliquidOrderbookOptions): OrderbookData & {
    isLoading: boolean
    isConnected: boolean
    error: string | null
} {
    const instanceId = useRef(++hookInstanceCount)
    const firstRender = useRef(true)

    if (firstRender.current) {
        console.log(`useHyperliquidOrderbook[${instanceId.current}] CREATED for symbol:`, symbol)
        firstRender.current = false
    }

    const [orderbook, setOrderbook] = useState<OrderbookData>({
        bids: [],
        asks: [],
        spread: 0,
        spreadPercentage: 0,
        midPrice: 0,
        lastUpdateTime: Date.now(),
    })
    const [isLoading, setIsLoading] = useState(true)
    const [isConnected, setIsConnected] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const unsubscribeRef = useRef<(() => void) | null>(null)

    // throttle: 250ms (4 fps) for ui performance
    const lastUpdateTimeRef = useRef(0)

    // ref prevents callback recreation breaking throttle
    const levelsRef = useRef(levels)
    levelsRef.current = levels

    const handleOrderbookUpdateFromWebSocket = useCallback(
        (data: unknown) => {
            const now = Date.now()
            const timeSinceLastUpdate = now - lastUpdateTimeRef.current
            console.log(
                `[Hook ${instanceId.current}] Orderbook WS callback. Time since last: ${timeSinceLastUpdate}ms, Last ref: ${lastUpdateTimeRef.current}`,
            )

            // throttle high-freq orderbook updates
            if (timeSinceLastUpdate < 250) {
                console.log(`[Hook ${instanceId.current}] THROTTLED ${timeSinceLastUpdate}ms`)
                return
            }
            lastUpdateTimeRef.current = now
            console.log(`[Hook ${instanceId.current}] ACCEPTED`)

            if (!data || typeof data !== 'object') return

            const orderbookData = data as L2BookData
            if (!orderbookData.levels || !Array.isArray(orderbookData.levels)) return

            // Process inline to avoid stale closure
            const bidsArray = Array.isArray(orderbookData.levels) && Array.isArray(orderbookData.levels[0]) ? orderbookData.levels[0] : []
            const asksArray = Array.isArray(orderbookData.levels) && Array.isArray(orderbookData.levels[1]) ? orderbookData.levels[1] : []

            let runningBidTotal = 0
            const bids = bidsArray.slice(0, levelsRef.current).map((level: [string, string] | { px: string; sz: string }) => {
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
            const asks = asksArray.slice(0, levelsRef.current).map((level: [string, string] | { px: string; sz: string }) => {
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

            setOrderbook({
                bids,
                asks,
                spread,
                spreadPercentage,
                midPrice,
                lastUpdateTime: Date.now(),
            })
            setIsConnected(true)
            setIsLoading(false)
            setError(null)
        },
        [], // empty deps: preserve throttle state
    )

    useEffect(() => {
        console.log('Orderbook useEffect running for symbol:', symbol)
        if (!symbol) return

        // reset state on symbol change
        setIsLoading(true)
        setError(null)

        console.log('Creating new orderbook subscription')
        unsubscribeRef.current = subscriptionManager.subscribe(
            {
                type: HyperliquidWebSocketSubscriptionType.L2_BOOK,
                coin: symbol,
                nSigFigs: undefined, // undefined = full precision
            },
            handleOrderbookUpdateFromWebSocket,
        )

        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current()
                unsubscribeRef.current = null
            }
        }
    }, [symbol, handleOrderbookUpdateFromWebSocket])

    return {
        ...orderbook,
        isLoading,
        isConnected,
        error,
    }
}
