import { useCallback, useEffect, useRef, useState } from 'react'
import { hyperliquidWS } from '@/services/hyperliquid-websocket-client'
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
    const [error] = useState<string | null>(null)
    const tradesRef = useRef<Trade[]>([])
    const unsubscribeRef = useRef<(() => void) | null>(null)

    const handleNewTrade = useCallback(
        (data: unknown) => {
            // handle array of trades from websocket
            if (Array.isArray(data)) {
                const validTrades = data.filter(
                    (item): item is Trade => item && typeof item === 'object' && 'px' in item && 'sz' in item && 'time' in item,
                )

                if (validTrades.length > 0) {
                    // add new trades to the beginning and limit total
                    const newTrades = [...validTrades, ...tradesRef.current].slice(0, limit)
                    // only update if changed
                    if (JSON.stringify(newTrades.slice(0, 5)) !== JSON.stringify(tradesRef.current.slice(0, 5))) {
                        tradesRef.current = newTrades
                        setTrades([...tradesRef.current])
                    }
                    setIsConnected(true)
                }
            } else if (data && typeof data === 'object' && data !== null) {
                // handle single trade
                const trade = data as Trade
                if (trade.px && trade.sz && trade.time) {
                    const newTrades = [trade, ...tradesRef.current].slice(0, limit)
                    // only update if new trade
                    if (!tradesRef.current[0] || tradesRef.current[0].tid !== trade.tid) {
                        tradesRef.current = newTrades
                        setTrades([...tradesRef.current])
                    }
                    setIsConnected(true)
                }
            }
        },
        [limit],
    )

    useEffect(() => {
        // clear trades when symbol changes
        tradesRef.current = []
        setTrades([])
        setIsLoading(true)

        // fetch initial trades via rest api
        const fetchInitialTrades = async () => {
            try {
                const response = await hyperliquidWS.fetchInfo('recentTrades', { coin: symbol })
                if (Array.isArray(response)) {
                    const validTrades = response
                        .filter((item): item is Trade => item && typeof item === 'object' && 'px' in item && 'sz' in item && 'time' in item)
                        .slice(0, limit)

                    tradesRef.current = validTrades
                    setTrades(validTrades)
                }
            } catch (error) {
                console.error('Failed to fetch initial trades:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchInitialTrades()

        // subscribe to websocket updates
        unsubscribeRef.current = hyperliquidWS.subscribe(
            {
                type: HyperliquidWebSocketSubscriptionType.TRADES,
                coin: symbol,
            },
            handleNewTrade,
        )

        return () => {
            if (unsubscribeRef.current) unsubscribeRef.current()
            unsubscribeRef.current = null
        }
    }, [symbol, handleNewTrade, limit])

    // connection status is updated via WebSocket callbacks

    return {
        trades,
        isLoading,
        isConnected,
        error,
    }
}
