import { useCallback, useEffect, useRef, useState } from 'react'
import { hyperliquidWS } from '@/services/hyperliquid-websocket'
import { HyperliquidWebSocketSubscriptionType } from '@/enums'
import type { Trade } from '@/types/hyperliquid.types'

interface UseHyperliquidTradesOptions {
    symbol: string
    limit?: number
}

export function useHyperliquidTrades({ symbol, limit = 100 }: UseHyperliquidTradesOptions): {
    trades: Trade[]
    isLoading: boolean
    isConnected: boolean
    error: string | null
} {
    const [trades, setTrades] = useState<Trade[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isConnected, setIsConnected] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const unsubscribeRef = useRef<(() => void) | null>(null)
    const lastUpdateTimeRef = useRef(0)

    // throttle to 100ms for consistent updates
    const handleTradeUpdateFromWebSocket = useCallback(
        (data: unknown) => {
            const now = Date.now()
            // throttle: 500ms between updates (2 fps)
            if (now - lastUpdateTimeRef.current < 500) return
            lastUpdateTimeRef.current = now

            if (!data) return

            // handle both single trade and array of trades
            if (Array.isArray(data)) {
                const validTrades = data.filter(
                    (item): item is Trade => item && typeof item === 'object' && 'px' in item && 'sz' in item && 'time' in item,
                )
                if (validTrades.length > 0) {
                    setTrades((prev) => [...validTrades, ...prev].slice(0, limit))
                }
            } else if (typeof data === 'object') {
                const trade = data as Trade
                if (trade.px && trade.sz && trade.time) {
                    setTrades((prev) => [trade, ...prev].slice(0, limit))
                }
            }

            setIsConnected(true)
            setIsLoading(false)
            setError(null)
        },
        [limit],
    )

    useEffect(() => {
        if (!symbol) return

        // reset state on symbol change
        setTrades([])
        setIsLoading(true)
        setError(null)

        unsubscribeRef.current = hyperliquidWS.subscribe(
            {
                type: HyperliquidWebSocketSubscriptionType.TRADES,
                coin: symbol,
            },
            handleTradeUpdateFromWebSocket,
        )

        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current()
                unsubscribeRef.current = null
            }
        }
    }, [symbol, handleTradeUpdateFromWebSocket])

    return {
        trades,
        isLoading,
        isConnected,
        error,
    }
}
