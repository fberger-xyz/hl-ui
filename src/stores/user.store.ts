import { create } from 'zustand'
import { useWsStore } from '@/stores/ws.store'
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

interface FillData {
    time: number | string
    coin: string
    side: 'B' | 'S'
    px: number | string
    sz: number | string
    fee?: number | string
}

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
        const address = get().address
        // guard: no address
        if (!address) return

        const wsStore = useWsStore.getState()

        // subscribe to user events
        wsStore.subscribe(`userEvents:${address}`, (data) => {
            get().handleUserEvent(data as UserEvent)
        })

        // subscribe to user fills
        wsStore.subscribe(`userFills:${address}`, (data) => {
            if (Array.isArray(data)) {
                const trades: Trade[] = data.map((fill: FillData) => ({
                    time: Number(fill.time),
                    coin: String(fill.coin),
                    side: fill.side === 'B' ? ('buy' as const) : ('sell' as const),
                    price: String(fill.px),
                    size: String(fill.sz),
                    value: (parseFloat(String(fill.px)) * parseFloat(String(fill.sz))).toString(),
                    fee: String(fill.fee || '0'),
                }))
                set((state) => ({
                    tradeHistory: [...trades, ...state.tradeHistory].slice(0, 100),
                }))
            }
        })
    },

    unsubscribeFromUser: () => {
        const address = get().address
        // guard: no address
        if (!address) return

        // unsubscribe handled by ref counting in ws store
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
