'use client'

import { useEffect, useRef } from 'react'
import { subscriptionManager } from '@/services/subscription-manager'
import { HyperliquidWebSocketSubscriptionType } from '@/enums'
import { useMarketStore } from '@/stores/market.store'

// subscribes to active asset context for the selected market
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
                console.log('Active asset context update:', data)

                // extract relevant kpis from the data
                const ctx = data as Record<string, unknown>
                if (ctx?.markPx) {
                    updateMarketKPIs({
                        markPx: parseFloat(String(ctx.markPx)),
                        oraclePx: ctx.oraclePx ? parseFloat(String(ctx.oraclePx)) : undefined,
                        funding: ctx.funding ? parseFloat(String(ctx.funding)) : undefined,
                        openInterest: ctx.openInterest ? parseFloat(String(ctx.openInterest)) : undefined,
                        prevDayPx: ctx.prevDayPx ? parseFloat(String(ctx.prevDayPx)) : undefined,
                    })
                }
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
