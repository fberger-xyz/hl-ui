'use client'

import { cn, formatAmount } from '@/utils'
import { memo } from 'react'
import { useMarketStore } from '@/stores/market.store'
import IconWrapper from '@/components/shared/Wrappers/IconWrapper'
import { IconIds } from '@/enums'
import LinkWrapper from '@/components/shared/Wrappers/LinkWrapper'

function Trades() {
    console.log('render: Trades', new Date())

    // get symbol and trades directly from store
    const selectedMarket = useMarketStore((state) => state.selectedMarket)
    const symbol = selectedMarket?.symbol || 'BTC'
    const trades = useMarketStore((state) => state.trades)
    const isLoading = trades.length === 0

    // format time helper
    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp)
        return date.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        })
    }

    // calculate aggregated stats
    // const stats = useMemo(() => {
    //     if (trades.length === 0) return null

    //     const buyVolume = trades.filter((t) => t.side === 'B').reduce((sum, t) => sum + parseFloat(t.sz), 0)

    //     const sellVolume = trades.filter((t) => t.side === 'A').reduce((sum, t) => sum + parseFloat(t.sz), 0)

    //     const totalVolume = buyVolume + sellVolume
    //     const buyPercentage = totalVolume > 0 ? (buyVolume / totalVolume) * 100 : 50

    //     return {
    //         buyVolume,
    //         sellVolume,
    //         totalVolume,
    //         buyPercentage,
    //         sellPercentage: 100 - buyPercentage,
    //     }
    // }, [trades])

    if (isLoading && trades.length === 0) {
        return (
            <div className="flex h-full min-h-[600px] items-center justify-center text-hlt-17">
                <div className="text-center">
                    <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-hlr-5 border-t-transparent" />
                    {/* <p>Waiting for trades...</p> */}
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-full flex-col overflow-hidden rounded-b bg-hlb-21 text-hlt-2" role="table" aria-label="Order book">
            {/* Header */}
            <header className="px-2 pt-2 text-hlt-17" style={{ display: 'grid', gridTemplateColumns: '20% 40% 40%' }}>
                <p>Price</p>
                <p className="truncate text-right">Size ({symbol})</p>
                <p className="truncate text-right">Time</p>
            </header>
            {/* Stats bar */}
            {/* {stats && (
                <div className="mb-2 border-b border-hlr-7 px-2 pb-2">
                    <div className="mb-1 flex h-2 overflow-hidden rounded bg-hlb-19">
                        <div className="bg-hlt-13 transition-all duration-300" style={{ width: `${stats.buyPercentage}%` }} />
                        <div className="bg-hlt-12 transition-all duration-300" style={{ width: `${stats.sellPercentage}%` }} />
                    </div>
                    <div className="flex justify-between text-hlt-17">
                        <span>Buy: {stats.buyVolume.toFixed(4)}</span>
                        <span>Sell: {stats.sellVolume.toFixed(4)}</span>
                    </div>
                </div>
            )} */}

            {/* Header */}
            {/* <header className="grid grid-cols-3 gap-2 px-2 pb-1 text-hlt-17">
                <p>Price</p>
                <p className="truncate text-right">Size</p>
                <p className="truncate text-right">Time</p>
            </header> */}

            {/* Trades list */}
            <section className="flex-1 overflow-y-auto overflow-x-hidden">
                {trades.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-hlt-17">
                        <div className="text-center">
                            {/* <p>No recent trades</p>
                            <p>Waiting for market activity...</p>
                            <span className={cn(isConnected ? 'text-hlt-13' : 'text-hlt-15')}>{isConnected ? '● Connected' : '○ Connecting...'}</span> */}
                            <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-hlr-5 border-t-transparent" />
                        </div>
                    </div>
                ) : (
                    trades.map((trade, index) => {
                        const isBuy = trade.side === 'B'
                        return (
                            <article key={`${trade.tid}-${index}`} className="grid grid-cols-3 gap-2 px-2 py-1 hover:bg-hlb-19">
                                <p className={cn('font-medium', isBuy ? 'text-hlt-13' : 'text-hlt-12')}>{formatAmount(trade.px)}</p>
                                <p className="text-center text-hlt-2">{formatAmount(trade.sz)}</p>
                                <LinkWrapper
                                    href={`https://app.hyperliquid.xyz/explorer/tx/${trade.hash}`}
                                    target="_blank"
                                    className="flex justify-end gap-1">
                                    <p className="text-right">{formatTime(trade.time)}</p>
                                    <IconWrapper id={IconIds.EXTERNAL_LINK_OUTLINE} className="size-3 text-hlt-8" />
                                </LinkWrapper>
                            </article>
                        )
                    })
                )}
            </section>
        </div>
    )
}

export default memo(Trades)
