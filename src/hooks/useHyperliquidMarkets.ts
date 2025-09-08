import { useCallback, useEffect, useState, useRef } from 'react'
import { hyperliquidWS } from '@/services/hyperliquid-websocket'
import { subscriptionManager } from '@/services/subscription-manager'
import { HyperliquidWebSocketSubscriptionType } from '@/enums'
import type { AssetContext, MarketMeta } from '@/types/hyperliquid.types'
import type { MarketData } from '@/types/trading.types'

export function useHyperliquidMarkets(marketTypeFilter: 'all' | 'perps' | 'spot' = 'all') {
    const [allMarketsData, setAllMarketsData] = useState<MarketData[]>([])
    const [isLoadingMarkets, setIsLoadingMarkets] = useState(true)
    const [marketsFetchError, setMarketsFetchError] = useState<string | null>(null)
    const allMidsWebsocketUnsubscribe = useRef<(() => void) | null>(null)
    const staticMarketMetadataCache = useRef<{
        perpMetadata: MarketMeta | null
        spotMetadata: MarketMeta | null
        allSymbols: string[]
    }>({
        perpMetadata: null,
        spotMetadata: null,
        allSymbols: [],
    })

    const fetchInitialMarketMetadataFromRest = useCallback(async () => {
        try {
            setIsLoadingMarkets(true)
            setMarketsFetchError(null)

            // fetch perp markets metadata
            const perpetualMarketsResponse = await hyperliquidWS.fetchInfo('metaAndAssetCtxs')

            // guard: invalid response structure
            if (!Array.isArray(perpetualMarketsResponse) || perpetualMarketsResponse.length < 2) {
                throw new Error('Invalid perpetual markets response structure')
            }

            const perpMetadataPayload = perpetualMarketsResponse[0] as MarketMeta
            const perpAssetContextsArray: AssetContext[] = (perpetualMarketsResponse[1] as AssetContext[]) || []

            // cache static metadata
            staticMarketMetadataCache.current.perpMetadata = perpMetadataPayload

            const processedPerpMarkets: MarketData[] = perpAssetContextsArray
                .map((assetContext, assetIndex) => {
                    const coinMetadata = perpMetadataPayload?.universe?.[assetIndex]

                    // skip delisted or invalid
                    if (!coinMetadata || coinMetadata.isDelisted) return null

                    const coinSymbol = coinMetadata.name || ''
                    const currentMarkPrice = parseFloat(assetContext.markPx || '0')
                    const previousDayPrice = parseFloat(assetContext.prevDayPx || '0')
                    const priceChange24h = currentMarkPrice - previousDayPrice
                    const priceChangePercent24h = previousDayPrice > 0 ? (priceChange24h / previousDayPrice) * 100 : 0

                    return {
                        symbol: coinSymbol,
                        name: coinSymbol,
                        px: assetContext.markPx || '0',
                        change24h: priceChange24h,
                        changePercent24h: priceChangePercent24h,
                        dayNtlVlm: assetContext.dayNtlVlm || '0',
                        funding: assetContext.funding || '0',
                        openInterest: assetContext.openInterest || '0',
                        type: 'perp' as const,
                        maxLeverage: coinMetadata.maxLeverage,
                    }
                })
                .filter(Boolean) as MarketData[]

            let processedSpotMarkets: MarketData[] = []
            // skip spot fetch if only perps requested
            if (marketTypeFilter !== 'perps') {
                try {
                    const spotMarketsResponse = await hyperliquidWS.fetchInfo('spotMetaAndAssetCtxs')

                    // guard: invalid spot response
                    if (!Array.isArray(spotMarketsResponse) || spotMarketsResponse.length < 2) {
                        console.warn('Invalid spot markets response structure')
                        return []
                    }

                    const spotMetadataPayload = spotMarketsResponse[0] as MarketMeta
                    const spotAssetContextsArray: AssetContext[] = (spotMarketsResponse[1] as AssetContext[]) || []

                    // cache static metadata
                    staticMarketMetadataCache.current.spotMetadata = spotMetadataPayload

                    processedSpotMarkets = spotAssetContextsArray
                        .map((assetContext, assetIndex) => {
                            const coinMetadata = spotMetadataPayload?.universe?.[assetIndex]

                            if (!coinMetadata) return null

                            const coinSymbol = coinMetadata.name || ''
                            const currentMarkPrice = parseFloat(assetContext.markPx || '0')
                            const previousDayPrice = parseFloat(assetContext.prevDayPx || '0')
                            const priceChange24h = currentMarkPrice - previousDayPrice
                            const priceChangePercent24h = previousDayPrice > 0 ? (priceChange24h / previousDayPrice) * 100 : 0

                            return {
                                symbol: coinSymbol,
                                name: coinSymbol,
                                px: assetContext.markPx || '0',
                                change24h: priceChange24h,
                                changePercent24h: priceChangePercent24h,
                                dayNtlVlm: assetContext.dayNtlVlm || '0',
                                funding: '0',
                                openInterest: '0',
                                type: 'spot' as const,
                            }
                        })
                        .filter(Boolean) as MarketData[]
                } catch (spotFetchError) {
                    console.warn('Failed to fetch spot markets:', spotFetchError)
                }
            }

            // combine and filter by type
            let combinedMarkets = [...processedPerpMarkets, ...processedSpotMarkets]

            if (marketTypeFilter === 'perps') combinedMarkets = combinedMarkets.filter((market) => market.type === 'perp')
            else if (marketTypeFilter === 'spot') combinedMarkets = combinedMarkets.filter((market) => market.type === 'spot')

            // cache all symbols for reference
            staticMarketMetadataCache.current.allSymbols = combinedMarkets.map((market) => market.symbol)

            // sort by daily volume descending
            combinedMarkets.sort((marketA, marketB) => parseFloat(marketB.dayNtlVlm) - parseFloat(marketA.dayNtlVlm))

            setAllMarketsData(combinedMarkets)
            return combinedMarkets
        } catch (fetchError) {
            console.error('Error fetching markets:', fetchError)
            setMarketsFetchError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch markets')
            return []
        } finally {
            setIsLoadingMarkets(false)
        }
    }, [marketTypeFilter])

    useEffect(() => {
        fetchInitialMarketMetadataFromRest().then((initialMarketsList) => {
            // guard: no markets to subscribe
            if (initialMarketsList.length === 0) return

            // subscribe to all mid prices websocket
            const unsubscribeFromAllMids = subscriptionManager.subscribe(
                {
                    type: HyperliquidWebSocketSubscriptionType.ALL_MIDS,
                },
                (allMidsData) => {
                    const midsPayload = allMidsData as { mids: Record<string, string> }
                    if (!midsPayload?.mids) return

                    // update market prices in real-time
                    setAllMarketsData((previousMarkets) => {
                        return previousMarkets.map((marketItem) => {
                            const updatedMidPrice = midsPayload.mids[marketItem.symbol]
                            if (!updatedMidPrice) return marketItem

                            return {
                                ...marketItem,
                                px: updatedMidPrice,
                            }
                        })
                    })
                },
            )

            allMidsWebsocketUnsubscribe.current = unsubscribeFromAllMids
        })

        return () => {
            if (!allMidsWebsocketUnsubscribe.current) return
            allMidsWebsocketUnsubscribe.current()
            allMidsWebsocketUnsubscribe.current = null
        }
    }, [fetchInitialMarketMetadataFromRest])

    return {
        markets: allMarketsData,
        isLoading: isLoadingMarkets,
        error: marketsFetchError,
        refetch: fetchInitialMarketMetadataFromRest,
    }
}
