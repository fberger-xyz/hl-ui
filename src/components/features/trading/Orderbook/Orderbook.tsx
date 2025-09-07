'use client'

import { useMemo, useEffect } from 'react'
import { useHyperliquidOrderbook } from '@/hooks/useHyperliquidOrderbook'
import numeral from 'numeral'
import { formatAmount, withMemo } from '@/utils'
import { useMarketStore } from '@/stores/market.store'
import { showNotImplementedToast } from '@/utils/toast'

interface OrderbookProps {
    levels?: number
}

function Orderbook({ levels = 11 }: OrderbookProps = {}) {
    // get symbol directly from store
    const selectedMarket = useMarketStore((state) => state.selectedMarket)
    const subscribeToMarket = useMarketStore((state) => state.subscribeToMarket)
    const symbol = selectedMarket?.symbol || 'BTC'

    // ensure market subscription is active
    useEffect(() => {
        if (!symbol) return
        subscribeToMarket(symbol)
    }, [symbol, subscribeToMarket])

    const { bids, asks, spread, spreadPercentage, isLoading } = useHyperliquidOrderbook({
        symbol,
        levels,
    })

    // calculate max total for depth visualization
    const maxTotal = useMemo(() => {
        const allTotals = [...bids, ...asks].map((level) => parseFloat(level.total || level.sz))
        return Math.max(...allTotals, 1)
    }, [bids, asks])

    if (isLoading && bids.length === 0)
        return (
            <div className="flex h-full min-h-[600px] items-center justify-center rounded-b bg-hlb-21 text-hlt-17">
                <div className="text-center">
                    <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-hlr-5 border-t-transparent" />
                </div>
            </div>
        )

    return (
        <div className="flex h-full flex-col overflow-hidden rounded-b bg-hlb-21 text-hlt-2" role="table" aria-label="Order book">
            {/* Header */}
            <header className="px-2 pt-2 text-hlt-17" style={{ display: 'grid', gridTemplateColumns: '20% 40% 40%' }}>
                <p>Price</p>
                <p className="truncate text-right">Size ({symbol})</p>
                <p className="truncate text-right">Total ({symbol})</p>
            </header>

            {/* Asks (sells) - highest price at top, best ask at bottom */}
            <div className="flex-1 overflow-hidden" role="rowgroup" aria-label="Ask orders">
                <div className="flex h-full flex-col-reverse gap-0.5">
                    {asks.slice(0, levels).map((ask, index) => {
                        const depth = (parseFloat(ask.total || ask.sz) / maxTotal) * 100
                        return (
                            <button
                                key={`ask-${index}`}
                                onClick={() => showNotImplementedToast('Order placement from orderbook not yet implemented')}
                                className="relative hover:bg-hlb-19 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                                style={{ display: 'grid', gridTemplateColumns: '20% 40% 40%', height: '23px' }}
                                role="row"
                                aria-label={`Ask order: ${formatAmount(ask.px, '')} price, ${formatAmount(ask.sz, '')} size`}
                                tabIndex={0}>
                                <span className="pointer-events-none absolute left-0 top-0 h-full bg-red-500/15" style={{ width: `${depth}%` }} />
                                <p className="leading-[23px] text-hlt-12" style={{ paddingLeft: '10px', height: '23px', zIndex: 2 }}>
                                    {formatAmount(ask.px, '')}
                                </p>
                                <p className="text-right leading-[23px] text-hlt-2" style={{ paddingRight: '3px', zIndex: 2 }}>
                                    {formatAmount(ask.sz, '')}
                                </p>
                                <p className="text-right leading-[23px] text-hlt-17" style={{ paddingRight: '10px', zIndex: 2 }}>
                                    {formatAmount(ask.total || ask.sz, '')}
                                </p>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Spread section */}
            <section className="flex h-[23px] items-center justify-center gap-8 bg-hlb-13" aria-label="Market spread information">
                <p className="leading-[23px] text-hlt-2">Spread</p>
                <p className="leading-[23px] text-hlt-2" aria-label={`Spread amount: ${numeral(spread).format('0,0.[00000000000]')}`}>
                    {numeral(spread).format('0,0.[00000000000]')}
                </p>
                <p
                    className="leading-[23px] text-hlt-2"
                    aria-label={`Spread percentage: ${numeral(spreadPercentage).divide(100).format('0,0.[0000]%')}`}>
                    {numeral(spreadPercentage).divide(100).format('0,0.[0000]%')}
                </p>
            </section>

            {/* Bids (buys) */}
            <div className="flex-1 overflow-hidden" role="rowgroup" aria-label="Bid orders">
                <div className="flex h-full flex-col gap-0.5">
                    {bids.slice(0, levels).map((bid, index) => {
                        const depth = (parseFloat(bid.total || bid.sz) / maxTotal) * 100
                        return (
                            <button
                                key={`bid-${index}`}
                                onClick={() => showNotImplementedToast('Order placement from orderbook not yet implemented')}
                                className="relative hover:bg-hlb-19 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                                style={{ display: 'grid', gridTemplateColumns: '20% 40% 40%', height: '23px' }}
                                role="row"
                                aria-label={`Bid order: ${formatAmount(bid.px, '')} price, ${formatAmount(bid.sz, '')} size`}
                                tabIndex={0}>
                                <span className="pointer-events-none absolute left-0 top-0 h-full bg-green-500/15" style={{ width: `${depth}%` }} />
                                <p className="leading-[23px] text-hlt-13" style={{ paddingLeft: '10px', height: '23px', zIndex: 2 }}>
                                    {formatAmount(bid.px, '')}
                                </p>
                                <p className="text-right leading-[23px] text-hlt-2" style={{ paddingRight: '3px', zIndex: 2 }}>
                                    {formatAmount(bid.sz, '')}
                                </p>
                                <p className="text-right leading-[23px] text-hlt-2" style={{ paddingRight: '10px', zIndex: 2 }}>
                                    {formatAmount(bid.total || bid.sz, '')}
                                </p>
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default withMemo(Orderbook)
