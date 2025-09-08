'use client'

import PageWrapper from '@/components/shared/Wrappers/PageWrapper'
import { TradeTemplate } from '@/components/templates/TradeTemplate'
import TradeTables from '@/components/features/trading/TradeTables'
import OrderbookAndTrades from '@/components/features/trading/OrderbookAndTrades'
import TradePanel from '@/components/features/trading/TradePanel'
import TradingChart from '@/components/features/trading/TradingChart'
import TradePairSelector from '@/components/features/trading/TradePairSelector'
import TradePairKPIs from '@/components/features/trading/TradePairKPIs'
import FavoriteMarkets from '@/components/features/trading/FavoriteMarkets'
import { useMarketInitialization } from '@/hooks/useMarketInitialization'
import { useTradesSubscription } from '@/hooks/useTradesSubscription'
import { useGlobalWebData } from '@/hooks/useGlobalWebData'

export default function TradeClient() {
    // initialize market data and subscriptions
    useMarketInitialization()
    useTradesSubscription()
    useGlobalWebData() // global market data

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
