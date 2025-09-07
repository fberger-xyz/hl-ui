import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { env } from '@/env/t3-env'
import { APP_METADATA } from '@/config/app.config'
import { TradeTableTabs, TradeOrderbookAndTradesTabs, TradePanelTabs, TradeSide } from '@/enums'

interface FavoriteMarket {
    symbol: string
    type: 'perp' | 'spot'
}

interface UiState {
    // mobile menu
    showMobileMenu: boolean
    setShowMobileMenu: (open: boolean) => void
    toggleMobileMenu: () => void

    // hydration
    hasHydrated: boolean
    setHasHydrated: (hydrated: boolean) => void

    // trade tabs
    selectedTradeTab: TradeTableTabs
    setSelectedTradeTab: (tab: TradeTableTabs) => void

    // orderbook/trades tabs
    selectedOrderbookAndTradesTab: TradeOrderbookAndTradesTabs
    setSelectedOrderbookAndTradesTab: (tab: TradeOrderbookAndTradesTabs) => void

    // trade panel tabs
    selectedTradePanelTab: TradePanelTabs
    setSelectedTradePanelTab: (tab: TradePanelTabs) => void

    // trade side
    selectedTradeSide: TradeSide
    setSelectedTradeSide: (side: TradeSide) => void

    // current symbol
    currentSymbol: string
    setCurrentSymbol: (symbol: string) => void

    // favorites
    favoriteMarkets: FavoriteMarket[]
    addFavoriteMarket: (market: FavoriteMarket) => void
    removeFavoriteMarket: (symbol: string, type: 'perp' | 'spot') => void
    toggleFavoriteMarket: (market: FavoriteMarket) => void
    isFavoriteMarket: (symbol: string, type: 'perp' | 'spot') => boolean
}

const MAX_FAVORITES = 15
const IS_DEV = process.env.NODE_ENV === 'development'

export const useUiStore = create<UiState>()(
    persist(
        (set, get) => ({
            showMobileMenu: false,
            setShowMobileMenu: (open) => set({ showMobileMenu: open }),
            toggleMobileMenu: () => set((state) => ({ showMobileMenu: !state.showMobileMenu })),

            hasHydrated: false,
            setHasHydrated: (hydrated) => set({ hasHydrated: hydrated }),

            selectedTradeTab: TradeTableTabs.BALANCES,
            setSelectedTradeTab: (tab) => set({ selectedTradeTab: tab }),

            selectedOrderbookAndTradesTab: TradeOrderbookAndTradesTabs.ORDERBOOK,
            setSelectedOrderbookAndTradesTab: (tab) => set({ selectedOrderbookAndTradesTab: tab }),

            selectedTradePanelTab: TradePanelTabs.MARKET,
            setSelectedTradePanelTab: (tab) => set({ selectedTradePanelTab: tab }),

            selectedTradeSide: TradeSide.BUY,
            setSelectedTradeSide: (side) => set({ selectedTradeSide: side }),

            currentSymbol: 'BTC',
            setCurrentSymbol: (symbol) => set({ currentSymbol: symbol }),

            favoriteMarkets: [],

            addFavoriteMarket: (market) => {
                const currentFavorites = get().favoriteMarkets
                // guard: already exists
                if (currentFavorites.some((f) => f.symbol === market.symbol && f.type === market.type)) return
                // guard: max limit
                if (currentFavorites.length >= MAX_FAVORITES) return console.warn(`Maximum ${MAX_FAVORITES} favorites allowed`)
                set({ favoriteMarkets: [...currentFavorites, market] })
            },

            removeFavoriteMarket: (symbol, type) => {
                set((state) => ({
                    favoriteMarkets: state.favoriteMarkets.filter((f) => !(f.symbol === symbol && f.type === type)),
                }))
            },

            toggleFavoriteMarket: (market) => {
                const isFavorite = get().isFavoriteMarket(market.symbol, market.type)
                if (isFavorite) return get().removeFavoriteMarket(market.symbol, market.type)
                get().addFavoriteMarket(market)
            },

            isFavoriteMarket: (symbol, type) => {
                return get().favoriteMarkets.some((f) => f.symbol === symbol && f.type === type)
            },
        }),
        {
            name: `${APP_METADATA.SITE_DOMAIN}-ui-store-${IS_DEV ? 'dev' : 'prod'}-${env.NEXT_PUBLIC_COMMIT_TIMESTAMP || 'v1'}`,
            storage: createJSONStorage(() => ({
                getItem: (name: string) => {
                    try {
                        // guard: no window
                        if (typeof window === 'undefined') return null
                        return localStorage.getItem(name)
                    } catch (error) {
                        console.error('Failed to get from localStorage:', error)
                        return null
                    }
                },
                setItem: (name: string, value: string) => {
                    try {
                        // guard: no window
                        if (typeof window === 'undefined') return
                        localStorage.setItem(name, value)
                    } catch (error) {
                        console.error('localStorage quota exceeded, clearing old data...')
                        if (typeof window !== 'undefined' && error instanceof DOMException && error.name === 'QuotaExceededError') {
                            // clear old versions
                            const keys = Object.keys(localStorage)
                            keys.forEach((key) => {
                                if (
                                    key.includes('-store-') &&
                                    (!env.NEXT_PUBLIC_COMMIT_TIMESTAMP || !key.includes(env.NEXT_PUBLIC_COMMIT_TIMESTAMP))
                                ) {
                                    localStorage.removeItem(key)
                                }
                            })
                            // try again
                            try {
                                localStorage.setItem(name, value)
                            } catch {
                                localStorage.clear()
                                localStorage.setItem(name, value)
                            }
                        }
                    }
                },
                removeItem: (name: string) => {
                    try {
                        // guard: no window
                        if (typeof window === 'undefined') return
                        localStorage.removeItem(name)
                    } catch (error) {
                        console.error('Failed to remove from localStorage:', error)
                    }
                },
            })),
            skipHydration: false,
            onRehydrateStorage: () => (state) => {
                if (state && !state.hasHydrated) state.setHasHydrated(true)
            },
            partialize: (state) => ({
                showMobileMenu: state.showMobileMenu,
                selectedTradeTab: state.selectedTradeTab,
                selectedOrderbookAndTradesTab: state.selectedOrderbookAndTradesTab,
                selectedTradePanelTab: state.selectedTradePanelTab,
                selectedTradeSide: state.selectedTradeSide,
                favoriteMarkets: state.favoriteMarkets,
                currentSymbol: state.currentSymbol,
            }),
        },
    ),
)
