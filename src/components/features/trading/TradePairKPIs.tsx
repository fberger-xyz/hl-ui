'use client'

import TextWithTooltip from '@/components/primitives/Tooltip/TextWithTooltip'
import { useMarketStore } from '@/stores/market.store'
import { cn, formatAmount, withMemo } from '@/utils'
import numeral from 'numeral'
import { useEffect } from 'react'

function TradePairKPIs() {
    const selectedMarket = useMarketStore((state) => state.selectedMarket)
    const marketKPIs = useMarketStore((state) => state.marketKPIs)
    const subscribeToMarket = useMarketStore((state) => state.subscribeToMarket)

    // calculate values - move before any conditional returns
    const markPx = marketKPIs?.markPx || Number(selectedMarket?.px || '0')
    const prevPx = marketKPIs?.prevDayPx || markPx * (1 - (selectedMarket?.changePercent24h || 0) / 100)
    const change24hAbs = marketKPIs?.change24hAbs || markPx - prevPx

    // subscribe to market updates when selected market changes
    useEffect(() => {
        if (!selectedMarket?.symbol) return
        subscribeToMarket(selectedMarket.symbol)
    }, [selectedMarket?.symbol, subscribeToMarket])

    // update document title with real-time price
    useEffect(() => {
        if (!selectedMarket) return
        const price = numeral(markPx || selectedMarket.px || 0).format('0,0.00')
        const symbol = selectedMarket.symbol
        document.title = `${price} | ${symbol} | Hyperliquid`
    }, [selectedMarket, markPx])

    // show skeleton loader while market data is loading - after all hooks
    if (!selectedMarket) {
        return (
            <section className="no-scrollbar flex grow gap-8 overflow-x-auto overflow-y-hidden">
                {[1, 2, 3, 4, 5].map((i) => (
                    <article key={i} className="flex flex-shrink-0 flex-col gap-1">
                        <div className="h-4 w-20 animate-pulse rounded bg-hlb-19" />
                        <div className="h-6 w-24 animate-pulse rounded bg-hlb-19" />
                    </article>
                ))}
            </section>
        )
    }

    const displayData = {
        markPx,
        oraclePx: marketKPIs?.oraclePx || Number(selectedMarket.px || '0'),
        change24h: selectedMarket.changePercent24h || 0,
        change24hAbs,
        dayNtlVlm: Number(selectedMarket.dayNtlVlm || '0'),
        openInterest: Number(selectedMarket.openInterest || '0'),
        funding: parseFloat(selectedMarket.funding || '0'),
    }

    // different kpis for spot vs perp markets
    const isSpot = selectedMarket.type === 'spot'

    return (
        <section className="no-scrollbar flex gap-8 overflow-x-auto overflow-y-hidden">
            {/* Price (for spot) or Mark (for perp) */}
            <article className="flex flex-shrink-0 flex-col gap-1">
                {isSpot ? (
                    <>
                        <p className="text-hlt-17">Price</p>
                        {/* <p className="truncate text-hlt-2">{formatAmount(displayData.markPrice)}</p> */}
                        <p className="truncate text-hlt-2">{numeral(displayData.markPx).format('$0,0.00')}</p>
                    </>
                ) : (
                    <>
                        <TextWithTooltip
                            tooltip={{
                                text: 'Used for margining, computing unrealized PNL, liquidations, and triggering TP/SL orders',
                            }}
                            text="Mark"
                        />
                        {/* <p className="truncate text-hlt-2">{formatAmount(displayData.markPrice)}</p> */}
                        <p className="truncate text-hlt-2">{numeral(displayData.markPx).format('$0,0.00')}</p>
                    </>
                )}
            </article>

            {/* oracle - only for perp */}
            {!isSpot && (
                <article className="flex flex-shrink-0 flex-col gap-1">
                    <TextWithTooltip
                        tooltip={{
                            text: 'The median of external prices reported by validators, used for computing funding rates',
                        }}
                        text="Oracle"
                    />
                    <p className="truncate text-hlt-2">{numeral(displayData.oraclePx).format('$0,0.00')}</p>
                </article>
            )}

            {/* 24h change */}
            <article className="flex flex-shrink-0 flex-col gap-1">
                <TextWithTooltip
                    tooltip={{
                        text: 'Price change in the last 24 hours',
                    }}
                    text="24h Change"
                />
                <p className={cn('', displayData.change24h >= 0 ? 'text-hlt-13' : 'text-hlt-12')}>
                    {formatAmount(displayData.change24hAbs, '')} / {numeral(displayData.change24h).format('0,0.[00]')}%
                </p>
            </article>

            {/* 24h volume */}
            <article className="flex flex-shrink-0 flex-col gap-1">
                <p className="text-hlt-17">24h Volume</p>
                <p className="truncate text-hlt-2">{numeral(displayData.dayNtlVlm).format('$0,0.00')}</p>
            </article>

            {/* Open Interest */}
            <article className="flex flex-shrink-0 flex-col gap-1">
                <TextWithTooltip
                    tooltip={{
                        text: 'Two sided-open interest: the sum of long and short positions on this contract',
                    }}
                    text="Open Interest"
                />
                <p className="truncate text-hlt-2">{numeral(displayData.openInterest).format('$0,0.00')}</p>
            </article>

            {/* Funding / Countdown - only for perp markets */}
            {selectedMarket?.type === 'perp' && (
                <article className="flex flex-shrink-0 flex-col gap-1">
                    <TextWithTooltip
                        tooltip={{
                            text: 'The hourly rate at which longs pay shorts (if negative, shorts pay longs). There are no fees associated with funding, which is a peer-to-peer transfer between users to push prices towards the spot price. See Docs for details.',
                        }}
                        text="Funding / Countdown"
                    />
                    <div className="flex items-center gap-2">
                        <p className={cn('', displayData.funding >= 0 ? 'text-hlt-8' : 'text-hlt-12')}>
                            {numeral(displayData.funding * 100).format('0,0.[0000]')}%
                        </p>
                        {/* removed countdown timer to prevent re-renders */}
                    </div>
                </article>
            )}
        </section>
    )
}

export default withMemo(TradePairKPIs)
