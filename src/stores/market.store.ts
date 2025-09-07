import { create } from 'zustand'
import { useWsStore } from '@/stores/ws.store'
import type { L2BookData, Trade } from '@/types/hyperliquid.types'
import type { OrderbookData, MarketKPIs, MarketData } from '@/types/trading.types'

interface MarketState {
    // selected market
    selectedMarket: MarketData | null
    setSelectedMarket: (market: MarketData) => void

    // all market prices
    allPrices: Record<string, string>
    updateAllPrices: (prices: Record<string, string>) => void

    // orderbook for selected market
    orderbook: OrderbookData
    updateOrderbook: (data: L2BookData) => void

    // trades for selected market
    trades: Trade[]
    addTrades: (trades: Trade | Trade[]) => void

    // kpis for selected market
    marketKPIs: MarketKPIs | null
    updateMarketKPIs: (kpis: Partial<MarketKPIs>) => void

    // subscriptions
    subscribeToMarket: (symbol: string) => void
    unsubscribeFromMarket: () => void

    // cleanup
    clearSubscriptions: () => void
}

export const useMarketStore = create<MarketState>((set, get) => ({
    selectedMarket: null,
    allPrices: {},
    orderbook: {
        bids: [],
        asks: [],
        spread: 0,
        spreadPercentage: 0,
        midPrice: 0,
    },
    trades: [],
    marketKPIs: null,

    setSelectedMarket: (market) => {
        const state = get()
        // unsubscribe from old market
        if (state.selectedMarket) state.unsubscribeFromMarket()
        // set new market and subscribe
        set({ selectedMarket: market })
        if (market) state.subscribeToMarket(market.symbol)
    },

    updateAllPrices: (prices) => set({ allPrices: prices }),

    updateOrderbook: (data: L2BookData) => {
        // process orderbook data
        const bidsArray = Array.isArray(data.levels?.[0]) ? data.levels[0] : []
        const asksArray = Array.isArray(data.levels?.[1]) ? data.levels[1] : []

        let runningBidTotal = 0
        const bids = bidsArray.slice(0, 20).map((level: [string, string] | { px: string; sz: string }) => {
            const px = Array.isArray(level) ? level[0] : level.px
            const sz = Array.isArray(level) ? level[1] : level.sz
            runningBidTotal += parseFloat(sz)
            return { px, sz, total: runningBidTotal.toFixed(4) }
        })

        let runningAskTotal = 0
        const asks = asksArray.slice(0, 20).map((level: [string, string] | { px: string; sz: string }) => {
            const px = Array.isArray(level) ? level[0] : level.px
            const sz = Array.isArray(level) ? level[1] : level.sz
            runningAskTotal += parseFloat(sz)
            return { px, sz, total: runningAskTotal.toFixed(4) }
        })

        const bestBid = parseFloat(bids[0]?.px || '0')
        const bestAsk = parseFloat(asks[0]?.px || '0')
        const spread = bestAsk - bestBid
        const midPrice = (bestBid + bestAsk) / 2
        const spreadPercentage = midPrice > 0 ? (spread / midPrice) * 100 : 0

        set({
            orderbook: { bids, asks, spread, spreadPercentage, midPrice },
        })
    },

    addTrades: (newTrades) => {
        const tradesArray = Array.isArray(newTrades) ? newTrades : [newTrades]
        set((state) => ({
            trades: [...tradesArray, ...state.trades].slice(0, 100),
        }))
    },

    updateMarketKPIs: (kpis) => {
        set((state) => ({
            marketKPIs: state.marketKPIs ? { ...state.marketKPIs, ...kpis } : (kpis as MarketKPIs),
        }))
    },

    subscribeToMarket: (symbol: string) => {
        const wsStore = useWsStore.getState()

        // parallel subscriptions for better performance
        const unsubOrderbook = wsStore.subscribe(`l2Book:${symbol}`, (data) => {
            get().updateOrderbook(data as L2BookData)
        })

        // separate subscription per data type
        const unsubTrades = wsStore.subscribe(`trades:${symbol}`, (data) => {
            get().addTrades(data as Trade | Trade[])
        })

        // global price feed for all symbols
        const unsubPrices = wsStore.subscribe('allMids', (data) => {
            const midsData = data as { mids?: Record<string, string> }
            if (midsData?.mids) {
                get().updateAllPrices(midsData.mids)
                // update kpis from price
                const px = parseFloat(midsData.mids[symbol])
                if (px) get().updateMarketKPIs({ markPx: px, oraclePx: px })
            }
        })

        // store cleanup functions for clean unsubscribe
        set({
            clearSubscriptions: () => {
                unsubOrderbook()
                unsubTrades()
                unsubPrices()
            },
        })
    },

    unsubscribeFromMarket: () => {
        get().clearSubscriptions?.()
        set({
            trades: [],
            orderbook: {
                bids: [],
                asks: [],
                spread: 0,
                spreadPercentage: 0,
                midPrice: 0,
            },
        })
    },

    clearSubscriptions: () => {},
}))

// global price subscription for all markets
if (typeof window !== 'undefined') {
    const wsStore = useWsStore.getState()
    wsStore.subscribe('allMids', (data) => {
        const midsData = data as { mids?: Record<string, string> }
        if (midsData?.mids) useMarketStore.getState().updateAllPrices(midsData.mids)
    })
}
