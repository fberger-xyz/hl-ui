'use client'

import React from 'react'
import { useMarketStore } from '@/stores/market.store'
import SpotTradePanel from '@/components/features/trading/SpotTradePanel'
import PerpTradePanel from '@/components/features/trading/PerpTradePanel'

function TradePanel() {
    const selectedMarket = useMarketStore((state) => state.selectedMarket)

    const isSpot = selectedMarket?.type === 'spot'

    return isSpot ? <SpotTradePanel /> : <PerpTradePanel />
}

export default TradePanel
