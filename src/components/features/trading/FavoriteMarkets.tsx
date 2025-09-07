'use client'

import IconWrapper from '@/components/shared/Wrappers/IconWrapper'
import { IconIds } from '@/enums/icons.enum'
import Switch from '@/components/primitives/Switch'
import { useState, useMemo } from 'react'
import { useUiStore } from '@/stores/ui.store'
import { useMarketStore } from '@/stores/market.store'
import { useHyperliquidMarkets } from '@/hooks/useHyperliquidMarkets'
import numeral from 'numeral'
import { formatAmount } from '@/utils'

export default function FavoriteMarkets() {
    const [selectedFavoriteUnit, setSelectedFavoriteUnit] = useState<'$' | '%'>('$')
    const { favoriteMarkets, setCurrentSymbol } = useUiStore()
    const { setSelectedMarket } = useMarketStore()
    const { markets = [] } = useHyperliquidMarkets('all')

    // get full market data for favorites
    const favoritesWithData = useMemo(() => {
        return favoriteMarkets.map((fav) => markets.find((m) => m.symbol === fav.symbol && m.type === fav.type)).filter(Boolean)
    }, [favoriteMarkets, markets])

    return (
        <div className="flex h-10 items-center overflow-x-auto px-2">
            <IconWrapper id={IconIds.STAR_FILLED} className="size-4 flex-shrink-0 text-star" />
            {favoritesWithData.length > 0 && (
                <div className="mx-4 flex-shrink-0">
                    <Switch
                        leftLabel="$"
                        rightLabel="%"
                        value={selectedFavoriteUnit}
                        onChange={(value) => setSelectedFavoriteUnit(value === '$' ? '$' : '%')}
                        leftBgColor="bg-hlb-1"
                        rightBgColor="bg-hlb-1"
                        leftTextColor="text-hlt-21"
                        rightTextColor="text-hlt-1"
                    />
                </div>
            )}
            {favoritesWithData.map((market) => {
                if (!market) return null
                const displayValue =
                    selectedFavoriteUnit === '$' ? formatAmount(market.px) : numeral(market.changePercent24h).divide(100).format('+0,0.[00]%')
                const valueColor = market.changePercent24h >= 0 ? 'text-hlt-13' : 'text-hlt-12'
                return (
                    <div key={`${market.symbol}-${market.type}`} className="group relative flex items-center gap-2 rounded-sm p-2 hover:bg-hlb-15">
                        <div
                            className="flex cursor-pointer items-center gap-2"
                            onClick={() => {
                                setCurrentSymbol(market.symbol)
                                setSelectedMarket(market)
                            }}>
                            <p className="text-hlt-2">{market.symbol}-USD</p>
                            <p className={valueColor}>{displayValue}</p>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
