'use client'

import { useEffect } from 'react'
import PageWrapper from '@/components/shared/Wrappers/PageWrapper'
import { TradeTemplate } from '@/components/templates/TradeTemplate'
import TradeTables from '@/components/features/trading/TradeTables'
import OrderbookAndTrades from '@/components/features/trading/OrderbookAndTrades'
import TradePanel from '@/components/features/trading/TradePanel'
import TradingChart from '@/components/features/trading/TradingChart'
import TradePairSelector from '@/components/features/trading/TradePairSelector'
import TradePairKPIs from '@/components/features/trading/TradePairKPIs'
import FavoriteMarkets from '@/components/features/trading/FavoriteMarkets'
import { useHyperliquidMarkets } from '@/hooks/useHyperliquidMarkets'
import { useMarketStore } from '@/stores/market.store'
import { useUiStore } from '@/stores/ui.store'

export default function TradeClient() {
    const { selectedMarket, setSelectedMarket } = useMarketStore()
    const { setCurrentSymbol } = useUiStore()
    const { markets } = useHyperliquidMarkets('perps')

    // set default market on initial load if no market is selected
    useEffect(() => {
        if (selectedMarket || markets.length === 0) return
        // try to find btc market first, otherwise use the first available market
        const btcMarket = markets.find((m) => m.symbol === 'BTC' && m.type === 'perp')
        const defaultMarket = btcMarket || markets[0]
        if (!defaultMarket) return
        setSelectedMarket(defaultMarket)
        setCurrentSymbol(defaultMarket.symbol)
    }, [markets, selectedMarket, setSelectedMarket, setCurrentSymbol])

    return (
        <PageWrapper>
            <TradeTemplate
                pairs={{
                    favorites: <FavoriteMarkets />,
                    selector: (
                        <div className="flex h-[63px] items-center gap-8 px-2">
                            <TradePairSelector />
                            <TradePairKPIs />
                        </div>
                    ),
                    charts: <TradingChart />,
                }}
                tables={<TradeTables />}
                orderbook={<OrderbookAndTrades />}
                panel={<TradePanel />}
            />
        </PageWrapper>
    )
}
