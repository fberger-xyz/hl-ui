'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { subscriptionManager } from '@/services/subscription-manager'
import { HyperliquidWebSocketSubscriptionType } from '@/enums'
import type { Trade } from '@/types/hyperliquid.types'
import { useMarketStore } from '@/stores/market.store'

// background subscription: trades always active
export function useTradesSubscription() {
    const selectedMarket = useMarketStore((state) => state.selectedMarket)
    const symbol = selectedMarket?.symbol || 'BTC'

    const [trades, setTrades] = useState<Trade[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    const unsubscribeRef = useRef<(() => void) | null>(null)
    const lastUpdateTimeRef = useRef(0)
    const tradesRef = useRef<Trade[]>([])

    const handleTradeUpdate = useCallback((data: unknown) => {
        const now = Date.now()
        // throttle: 500ms for trade tape
        if (now - lastUpdateTimeRef.current < 500) return

        lastUpdateTimeRef.current = now

        const tradeData = data as Trade | Trade[]
        const newTrades = Array.isArray(tradeData) ? tradeData : [tradeData]

        // fifo buffer: keep last 100 trades
        tradesRef.current = [...newTrades, ...tradesRef.current].slice(0, 100)

        // update state
        setTrades(tradesRef.current)
        setIsLoading(false)

        // direct store update avoids prop drilling
        useMarketStore.getState().addTrades(newTrades)
    }, [])

    useEffect(() => {
        if (!symbol) return

        // cleanup previous subscription
        if (unsubscribeRef.current) {
            unsubscribeRef.current()
            unsubscribeRef.current = null
        }

        // reset state on symbol change
        setTrades([])
        setIsLoading(true)
        setError(null)
        tradesRef.current = []

        console.log('Creating trades subscription for:', symbol)

        unsubscribeRef.current = subscriptionManager.subscribe(
            {
                type: HyperliquidWebSocketSubscriptionType.TRADES,
                coin: symbol,
            },
            handleTradeUpdate,
        )

        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current()
                unsubscribeRef.current = null
            }
        }
    }, [symbol, handleTradeUpdate])

    return { trades, isLoading, error }
}
