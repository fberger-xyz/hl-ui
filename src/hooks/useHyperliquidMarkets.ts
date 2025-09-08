/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState, useRef } from 'react'
import { subscriptionManager } from '@/services/subscription-manager'
import { HyperliquidWebSocketSubscriptionType } from '@/enums'
import type { MarketData } from '@/types/trading.types'

// websocket-only market data
export function useHyperliquidMarkets(marketTypeFilter: 'all' | 'perps' | 'spot' = 'all') {
    const [allMarketsData, setAllMarketsData] = useState<MarketData[]>([])
    const [isLoadingMarkets, setIsLoadingMarkets] = useState(true)
    const [marketsFetchError, setMarketsFetchError] = useState<string | null>(null)

    const unsubscribeRefs = useRef<{
        allMids: (() => void) | null
        webData: (() => void) | null
    }>({
        allMids: null,
        webData: null,
    })

    // cache static metadata in localstorage
    const getStaticMetadata = (symbol: string): { maxLeverage?: number; type: 'perp' | 'spot' } => {
        const cached = localStorage.getItem(`market_meta_${symbol}`)
        if (cached) {
            try {
                return JSON.parse(cached)
            } catch {
                // fallback defaults
            }
        }
        // default based on symbol
        const isSpot = symbol.includes('/') || symbol.includes('-SPOT')
        return {
            type: isSpot ? 'spot' : 'perp',
            maxLeverage: isSpot ? undefined : 50, // default perp leverage
        }
    }

    const saveStaticMetadata = (symbol: string, metadata: { maxLeverage?: number; type: 'perp' | 'spot' }) => {
        localStorage.setItem(`market_meta_${symbol}`, JSON.stringify(metadata))
    }

    useEffect(() => {
        setIsLoadingMarkets(true)
        setMarketsFetchError(null)

        // subscribe to global market data
        unsubscribeRefs.current.webData = subscriptionManager.subscribe(
            {
                type: HyperliquidWebSocketSubscriptionType.WEB_DATA2,
                user: '0x0000000000000000000000000000000000000000', // zero address for global data
            },
            (data) => {
                // webdata2 contains market metadata
                const webData = data as Record<string, any>
                if (webData?.assetCtxs && Array.isArray(webData.assetCtxs)) {
                    const markets: MarketData[] = []

                    // process each asset context
                    webData.assetCtxs.forEach((ctx: any, index: number) => {
                        if (!ctx || !webData.meta?.universe?.[index]) return

                        const coinMeta = webData.meta.universe[index]
                        if (coinMeta.isDelisted) return

                        const symbol = coinMeta.name
                        const metadata = getStaticMetadata(symbol)

                        // update cached metadata
                        if (coinMeta.maxLeverage) {
                            metadata.maxLeverage = coinMeta.maxLeverage
                            saveStaticMetadata(symbol, metadata)
                        }

                        const currentPrice = parseFloat(ctx.markPx || '0')
                        const prevPrice = parseFloat(ctx.prevDayPx || '0')
                        const change24h = currentPrice - prevPrice
                        const changePercent24h = prevPrice > 0 ? (change24h / prevPrice) * 100 : 0

                        markets.push({
                            symbol,
                            name: symbol,
                            px: ctx.markPx || '0',
                            change24h,
                            changePercent24h,
                            dayNtlVlm: ctx.dayNtlVlm || '0',
                            funding: ctx.funding || '0',
                            openInterest: ctx.openInterest || '0',
                            type: metadata.type,
                            maxLeverage: metadata.maxLeverage,
                        })
                    })

                    // filter by type
                    let filteredMarkets = markets
                    if (marketTypeFilter === 'perps') {
                        filteredMarkets = markets.filter((m) => m.type === 'perp')
                    } else if (marketTypeFilter === 'spot') {
                        filteredMarkets = markets.filter((m) => m.type === 'spot')
                    }

                    // sort by volume
                    filteredMarkets.sort((a, b) => parseFloat(b.dayNtlVlm) - parseFloat(a.dayNtlVlm))

                    setAllMarketsData(filteredMarkets)
                    setIsLoadingMarkets(false)
                }
            },
        )

        // subscribe to real-time price updates
        unsubscribeRefs.current.allMids = subscriptionManager.subscribe(
            {
                type: HyperliquidWebSocketSubscriptionType.ALL_MIDS,
            },
            (allMidsData) => {
                const midsPayload = allMidsData as { mids: Record<string, string> }
                if (!midsPayload?.mids) return

                // update prices in real-time
                setAllMarketsData((previousMarkets) => {
                    if (previousMarkets.length === 0) {
                        // bootstrap from allMids
                        const bootstrapMarkets: MarketData[] = []
                        Object.entries(midsPayload.mids).forEach(([symbol, price]) => {
                            const metadata = getStaticMetadata(symbol)

                            // apply filter
                            if (marketTypeFilter === 'perps' && metadata.type !== 'perp') return
                            if (marketTypeFilter === 'spot' && metadata.type !== 'spot') return

                            bootstrapMarkets.push({
                                symbol,
                                name: symbol,
                                px: price,
                                change24h: 0,
                                changePercent24h: 0,
                                dayNtlVlm: '0',
                                funding: '0',
                                openInterest: '0',
                                type: metadata.type,
                                maxLeverage: metadata.maxLeverage,
                            })
                        })

                        if (bootstrapMarkets.length > 0) {
                            setIsLoadingMarkets(false)
                            return bootstrapMarkets
                        }
                    }

                    // update existing market prices
                    return previousMarkets.map((marketItem) => {
                        const updatedMidPrice = midsPayload.mids[marketItem.symbol]
                        if (!updatedMidPrice) return marketItem

                        // recalculate 24h change
                        const currentPrice = parseFloat(updatedMidPrice)
                        const prevPrice = parseFloat(marketItem.px) - marketItem.change24h
                        const change24h = prevPrice > 0 ? currentPrice - prevPrice : marketItem.change24h
                        const changePercent24h = prevPrice > 0 ? (change24h / prevPrice) * 100 : marketItem.changePercent24h

                        return {
                            ...marketItem,
                            px: updatedMidPrice,
                            change24h,
                            changePercent24h,
                        }
                    })
                })
            },
        )

        return () => {
            // cleanup subscriptions
            if (unsubscribeRefs.current.allMids) {
                unsubscribeRefs.current.allMids()
                unsubscribeRefs.current.allMids = null
            }
            if (unsubscribeRefs.current.webData) {
                unsubscribeRefs.current.webData()
                unsubscribeRefs.current.webData = null
            }
        }
    }, [marketTypeFilter])

    return {
        markets: allMarketsData,
        isLoading: isLoadingMarkets,
        error: marketsFetchError,
        refetch: () => {
            // no-op: websocket handles everything
            console.log('Markets are updated via WebSocket, no manual refresh needed')
        },
    }
}
