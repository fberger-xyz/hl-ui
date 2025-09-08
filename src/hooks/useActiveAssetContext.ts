'use client'

import { useEffect, useRef } from 'react'
import { subscriptionManager } from '@/services/subscription-manager'
import { HyperliquidWebSocketSubscriptionType } from '@/enums'
import { useMarketStore } from '@/stores/market.store'
import type { MarketKPIs } from '@/types/trading.types'

// subscribes to active asset context
export function useActiveAssetContext() {
    const selectedMarket = useMarketStore((state) => state.selectedMarket)
    const updateMarketKPIs = useMarketStore((state) => state.updateMarketKPIs)
    const unsubscribeRef = useRef<(() => void) | null>(null)

    useEffect(() => {
        const symbol = selectedMarket?.symbol
        if (!symbol) return

        // cleanup previous subscription
        if (unsubscribeRef.current) {
            unsubscribeRef.current()
            unsubscribeRef.current = null
        }

        // subscribe to active asset context
        unsubscribeRef.current = subscriptionManager.subscribe(
            {
                type: HyperliquidWebSocketSubscriptionType.ACTIVE_ASSET_CTX,
                coin: symbol,
            },
            (data) => {
                // handle asset context updates
                const ctx = data as Record<string, unknown>

                // log updates in dev mode
                if (process.env.NODE_ENV === 'development') {
                    console.log('Active asset context update for', symbol, ':', ctx)
                }

                // update all available kpis
                const updates: Partial<MarketKPIs> = {}

                if (ctx?.markPx !== undefined) updates.markPx = parseFloat(String(ctx.markPx))
                if (ctx?.oraclePx !== undefined) updates.oraclePx = parseFloat(String(ctx.oraclePx))
                if (ctx?.funding !== undefined) updates.funding = parseFloat(String(ctx.funding))
                if (ctx?.openInterest !== undefined) updates.openInterest = parseFloat(String(ctx.openInterest))
                if (ctx?.prevDayPx !== undefined) updates.prevDayPx = parseFloat(String(ctx.prevDayPx))

                // only update if we have data
                if (Object.keys(updates).length > 0) updateMarketKPIs(updates)
            },
        )

        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current()
                unsubscribeRef.current = null
            }
        }
    }, [selectedMarket?.symbol, updateMarketKPIs])
}
