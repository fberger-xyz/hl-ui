'use client'

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { useHyperliquidSDK } from '@/hooks/useHyperliquidSDK'
import type {
    Balance,
    Position,
    OpenOrder,
    TwapOrder,
    Trade,
    FundingPayment,
    OrderHistory,
    UserAccountData,
    PortfolioData,
} from '@/types/user-account.types'
import type { OpenOrder as HLOpenOrder, UserFill, ClearinghouseState as HLClearinghouseState } from '@/types/hyperliquid.types'

interface UseHyperliquidUserAccountOptions {
    enabled?: boolean
    refetchInterval?: number
}

// parse clearinghouse state to ui types
function parseClearinghouseState(state: HLClearinghouseState | null): {
    balances: Balance[]
    positions: Position[]
} {
    if (!state) return { balances: [], positions: [] }

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
                    markPrice: '0', // need to get from market data
                    pnl: typeof pos.unrealizedPnl === 'number' ? pos.unrealizedPnl : parseFloat(pos.unrealizedPnl || '0'),
                    pnlPercentage: typeof pos.returnOnEquity === 'number' ? pos.returnOnEquity : parseFloat(pos.returnOnEquity || '0'),
                    liqPrice: pos.liquidationPx || undefined,
                    margin: pos.marginUsed || '0',
                    funding: pos.funding?.cumFunding?.allTime || '0',
                    leverage: undefined,
                })
            }
        })
    }

    return { balances, positions }
}

// helper to parse open orders
function parseOpenOrders(orders: HLOpenOrder[]): OpenOrder[] {
    return orders.map((order) => ({
        id: order.oid,
        time: order.timestamp || Date.now(),
        type: 'limit',
        coin: order.coin,
        side: order.side === 'B' ? 'buy' : 'sell',
        size: order.sz,
        filledSize: '0',
        originalSize: order.origSz || order.sz,
        price: order.limitPx,
        value: (parseFloat(order.sz) * parseFloat(order.limitPx)).toString(),
        reduceOnly: false,
        postOnly: false,
        triggerCondition: undefined,
        tpsl: undefined,
    }))
}

// helper to parse trade history
function parseTrades(fills: UserFill[]): Trade[] {
    return fills.map((fill) => ({
        time: fill.time,
        coin: fill.coin,
        side: fill.side === 'B' ? 'buy' : 'sell',
        price: fill.px,
        size: fill.sz,
        value: (parseFloat(fill.sz) * parseFloat(fill.px)).toString(),
        fee: fill.fee || '0',
        feeRate: undefined,
        closedPnl: fill.closedPnl ? parseFloat(fill.closedPnl) : undefined,
        orderType: undefined,
        orderId: fill.oid.toString(),
    }))
}

// helper to parse funding history
function parseFundingHistory(funding: unknown[]): FundingPayment[] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return funding.map((f: any) => ({
        time: f.time,
        coin: f.coin,
        size: f.ntlPos,
        positionSide: parseFloat(f.ntlPos) > 0 ? 'long' : 'short',
        payment: f.payment,
        rate: f.fundingRate,
    }))
}

// helper to parse order history
function parseOrderHistory(orders: unknown[]): OrderHistory[] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return orders.map((order: any) => ({
        time: order.timestamp || order.time,
        type: order.orderType || 'limit',
        coin: order.coin,
        side: order.side === 'B' ? 'buy' : 'sell',
        filledSize: order.filledSz || '0',
        originalSize: order.origSz || order.sz,
        price: order.px || order.limitPx,
        value: (parseFloat(order.sz || '0') * parseFloat(order.px || order.limitPx || '0')).toString(),
        reduceOnly: order.reduceOnly || false,
        triggerCondition: order.triggerCondition,
        tpsl: order.tpsl,
        status: order.status || 'filled',
        orderId: order.oid || order.id,
        cancelReason: order.cancelReason,
    }))
}

// helper to parse twap orders
function parseTwapOrders(twaps: unknown[]): TwapOrder[] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return twaps.map((twap: any) => ({
        id: twap.id,
        coin: twap.coin,
        side: twap.isBuy ? 'buy' : 'sell',
        size: twap.sz,
        executedSize: twap.executedSz || '0',
        averagePrice: twap.avgPx || '0',
        runningTime: twap.runningTime || 0,
        totalTime: twap.totalTime || twap.duration,
        reduceOnly: twap.reduceOnly || false,
        creationTime: twap.creationTime || twap.startTime,
        status: twap.status || 'active',
    }))
}

export function useHyperliquidUserAccount(options: UseHyperliquidUserAccountOptions = {}) {
    const { enabled = true, refetchInterval = 5000 } = options
    const { address, isConnected } = useAccount()
    const { sdk, isInitialized } = useHyperliquidSDK()
    const queryClient = useQueryClient()

    // main clearinghouse state query (balances + positions)
    const clearinghouseQuery = useQuery({
        queryKey: ['hyperliquid', 'clearinghouse', address],
        queryFn: async () => {
            if (!sdk || !address) return null
            const state = await sdk.getUserState(address)
            return state
        },
        enabled: enabled && isConnected && isInitialized && !!address,
        refetchInterval,
        staleTime: 2000,
    })

    // open orders query
    const openOrdersQuery = useQuery({
        queryKey: ['hyperliquid', 'openOrders', address],
        queryFn: async () => {
            if (!sdk || !address) return []
            return sdk.getOpenOrders(address)
        },
        enabled: enabled && isConnected && isInitialized && !!address,
        refetchInterval: 3000,
        staleTime: 1000,
    })

    // trade history query (last 7 days)
    const tradesQuery = useQuery({
        queryKey: ['hyperliquid', 'trades', address],
        queryFn: async () => {
            if (!sdk || !address) return []
            const endTime = Date.now()
            const startTime = endTime - 7 * 24 * 60 * 60 * 1000 // 7 days
            return sdk.getUserFillsByTime(address, startTime, endTime)
        },
        enabled: enabled && isConnected && isInitialized && !!address,
        refetchInterval: 30000,
        staleTime: 10000,
    })

    // funding history query (last 30 days)
    const fundingQuery = useQuery({
        queryKey: ['hyperliquid', 'funding', address],
        queryFn: async () => {
            if (!sdk || !address) return []
            const endTime = Date.now()
            const startTime = endTime - 30 * 24 * 60 * 60 * 1000 // 30 days
            return sdk.getUserFunding(address, startTime, endTime)
        },
        enabled: enabled && isConnected && isInitialized && !!address,
        refetchInterval: 30000,
        staleTime: 10000,
    })

    // order history query
    const orderHistoryQuery = useQuery({
        queryKey: ['hyperliquid', 'orderHistory', address],
        queryFn: async () => {
            if (!sdk || !address) return []
            return sdk.getHistoricalOrders(address)
        },
        enabled: enabled && isConnected && isInitialized && !!address,
        refetchInterval: 30000,
        staleTime: 10000,
    })

    // twap orders query
    const twapQuery = useQuery({
        queryKey: ['hyperliquid', 'twap', address],
        queryFn: async () => {
            if (!sdk || !address) return []
            return sdk.getTwapHistory(address)
        },
        enabled: enabled && isConnected && isInitialized && !!address,
        refetchInterval: 10000,
        staleTime: 5000,
    })

    // portfolio stats query
    const portfolioQuery = useQuery({
        queryKey: ['hyperliquid', 'portfolio', address],
        queryFn: async () => {
            if (!sdk || !address) return null
            return sdk.getUserPortfolio(address)
        },
        enabled: enabled && isConnected && isInitialized && !!address,
        refetchInterval: 60000,
        staleTime: 30000,
    })

    // combine all account data
    const accountData: UserAccountData = {
        ...parseClearinghouseState((clearinghouseQuery.data || null) as HLClearinghouseState | null),
        openOrders: parseOpenOrders((openOrdersQuery.data || []) as HLOpenOrder[]),
        twapOrders: parseTwapOrders(twapQuery.data || []),
        tradeHistory: parseTrades((tradesQuery.data || []) as UserFill[]),
        fundingHistory: parseFundingHistory(fundingQuery.data || []),
        orderHistory: parseOrderHistory(orderHistoryQuery.data || []),
    }

    // refresh functions
    const refreshBalances = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['hyperliquid', 'clearinghouse', address] })
    }, [queryClient, address])

    const refreshOrders = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['hyperliquid', 'openOrders', address] })
    }, [queryClient, address])

    const refreshAll = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['hyperliquid'] })
    }, [queryClient])

    // cancel order function
    const cancelOrder = useCallback(
        async (orderId: string, coin: string) => {
            if (!sdk || !isInitialized) {
                throw new Error('SDK not initialized')
            }
            await sdk.cancelOrder(orderId, coin)
            refreshOrders()
        },
        [sdk, isInitialized, refreshOrders],
    )

    // cancel all orders function
    const cancelAllOrders = useCallback(
        async (coin?: string) => {
            if (!sdk || !isInitialized) {
                throw new Error('SDK not initialized')
            }
            await sdk.cancelAllOrders(coin)
            refreshOrders()
        },
        [sdk, isInitialized, refreshOrders],
    )

    return {
        // data
        accountData,
        portfolio: portfolioQuery.data as PortfolioData | null,

        // loading states
        isLoading: clearinghouseQuery.isLoading || openOrdersQuery.isLoading,
        isLoadingHistory: tradesQuery.isLoading || fundingQuery.isLoading || orderHistoryQuery.isLoading,

        // error states
        error: clearinghouseQuery.error || openOrdersQuery.error,

        // refresh functions
        refreshBalances,
        refreshOrders,
        refreshAll,

        // action functions
        cancelOrder,
        cancelAllOrders,

        // status
        isConnected: isConnected && isInitialized,
    }
}
