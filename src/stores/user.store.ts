import { create } from 'zustand'
import type { Balance, Position, OpenOrder, TwapOrder, Trade, FundingPayment, OrderHistory, ClearinghouseState } from '@/types/user-account.types'

// event types for websocket messages
interface UserFillEvent {
    type: 'fill'
    time: number | string
    coin: string
    side: 'B' | 'S'
    px: number | string
    sz: number | string
    fee?: number | string
}

interface UserOrderEvent {
    type: 'order'
    [key: string]: unknown
}

type UserEvent = UserFillEvent | UserOrderEvent

interface UserState {
    // wallet connection
    address: string | null
    isConnected: boolean
    setWallet: (address: string | null, isConnected: boolean) => void

    // account data
    balances: Balance[]
    positions: Position[]
    openOrders: OpenOrder[]
    twapOrders: TwapOrder[]
    tradeHistory: Trade[]
    fundingHistory: FundingPayment[]
    orderHistory: OrderHistory[]

    // update functions
    updateBalances: (balances: Balance[]) => void
    updatePositions: (positions: Position[]) => void
    updateOpenOrders: (orders: OpenOrder[]) => void
    updateTwapOrders: (orders: TwapOrder[]) => void
    updateTradeHistory: (trades: Trade[]) => void
    updateFundingHistory: (funding: FundingPayment[]) => void
    updateOrderHistory: (orders: OrderHistory[]) => void

    // update from clearinghouse state
    updateFromClearinghouse: (state: ClearinghouseState) => void

    // websocket updates
    handleUserEvent: (event: UserEvent) => void

    // subscriptions
    subscribeToUser: () => void
    unsubscribeFromUser: () => void

    // cleanup
    clearUserData: () => void
}

// no persistence - sensitive financial data
export const useUserStore = create<UserState>((set, get) => ({
    address: null,
    isConnected: false,
    balances: [],
    positions: [],
    openOrders: [],
    twapOrders: [],
    tradeHistory: [],
    fundingHistory: [],
    orderHistory: [],

    setWallet: (address, isConnected) => {
        set({ address, isConnected })
        if (isConnected && address) return get().subscribeToUser()
        get().unsubscribeFromUser()
        get().clearUserData()
    },

    updateBalances: (balances) => set({ balances }),
    updatePositions: (positions) => set({ positions }),
    updateOpenOrders: (openOrders) => set({ openOrders }),
    updateTwapOrders: (twapOrders) => set({ twapOrders }),
    updateTradeHistory: (tradeHistory) => set({ tradeHistory }),
    updateFundingHistory: (fundingHistory) => set({ fundingHistory }),
    updateOrderHistory: (orderHistory) => set({ orderHistory }),

    updateFromClearinghouse: (state) => {
        // guard: no state
        if (!state) return

        const balances: Balance[] = []
        const positions: Position[] = []

        // extract account balance
        if (state.marginSummary) {
            balances.push({
                coin: 'USDC',
                total: state.marginSummary.accountValue,
                available: state.withdrawable || '0',
                usdcValue: state.marginSummary.accountValue,
                pnl: 0,
                roe: 0,
            })
        }

        // extract positions
        if (state.assetPositions) {
            state.assetPositions.forEach((asset) => {
                const pos = asset.position
                if (pos && parseFloat(pos.szi) !== 0) {
                    const size = parseFloat(pos.szi)
                    positions.push({
                        coin: pos.coin,
                        side: size > 0 ? 'long' : 'short',
                        size: Math.abs(size).toString(),
                        value: pos.positionValue,
                        entryPrice: pos.entryPx || '0',
                        markPrice: '0', // updated from market data
                        pnl: pos.unrealizedPnl || 0,
                        pnlPercentage: pos.returnOnEquity || 0,
                        liqPrice: pos.liquidationPx || undefined,
                        margin: pos.marginUsed || '0',
                        funding: pos.cumFunding?.allTime || '0',
                        leverage: pos.maxLeverage,
                    })
                }
            })
        }

        set({ balances, positions })
    },

    handleUserEvent: (event: UserEvent) => {
        // handle different event types
        if (event.type === 'fill') {
            // new trade
            const trade: Trade = {
                time: Number(event.time),
                coin: String(event.coin),
                side: event.side === 'B' ? 'buy' : 'sell',
                price: String(event.px),
                size: String(event.sz),
                value: (parseFloat(String(event.px)) * parseFloat(String(event.sz))).toString(),
                fee: String(event.fee || '0'),
            }
            set((state) => ({
                tradeHistory: [trade, ...state.tradeHistory].slice(0, 100),
            }))
        } else if (event.type === 'order') {
            // order update - refetch open orders
            // this would trigger a react query refetch
        }
    },

    subscribeToUser: () => {
        // subscriptions are handled by useHyperliquidUserAccount hook
        // this is now just a placeholder for compatibility
        console.log('User subscriptions are handled by useHyperliquidUserAccount hook')
    },

    unsubscribeFromUser: () => {
        // subscriptions are handled by useHyperliquidUserAccount hook
        console.log('User unsubscriptions are handled by useHyperliquidUserAccount hook')
    },

    clearUserData: () => {
        set({
            balances: [],
            positions: [],
            openOrders: [],
            twapOrders: [],
            tradeHistory: [],
            fundingHistory: [],
            orderHistory: [],
        })
    },
}))
