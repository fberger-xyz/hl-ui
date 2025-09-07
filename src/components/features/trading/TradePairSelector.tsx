'use client'

import { useState, useRef, useLayoutEffect, useEffect, useMemo } from 'react'
import IconWrapper from '@/components/shared/Wrappers/IconWrapper'
import { IconIds } from '@/enums/icons.enum'
import { ImageWrapper } from '@/components/shared/Wrappers/ImageWrapper'
import Dropdown from '@/components/primitives/Dropdown'
import { useHyperliquidMarkets } from '@/hooks/useHyperliquidMarkets'
import { cn, withMemo } from '@/utils'
import { useUiStore } from '@/stores/ui.store'
import { useMarketStore } from '@/stores/market.store'
import { SearchInput } from '@/components/primitives/Input/Input'
import Switch from '@/components/primitives/Switch'
import { PublicFiles } from '@/enums'
import numeral from 'numeral'
import { ReactNode } from 'react'
import { showNotImplementedToast } from '@/utils/toast'

// universal market row template for all tabs
const MarketRowTemplate = (props: {
    symbol: ReactNode
    price: ReactNode
    change24h: ReactNode
    funding?: ReactNode
    volume: ReactNode
    lastColumn?: ReactNode // can be open interest or market cap
    onClick?: () => void
    className?: string
    isHeader?: boolean
    isSpot?: boolean
}) => {
    // spot: 6 cols, others: 7 cols
    const gridClass = props.isSpot ? 'grid-cols-6' : 'grid-cols-7'
    const baseClass = props.isHeader
        ? `grid ${gridClass} gap-2 px-3 pb-2`
        : `hover:bg-hlb-12 grid cursor-pointer ${gridClass} gap-2 px-3 py-1 transition-colors`

    return (
        <div className={cn(baseClass, props.className)} onClick={props.onClick}>
            <div className={cn('col-span-2 flex items-center', props.isHeader ? 'gap-1' : 'gap-2')}>{props.symbol}</div>
            <div className="flex items-center justify-start">{props.price}</div>
            <div className="flex items-center justify-start">{props.change24h}</div>
            {!props.isSpot && <div className="flex items-center justify-start">{props.funding}</div>}
            <div className="flex items-center justify-start">{props.volume}</div>
            <div className="flex items-center justify-start">{props.lastColumn}</div>
        </div>
    )
}

const TABS: {
    name: string
    publicFile?: PublicFiles
    columns: { label: string; sortable: boolean; sorted?: 'asc' | 'desc' | 'none'; tooltip?: string }[]
}[] = [
    {
        name: 'All Coins',
        columns: [
            {
                label: 'Symbol',
                sortable: true,
            },
            {
                label: 'Last Price',
                sortable: true,
            },
            {
                label: '24hr Change',
                sortable: true,
            },
            {
                label: '8hr Funding',
                sortable: true,
            },
            {
                label: 'Volume',
                sortable: true,
                sorted: 'desc',
            },
            {
                label: 'Open Interest',
                sortable: true,
            },
        ],
    },
    {
        name: 'Perps',
        columns: [
            {
                label: 'Symbol',
                sortable: true,
            },
            {
                label: 'Last Price',
                sortable: true,
            },
            {
                label: '24hr Change',
                sortable: true,
            },
            {
                label: '8hr Funding',
                sortable: true,
            },
            {
                label: 'Volume',
                sortable: true,
                sorted: 'desc',
            },
            {
                label: 'Open Interest',
                sortable: true,
            },
        ],
    },
    {
        name: 'Spot',
        publicFile: PublicFiles.TOKEN_HYPE,
        columns: [
            {
                label: 'Symbol',
                sortable: true,
            },
            {
                label: 'Last Price',
                sortable: true,
            },
            {
                label: '24hr Change',
                sortable: true,
            },
            {
                label: '8hr Funding',
                sortable: true,
            },
            {
                label: 'Volume',
                sortable: true,
                sorted: 'desc',
            },
            {
                label: 'Market Cap',
                sortable: true,
            },
        ],
    },
    {
        name: 'Trending',
        columns: [
            {
                label: 'Symbol',
                sortable: true,
            },
            {
                label: 'Last Price',
                sortable: true,
            },
            {
                label: '24hr Change',
                sortable: true,
            },
            {
                label: '8hr Funding',
                sortable: true,
            },
            {
                label: 'Volume',
                sortable: true,
                sorted: 'desc',
            },
            {
                label: 'Open Interest',
                sortable: true,
            },
        ],
    },
    {
        name: 'DEX Only',
        columns: [
            {
                label: 'Symbol',
                sortable: true,
            },
            {
                label: 'Last Price',
                sortable: true,
            },
            {
                label: '24hr Change',
                sortable: true,
            },
            {
                label: '8hr Funding',
                sortable: true,
            },
            {
                label: 'Volume',
                sortable: true,
                sorted: 'desc',
            },
            {
                label: 'Open Interest',
                sortable: true,
            },
        ],
    },
    {
        name: 'Pre-launch',
        columns: [
            {
                label: 'Symbol',
                sortable: true,
            },
            {
                label: 'Last Price',
                sortable: true,
            },
            {
                label: '24hr Change',
                sortable: true,
            },
            {
                label: '8hr Funding',
                sortable: true,
            },
            {
                label: 'Volume',
                sortable: true,
                sorted: 'desc',
            },
            {
                label: 'Open Interest',
                sortable: true,
            },
        ],
    },
    {
        name: 'AI',
        columns: [
            {
                label: 'Symbol',
                sortable: true,
            },
            {
                label: 'Last Price',
                sortable: true,
            },
            {
                label: '24hr Change',
                sortable: true,
            },
            {
                label: '8hr Funding',
                sortable: true,
            },
            {
                label: 'Volume',
                sortable: true,
                sorted: 'desc',
            },
            {
                label: 'Open Interest',
                sortable: true,
            },
        ],
    },
    {
        name: 'Defi',
        columns: [
            {
                label: 'Symbol',
                sortable: true,
            },
            {
                label: 'Last Price',
                sortable: true,
            },
            {
                label: '24hr Change',
                sortable: true,
            },
            {
                label: '8hr Funding',
                sortable: true,
            },
            {
                label: 'Volume',
                sortable: true,
                sorted: 'desc',
            },
            {
                label: 'Open Interest',
                sortable: true,
            },
        ],
    },
    {
        name: 'Gaming',
        columns: [
            {
                label: 'Symbol',
                sortable: true,
            },
            {
                label: 'Last Price',
                sortable: true,
            },
            {
                label: '24hr Change',
                sortable: true,
            },
            {
                label: '8hr Funding',
                sortable: true,
            },
            {
                label: 'Volume',
                sortable: true,
                sorted: 'desc',
            },
            {
                label: 'Open Interest',
                sortable: true,
            },
        ],
    },
    {
        name: 'Layer 1',
        columns: [
            {
                label: 'Symbol',
                sortable: true,
            },
            {
                label: 'Last Price',
                sortable: true,
            },
            {
                label: '24hr Change',
                sortable: true,
            },
            {
                label: '8hr Funding',
                sortable: true,
            },
            {
                label: 'Volume',
                sortable: true,
                sorted: 'desc',
            },
            {
                label: 'Open Interest',
                sortable: true,
            },
        ],
    },
    {
        name: 'Layer 2',
        columns: [
            {
                label: 'Symbol',
                sortable: true,
            },
            {
                label: 'Last Price',
                sortable: true,
            },
            {
                label: '24hr Change',
                sortable: true,
            },
            {
                label: '8hr Funding',
                sortable: true,
            },
            {
                label: 'Volume',
                sortable: true,
                sorted: 'desc',
            },
            {
                label: 'Open Interest',
                sortable: true,
            },
        ],
    },
    {
        name: 'Meme',
        columns: [
            {
                label: 'Symbol',
                sortable: true,
            },
            {
                label: 'Last Price',
                sortable: true,
            },
            {
                label: '24hr Change',
                sortable: true,
            },
            {
                label: '8hr Funding',
                sortable: true,
            },
            {
                label: 'Volume',
                sortable: true,
                sorted: 'desc',
            },
            {
                label: 'Open Interest',
                sortable: true,
            },
        ],
    },
]

function TradePairSelector() {
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All Coins')
    const [filterMode, setFilterMode] = useState<'Strict' | 'All'>('Strict')

    // always fetch all markets
    const { markets = [], isLoading } = useHyperliquidMarkets('all')
    const currentSymbol = useUiStore((state) => state.currentSymbol)
    const setCurrentSymbol = useUiStore((state) => state.setCurrentSymbol)
    const isFavoriteMarket = useUiStore((state) => state.isFavoriteMarket)
    const toggleFavoriteMarket = useUiStore((state) => state.toggleFavoriteMarket)
    const setSelectedMarket = useMarketStore((state) => state.setSelectedMarket)
    const tabRefs = useRef<(HTMLDivElement | null)[]>([])
    const [borderStyle, setBorderStyle] = useState({ left: 0, width: 0 })

    // debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery)
        }, 300) // 300ms debounce

        return () => clearTimeout(timer)
    }, [searchQuery])

    // filter markets based on selected category and search
    const filteredMarkets = useMemo(() => {
        return markets.filter((market) => {
            // skip if market data is invalid
            if (!market || !market.symbol) return false

            // first apply category filter
            let matchesCategory = false
            switch (selectedCategory) {
                case 'All Coins':
                    matchesCategory = true
                    break
                case 'Perps':
                    matchesCategory = market.type === 'perp'
                    break
                case 'Spot':
                    matchesCategory = market.type === 'spot'
                    break
                case 'Trending':
                    // sort by volume and take top 10
                    matchesCategory = markets
                        .sort((a, b) => parseFloat(b.dayNtlVlm || '0') - parseFloat(a.dayNtlVlm || '0'))
                        .slice(0, 10)
                        .includes(market)
                    break
                case 'Pre-launch':
                    // this would need additional data about launch dates
                    matchesCategory = false
                    break
                default:
                    // for ai, defi, gaming, etc.
                    // const categoryCoins = CATEGORY_COINS[selectedCategory] || []
                    // matchesCategory = categoryCoins.includes(market.symbol)
                    matchesCategory = true
                    break
            }

            // return early if doesn't match category
            if (!matchesCategory) return false

            // then apply search filter if there's a query
            if (!debouncedSearchQuery) return true

            const query = debouncedSearchQuery.toLowerCase()
            const symbol = market.symbol.toLowerCase()
            const name = market.name?.toLowerCase() || ''

            if (filterMode === 'Strict') {
                // strict mode: starts with for symbol
                return symbol.startsWith(query) || name.startsWith(query)
            } else {
                // all mode: includes search for both symbol and name
                return symbol.includes(query) || name.includes(query)
            }
        })
    }, [markets, debouncedSearchQuery, filterMode, selectedCategory])

    // update border position when selected category changes or window resizes
    useLayoutEffect(() => {
        const updateBorder = () => {
            const selectedIndex = TABS.findIndex((tab) => tab.name === selectedCategory)
            const selectedTabElement = tabRefs.current[selectedIndex]
            if (!selectedTabElement) return
            setBorderStyle({
                left: selectedTabElement.offsetLeft,
                width: selectedTabElement.offsetWidth,
            })
        }

        // initial update
        updateBorder()

        // update on resize
        window.addEventListener('resize', updateBorder)
        return () => window.removeEventListener('resize', updateBorder)
    }, [selectedCategory])

    return (
        <Dropdown
            trigger={(isOpen) => (
                <div className="flex grow cursor-pointer items-center gap-2 rounded px-2.5 py-2 transition-colors">
                    <ImageWrapper
                        src={`https://app.hyperliquid.xyz/coins/${currentSymbol}.svg`}
                        alt="current-pair-logo"
                        width={20}
                        height={20}
                        className="rounded-full"
                    />
                    <p className="truncate text-xl">{currentSymbol}-USD</p>
                    <IconWrapper id={IconIds.CHEVRON_DOWN} className={cn('size-5 transition-transform', isOpen && 'rotate-180')} />
                </div>
            )}
            dropdownClassName="max-h-[370px] overflow-hidden max-w-[800px]"
            align="left"
            triggerOn="click"
            closeOnClick={false}>
            <div className="flex w-full flex-col gap-4 p-2.5" onClick={(e) => e.stopPropagation()}>
                <div className="flex w-full gap-4">
                    <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search" />
                    <Switch
                        leftLabel="Strict"
                        rightLabel="All"
                        value={filterMode}
                        onChange={(value) => setFilterMode(value as 'Strict' | 'All')}
                        leftBgColor="bg-hlb-1"
                        rightBgColor="bg-hlb-4"
                        leftTextColor="text-hlt-21"
                        rightTextColor="text-hlt-1"
                        className="h-[33px] w-[135px]"
                    />
                </div>

                {/* tabs with sliding border */}
                <div className="relative">
                    <div className="flex items-center overflow-x-auto border-b border-hlr-10">
                        {TABS.map((tab, index) => (
                            <div
                                key={tab.name}
                                ref={(el) => {
                                    if (el) tabRefs.current[index] = el
                                }}
                                className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap px-5 py-1.5 transition-colors duration-200"
                                onClick={() => setSelectedCategory(tab.name)}>
                                <p className={cn('transition-colors duration-300', selectedCategory === tab.name ? 'text-hlt-1' : 'text-hlt-17')}>
                                    {tab.name}
                                </p>
                                {tab.publicFile && (
                                    <ImageWrapper src={tab.publicFile} alt={tab.name} width={16} height={16} className="rounded-full" />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Sliding border - dynamically positioned */}
                    <div
                        className="absolute bottom-0 h-[1px] bg-hlb-1 transition-all duration-300 ease-out"
                        style={{
                            left: `${borderStyle.left}px`,
                            width: `${borderStyle.width}px`,
                        }}
                    />
                </div>

                {/* list */}
                <div className="relative max-h-[400px] overflow-y-auto">
                    {/* headers */}
                    <div className="sticky top-0 z-10 bg-hlb-19">
                        <MarketRowTemplate
                            isHeader
                            isSpot={selectedCategory === 'Spot'}
                            symbol={
                                <button
                                    onClick={() => showNotImplementedToast('Sort by Symbol not yet implemented')}
                                    className="group flex cursor-pointer items-center justify-start gap-1 text-hlt-17">
                                    <p className="text-xs">Symbol</p>
                                    <IconWrapper
                                        id={IconIds.CHEVRON_DOWN}
                                        className="size-3.5 text-transparent transition-colors duration-200 group-hover:text-hlt-17"
                                    />
                                </button>
                            }
                            price={
                                <button
                                    onClick={() => showNotImplementedToast('Sort by Price not yet implemented')}
                                    className="group flex cursor-pointer items-center gap-1 text-hlt-17">
                                    <p className="text-xs">Last Price</p>
                                    <IconWrapper
                                        id={IconIds.CHEVRON_DOWN}
                                        className="size-3.5 text-transparent transition-colors duration-200 group-hover:text-hlt-17"
                                    />
                                </button>
                            }
                            change24h={
                                <button
                                    onClick={() => showNotImplementedToast('Sort by 24hr Change not yet implemented')}
                                    className="group flex cursor-pointer items-center gap-1 text-hlt-17">
                                    <p className="text-xs">24hr Change</p>
                                    <IconWrapper
                                        id={IconIds.CHEVRON_DOWN}
                                        className="size-3.5 text-transparent transition-colors duration-200 group-hover:text-hlt-17"
                                    />
                                </button>
                            }
                            funding={
                                selectedCategory !== 'Spot' ? (
                                    <button
                                        onClick={() =>
                                            showNotImplementedToast(
                                                `Sort by ${selectedCategory === 'Trending' ? 'Rank' : 'Funding'} not yet implemented`,
                                            )
                                        }
                                        className="group flex cursor-pointer items-center gap-1 text-hlt-17">
                                        <p className="text-xs">{selectedCategory === 'Trending' ? 'Rank' : '8hr Funding'}</p>
                                        <IconWrapper
                                            id={IconIds.CHEVRON_DOWN}
                                            className="size-3.5 text-transparent transition-colors duration-200 group-hover:text-hlt-17"
                                        />
                                    </button>
                                ) : undefined
                            }
                            volume={
                                <button
                                    onClick={() => showNotImplementedToast('Sort by Volume not yet implemented')}
                                    className="group flex cursor-pointer items-center gap-1 text-hlt-17">
                                    <p className="text-xs">Volume</p>
                                    <IconWrapper
                                        id={IconIds.CHEVRON_DOWN}
                                        className="size-3.5 text-transparent transition-colors duration-200 group-hover:text-hlt-17"
                                    />
                                </button>
                            }
                            lastColumn={
                                <button
                                    onClick={() =>
                                        showNotImplementedToast(
                                            `Sort by ${selectedCategory === 'Spot' ? 'Market Cap' : 'Open Interest'} not yet implemented`,
                                        )
                                    }
                                    className="group flex cursor-pointer items-center gap-1 text-hlt-17">
                                    <p className="text-xs">{selectedCategory === 'Spot' ? 'Market Cap' : 'Open Interest'}</p>
                                    <IconWrapper
                                        id={IconIds.CHEVRON_DOWN}
                                        className="size-3.5 text-transparent transition-colors duration-200 group-hover:text-hlt-17"
                                    />
                                </button>
                            }
                        />
                    </div>

                    {/* rows */}
                    {isLoading && !filteredMarkets.length ? (
                        <div className="p-4 text-center text-gray-500">Loading markets...</div>
                    ) : filteredMarkets.length > 0 ? (
                        <div className="flex flex-col">
                            {filteredMarkets.map((market, index) => {
                                // common props for all templates
                                const isSpot = selectedCategory === 'Spot'
                                const isFavorite = isFavoriteMarket(market.symbol, market.type)

                                const changeElement = (
                                    <p className={cn('', market.changePercent24h >= 0 ? 'text-hlt-13' : 'text-hlt-12')}>
                                        {market.changePercent24h >= 0 ? '+' : ''}
                                        {market.changePercent24h.toFixed(2)}%
                                    </p>
                                )

                                // render using universal template
                                return (
                                    <MarketRowTemplate
                                        key={market.symbol}
                                        onClick={() => {
                                            setCurrentSymbol(market.symbol)
                                            setSelectedMarket(market)
                                        }}
                                        isSpot={isSpot}
                                        symbol={
                                            isSpot ? (
                                                <>
                                                    <p className="truncate">{market.symbol}</p>
                                                    <p className="rounded bg-hlb-6 px-1 py-0.5 text-xs text-hlt-4">SPOT</p>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            toggleFavoriteMarket({ symbol: market.symbol, type: market.type })
                                                        }}
                                                        className="flex items-center">
                                                        <IconWrapper
                                                            id={isFavorite ? IconIds.STAR_FILLED : IconIds.STAR_EMPTY}
                                                            className={cn(
                                                                'size-4 cursor-pointer transition-colors',
                                                                isFavorite ? 'text-yellow-500' : 'text-hlt-17 hover:text-yellow-500',
                                                            )}
                                                        />
                                                    </button>
                                                    <p className="truncate">{market.name}-USD</p>
                                                    {market.maxLeverage && (
                                                        <p className="rounded bg-hlb-6 px-1 py-0.5 text-xs text-hlt-4">{market.maxLeverage}x</p>
                                                    )}
                                                </>
                                            )
                                        }
                                        price={<p>{numeral(market.px).format('0,0.0')}</p>}
                                        change24h={changeElement}
                                        funding={
                                            selectedCategory !== 'Spot' ? (
                                                selectedCategory === 'Trending' ? (
                                                    <p>{index + 1}</p>
                                                ) : (
                                                    <p>{market.type === 'perp' ? `${(parseFloat(market.funding) * 100).toFixed(4)}%` : '-'}</p>
                                                )
                                            ) : undefined
                                        }
                                        volume={<p>{numeral(market.dayNtlVlm).format('$0,0')}</p>}
                                        lastColumn={
                                            selectedCategory === 'Spot' ? (
                                                <p>-</p> // market cap data not available yet
                                            ) : (
                                                <p>{market.type === 'perp' ? numeral(market.openInterest).format('$0,0') : '-'}</p>
                                            )
                                        }
                                    />
                                )
                            })}
                        </div>
                    ) : (
                        <div className="p-4 text-center text-gray-500">No markets found</div>
                    )}
                </div>
            </div>
        </Dropdown>
    )
}

export default withMemo(TradePairSelector)
