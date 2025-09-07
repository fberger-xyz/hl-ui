import { useCallback, useEffect, useState } from 'react'
import { hyperliquidWS } from '@/services/hyperliquid-websocket-client'
import type { AssetContext } from '@/types/hyperliquid.types'
import type { MarketData } from '@/types/trading.types'

export function useHyperliquidMarkets(filter: 'all' | 'perps' | 'spot' = 'all') {
    const [markets, setMarkets] = useState<MarketData[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchMarkets = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)

            // fetch perpetual markets
            const perpResponse = await hyperliquidWS.fetchInfo('metaAndAssetCtxs')

            // guard response structure
            if (!Array.isArray(perpResponse) || perpResponse.length < 2) throw new Error('Invalid perpetual markets response structure')

            const perpMeta = perpResponse[0] as { universe?: unknown[] }
            const perpContexts: AssetContext[] = (perpResponse[1] as AssetContext[]) || []

            // process perp markets
            const perpMarkets: MarketData[] = perpContexts
                .map((ctx, index) => {
                    // get coin info
                    const coinInfo = perpMeta?.universe?.[index] as { name?: string; isDelisted?: boolean; maxLeverage?: number } | undefined

                    // skip delisted
                    if (!coinInfo || coinInfo.isDelisted) return null

                    const symbol = coinInfo.name || ''

                    const currentPrice = parseFloat(ctx.markPx || '0')
                    const prevPrice = parseFloat(ctx.prevDayPx || '0')
                    const change24h = currentPrice - prevPrice
                    const changePercent24h = prevPrice > 0 ? (change24h / prevPrice) * 100 : 0

                    return {
                        symbol: symbol,
                        name: symbol,
                        px: ctx.markPx || '0',
                        change24h,
                        changePercent24h,
                        dayNtlVlm: ctx.dayNtlVlm || '0',
                        funding: ctx.funding || '0',
                        openInterest: ctx.openInterest || '0',
                        type: 'perp' as const,
                        maxLeverage: coinInfo.maxLeverage,
                    }
                })
                .filter(Boolean) as MarketData[]

            // fetch spot markets
            let spotMarkets: MarketData[] = []
            if (filter !== 'perps') {
                try {
                    const spotResponse = await hyperliquidWS.fetchInfo('spotMetaAndAssetCtxs')

                    // guard spot response
                    if (!Array.isArray(spotResponse) || spotResponse.length < 2) return (console.warn('Invalid spot markets response structure'), [])

                    const spotMeta = spotResponse[0] as { universe?: unknown[] }
                    const spotContexts: AssetContext[] = (spotResponse[1] as AssetContext[]) || []

                    spotMarkets = spotContexts
                        .map((ctx, index) => {
                            // get coin info
                            const coinInfo = spotMeta?.universe?.[index] as { name?: string; isDelisted?: boolean } | undefined

                            // skip invalid coins
                            if (!coinInfo) return null

                            const symbol = coinInfo.name || ''
                            const currentPrice = parseFloat(ctx.markPx || '0')
                            const prevPrice = parseFloat(ctx.prevDayPx || '0')
                            const change24h = currentPrice - prevPrice
                            const changePercent24h = prevPrice > 0 ? (change24h / prevPrice) * 100 : 0

                            return {
                                symbol: symbol,
                                name: symbol,
                                px: ctx.markPx || '0',
                                change24h,
                                changePercent24h,
                                dayNtlVlm: ctx.dayNtlVlm || '0',
                                funding: '0',
                                openInterest: '0',
                                type: 'spot' as const,
                            }
                        })
                        .filter(Boolean) as MarketData[]
                } catch (err) {
                    console.warn('Failed to fetch spot markets:', err)
                }
            }

            // combine markets
            let allMarkets = [...perpMarkets, ...spotMarkets]

            if (filter === 'perps') allMarkets = allMarkets.filter((m) => m.type === 'perp')
            else if (filter === 'spot') allMarkets = allMarkets.filter((m) => m.type === 'spot')

            // sort by volume
            allMarkets.sort((a, b) => parseFloat(b.dayNtlVlm) - parseFloat(a.dayNtlVlm))

            setMarkets(allMarkets)
        } catch (err) {
            console.error('Error fetching markets:', err)
            setError(err instanceof Error ? err.message : 'Failed to fetch markets')
        } finally {
            setIsLoading(false)
        }
    }, [filter])

    useEffect(() => {
        fetchMarkets()

        // refresh periodically
        const interval = setInterval(fetchMarkets, 10000)

        return () => clearInterval(interval)
    }, [fetchMarkets])

    return {
        markets,
        isLoading,
        error,
        refetch: fetchMarkets,
    }
}
