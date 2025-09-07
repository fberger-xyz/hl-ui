'use client'

import { cn, withMemo } from '@/utils'
import { useRef, useEffect, useState, useLayoutEffect, useCallback } from 'react'
import { IconIds, NuqsKeys, TradePanelTabs, TradeSide } from '@/enums'
import { useQueryState } from 'nuqs'
import Dropdown from '@/components/primitives/Dropdown'
import IconWrapper from '@/components/shared/Wrappers/IconWrapper'
import Switch from '@/components/primitives/Switch'
import { useAccount } from 'wagmi'
import { useMarketStore } from '@/stores/market.store'
import TextWithTooltip from '@/components/primitives/Tooltip/TextWithTooltip'
import { showNotImplementedToast } from '@/utils/toast'

const TABS: TradePanelTabs[] = [TradePanelTabs.MARKET, TradePanelTabs.LIMIT]

function PerpTradePanel() {
    const {} = useAccount()
    const selectedMarket = useMarketStore((state) => state.selectedMarket)
    const [selectedTab, setSelectedTab] = useQueryState(NuqsKeys.ORDER, {
        defaultValue: TradePanelTabs.MARKET,
        parse: (value) => (Object.values(TradePanelTabs).includes(value as TradePanelTabs) ? (value as TradePanelTabs) : TradePanelTabs.MARKET),
    })
    const [selectedSide, setSelectedSide] = useQueryState(NuqsKeys.SIDE, {
        defaultValue: TradeSide.BUY,
        parse: (value) => (Object.values(TradeSide).includes(value as TradeSide) ? (value as TradeSide) : TradeSide.BUY),
    })
    const tabRefs = useRef<(HTMLDivElement | null)[]>([])
    const [borderStyle, setBorderStyle] = useState({ left: 0, width: 0 })
    const [, setLeverage] = useState<'Cross' | '20x' | 'One-Way'>('Cross')

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

    useEffect(() => {
        const timer = setTimeout(updateBorderPosition, 10)
        window.addEventListener('resize', updateBorderPosition)
        return () => {
            clearTimeout(timer)
            window.removeEventListener('resize', updateBorderPosition)
        }
    }, [updateBorderPosition])

    return (
        <div className="flex flex-col gap-1">
            {/* Main Trading Section */}
            <div className="flex flex-col gap-3 rounded bg-hlb-21 px-2.5 py-3">
                {/* Leverage Controls */}
                <div className="grid w-full grid-cols-3 gap-2">
                    {(['Cross', '20x', 'One-Way'] as const).map((item) => (
                        <button
                            key={item}
                            onClick={() => {
                                setLeverage(item)
                                showNotImplementedToast(`${item} leverage not yet implemented`)
                            }}
                            className={cn('col-span-1 rounded-lg py-2 transition-colors', 'bg-hlb-16 text-hlt-17 hover:bg-hlb-15')}>
                            <p className="truncate text-xs">{item}</p>
                        </button>
                    ))}
                </div>

                {/* Market/Limit/Pro Tabs */}
                <div className="relative grid h-[35px] grid-cols-3 rounded border-b border-hlr-7">
                    {TABS.map((item, index) => (
                        <div
                            key={item}
                            ref={(el) => {
                                if (el) tabRefs.current[index] = el
                            }}
                            className="relative col-span-1 flex h-full flex-1 cursor-pointer items-center justify-center"
                            onClick={() => setSelectedTab(item)}>
                            <p className={cn('text-xs transition-colors duration-300', selectedTab === item ? 'text-hlt-1' : 'text-hlt-17')}>
                                {item}
                            </p>
                        </div>
                    ))}
                    <div className="col-span-1 flex items-center justify-center">
                        <Dropdown
                            trigger={
                                <button className="flex cursor-pointer items-center justify-center gap-2 text-hlt-17 hover:text-hlt-4">
                                    <p className={cn('text-xs transition-colors duration-300')}>Pro</p>
                                    <IconWrapper id={IconIds.CHEVRON_DOWN} className="size-3.5" />
                                </button>
                            }>
                            <div className="flex flex-col gap-2 py-2">
                                {['Scale', 'Stop Limit', 'Stop Market', 'TWAP'].map((item) => (
                                    <button
                                        key={item}
                                        onClick={() => showNotImplementedToast(`${item} order type not yet implemented`)}
                                        className="flex cursor-pointer px-2 text-hlt-17 hover:text-hlt-2">
                                        <p className="truncate text-xs">{item}</p>
                                    </button>
                                ))}
                            </div>
                        </Dropdown>
                    </div>

                    {/* Sliding border */}
                    <div
                        className="absolute bottom-0 h-[1px] bg-hlb-1 transition-all duration-300 ease-out"
                        style={{
                            left: `${borderStyle.left}px`,
                            width: `${borderStyle.width}px`,
                        }}
                    />
                </div>

                {/* Order Form */}
                <div className="flex flex-col gap-4">
                    {/* Buy/Long - Sell/Short Toggle */}
                    <Switch
                        leftLabel="Buy / Long"
                        rightLabel="Sell / Short"
                        value={selectedSide === TradeSide.BUY ? 'Buy / Long' : 'Sell / Short'}
                        onChange={(value) => setSelectedSide(value === 'Buy / Long' ? TradeSide.BUY : TradeSide.SELL)}
                        leftBgColor="bg-hlb-1"
                        rightBgColor="bg-hlb-4"
                        leftTextColor="text-hlt-21"
                        rightTextColor="text-hlt-1"
                        className="h-[33px] text-xs"
                    />

                    {/* Available & Current Position */}
                    <div className="flex flex-col gap-2">
                        <div className="flex w-full justify-between">
                            <p className="text-xs text-hlt-17">Available to trade</p>
                            <p className="text-xs text-hlt-2">0.00</p>
                        </div>
                        <div className="flex w-full justify-between">
                            <p className="text-xs text-hlt-17">Current Position</p>
                            <p className="text-xs text-hlt-2">0.00000 {selectedMarket?.symbol || 'BTC'}</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 text-xs">
                        <div className="flex justify-between">
                            <p className="text-hlt-17">Order Value</p>
                            <p className="text-hlt-2">N/A</p>
                        </div>
                        <div className="flex justify-between">
                            <TextWithTooltip
                                tooltip={{
                                    text: 'Average execution price compared to mid price based on current order book.',
                                }}
                                text="Slippage"
                            />

                            <p className="text-hlt-4">Est: 0% / Max: 8.00%</p>
                        </div>
                        <div className="flex justify-between">
                            <TextWithTooltip
                                tooltip={{
                                    text: 'Taker orders pay a 0.0400% fee. Maker orders pay a 0.0120% fee.',
                                }}
                                text="Fees"
                            />

                            <p className="text-hlt-2">0.0400% / 0.0120%</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default withMemo(PerpTradePanel)
