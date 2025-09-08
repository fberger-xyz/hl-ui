'use client'

import { useEffect } from 'react'
import { useHyperliquidMarkets } from '@/hooks/useHyperliquidMarkets'
import { useMarketStore } from '@/stores/market.store'

export function useMarketInitialization() {
    const { markets } = useHyperliquidMarkets('perps')
    const initializeDefaultMarket = useMarketStore((state) => state.initializeDefaultMarket)

    useEffect(() => {
        // initialize default market when markets load
        if (markets.length > 0) {
            initializeDefaultMarket(markets)
        }
    }, [markets, initializeDefaultMarket])
}
