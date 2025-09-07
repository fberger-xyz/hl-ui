'use client'

import { useMarketStore } from '@/stores/market.store'
import SpotTradePanel from '@/components/features/trading/SpotTradePanel/SpotTradePanel'
import PerpTradePanel from '@/components/features/trading/PerpTradePanel/PerpTradePanel'

export default function TradePanel() {
    const { selectedMarket } = useMarketStore()

    const isSpot = selectedMarket?.type === 'spot'

    return isSpot ? <SpotTradePanel /> : <PerpTradePanel />
}
