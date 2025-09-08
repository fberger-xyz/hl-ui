'use client'

import { cn } from '@/utils'
import { useRef, useEffect, useState, useLayoutEffect, useCallback } from 'react'
import { IconIds, NuqsKeys, TradeOrderbookAndTradesTabs } from '@/enums'
import { useQueryState } from 'nuqs'
import IconWrapper from '@/components/shared/Wrappers/IconWrapper'
import Dropdown from '@/components/primitives/Dropdown'
import Orderbook from '@/components/features/trading/Orderbook'
import Trades from '@/components/features/trading/Trades'

// define tabs outside component to prevent recreation
const TABS: TradeOrderbookAndTradesTabs[] = [TradeOrderbookAndTradesTabs.ORDERBOOK, TradeOrderbookAndTradesTabs.TRADES]

function OrderbookAndTrades() {
    console.log('render: OrderbookAndTrades', new Date())
    const [selectedTab, setSelectedTab] = useQueryState(NuqsKeys.ORDERBOOK_AND_TRADES_TABLE, {
        defaultValue: TradeOrderbookAndTradesTabs.ORDERBOOK,
        parse: (value) =>
            Object.values(TradeOrderbookAndTradesTabs).includes(value as TradeOrderbookAndTradesTabs)
                ? (value as TradeOrderbookAndTradesTabs)
                : TradeOrderbookAndTradesTabs.ORDERBOOK,
    })
    const tabRefs = useRef<(HTMLDivElement | null)[]>([])
    const [borderStyle, setBorderStyle] = useState({ left: 0, width: 0 })

    const updateBorderPosition = useCallback(() => {
        const selectedIndex = TABS.indexOf(selectedTab)
        const selectedTabElement = tabRefs.current[selectedIndex]
        if (!selectedTabElement) return
        setBorderStyle({
            left: selectedTabElement.offsetLeft,
            width: selectedTabElement.offsetWidth,
        })
    }, [selectedTab])

    useLayoutEffect(() => {
        updateBorderPosition()
    }, [selectedTab, updateBorderPosition])

    // update on mount and window resize
    useEffect(() => {
        // small delay to ensure dom is ready on initial mount
        const timer = setTimeout(updateBorderPosition, 10)

        window.addEventListener('resize', updateBorderPosition)
        return () => {
            clearTimeout(timer)
            window.removeEventListener('resize', updateBorderPosition)
        }
    }, [updateBorderPosition])

    return (
        <section className="flex h-full w-full flex-col overflow-hidden rounded-b">
            {/* Tab Headers */}
            <nav className="relative flex h-[42px] flex-shrink-0 rounded-t border-b border-hlr-10 bg-hlb-21" role="tablist">
                {TABS.map((item, index) => (
                    <div
                        key={item}
                        ref={(el) => {
                            if (el) tabRefs.current[index] = el
                        }}
                        className="relative h-full w-full cursor-pointer px-4"
                        onClick={() => setSelectedTab(item)}>
                        <div className="flex h-full items-center justify-center">
                            <p className={cn('truncate transition-colors duration-300', selectedTab === item ? 'text-hlt-1' : 'text-hlt-17')}>
                                {item}
                            </p>
                        </div>
                    </div>
                ))}
                <div className="w10 flex items-center justify-end">
                    <Dropdown
                        trigger={
                            <button
                                type="button"
                                className="ml-auto flex cursor-pointer items-center justify-center pr-2 text-hlt-17 hover:text-hlt-4">
                                <IconWrapper id={IconIds.DOTS_VERTICAL} className="size-5" />
                            </button>
                        }>
                        <div className="flex flex-col gap-2 py-2">
                            {['Tab', 'Stacked', 'Large'].map((item) => (
                                <button type="button" key={item} className="flex cursor-pointer px-2 text-hlt-17 hover:text-hlt-2">
                                    {item}
                                </button>
                            ))}
                        </div>
                    </Dropdown>
                </div>

                {/* Sliding border - dynamically positioned */}
                <div
                    className="absolute bottom-0 h-[1px] bg-hlb-1 transition-all duration-300 ease-out"
                    style={{
                        left: `${borderStyle.left}px`,
                        width: `${borderStyle.width}px`,
                    }}
                />
            </nav>

            {/* Tab Content - only render active tab */}
            <section className="flex min-h-0 flex-1 flex-col rounded-b bg-hlb-21" role="tabpanel">
                {selectedTab === TradeOrderbookAndTradesTabs.ORDERBOOK ? (
                    <div className="flex flex-1 flex-col">
                        <Orderbook />
                    </div>
                ) : (
                    <div className="flex flex-1 flex-col">
                        <Trades />
                    </div>
                )}
            </section>
        </section>
    )
}

export default OrderbookAndTrades
