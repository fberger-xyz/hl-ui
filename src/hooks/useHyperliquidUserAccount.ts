'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useHyperliquidSDK } from '@/hooks/useHyperliquidSDK'
import { hyperliquidWS } from '@/services/hyperliquid-websocket'
import { HyperliquidWebSocketSubscriptionType } from '@/enums'
import { parseSide, calculateValue, parsePositionSide, getNestedValue, safeParseFloat } from '@/utils/hyperliquid-parsers.util'
import { logger } from '@/utils/logger.util'
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
import type { UserFill, ClearinghouseState as HLClearinghouseState, WsOrder, WebData2 } from '@/types/hyperliquid.types'
import {
    isWebData2Message,
    isWebSocketOrderArrayMessage,
    isWebSocketUserFillsMessage,
    isWebSocketFundingDataMessage,
    isWebSocketTwapHistoryMessage,
} from '@/utils/hyperliquid-type-guards'

interface UseHyperliquidUserAccountOptions {
    enabled?: boolean
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
        const balance = {
            coin: 'USDC',
            total: state.marginSummary.accountValue,
            available: state.withdrawable || '0',
            usdcValue: state.marginSummary.accountValue,
            pnl: 0,
            roe: 0,
        }
        balances.push(balance)
        logger.info('Parsed balance from clearinghouse state:', balance)
    } else {
        logger.warn('No marginSummary in clearinghouse state:', state)
    }

    // extract positions
    if (state.assetPositions) {
        logger.debug('Found assetPositions:', state.assetPositions.length)
        state.assetPositions.forEach((asset) => {
            const pos = asset.position
            logger.debug('Checking position:', { coin: pos?.coin, szi: pos?.szi })
            if (pos && parseFloat(pos.szi) !== 0) {
                const size = parseFloat(pos.szi)
                logger.info('Adding position:', { coin: pos.coin, size })
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
                    funding: pos.cumFunding?.allTime || '0', // fixed: cumFunding is directly on position
                    leverage: undefined,
                })
            }
        })
    }

    return { balances, positions }
}

// parse webdata2 to account state
function parseWebData2(data: WebData2 | null): {
    balances: Balance[]
    positions: Position[]
} {
    if (!data) return { balances: [], positions: [] }

    const balances: Balance[] = []
    const positions: Position[] = []

    // extract balance from webdata2
    if (data.clearinghouseState) {
        return parseClearinghouseState(data.clearinghouseState as HLClearinghouseState)
    }

    return { balances, positions }
}

// removed: unused after websocket migration

// parse ws orders to open orders
function parseWsOrders(orders: WsOrder[]): OpenOrder[] {
    return orders
        .filter((order) => order.status === 'open' || order.status === 'triggered')
        .map((order) => ({
            id: order.order.oid,
            time: order.order.timestamp,
            type: 'limit',
            coin: order.order.coin,
            side: parseSide(order.order.side),
            size: order.order.sz,
            filledSize: (safeParseFloat(order.order.origSz) - safeParseFloat(order.order.sz)).toString(),
            originalSize: order.order.origSz,
            price: order.order.limitPx,
            value: calculateValue(order.order.sz, order.order.limitPx),
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
        side: parseSide(fill.side),
        price: fill.px,
        size: fill.sz,
        value: calculateValue(fill.sz, fill.px),
        fee: fill.fee || '0',
        feeRate: undefined,
        closedPnl: fill.closedPnl ? safeParseFloat(fill.closedPnl) : undefined,
        orderType: undefined,
        orderId: fill.oid.toString(),
    }))
}

// helper to parse funding history
function parseFundingHistory(funding: unknown[]): FundingPayment[] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return funding.map((f: any) => {
        const size = f.ntlPos || f.szi
        return {
            time: f.time,
            coin: f.coin,
            size: size,
            positionSide: parsePositionSide(size),
            payment: f.payment || f.usdc,
            rate: f.fundingRate,
        }
    })
}

// helper to parse order history
function parseOrderHistory(orders: unknown[]): OrderHistory[] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return orders.map((order: any) => {
        const side = getNestedValue(order, ['order.side', 'side'], 'B')
        const size = getNestedValue(order, ['order.sz', 'sz'], '0')
        const price = getNestedValue(order, ['order.px', 'px', 'order.limitPx', 'limitPx'], '0')

        return {
            time: getNestedValue(order, ['order.timestamp', 'timestamp', 'time'], Date.now()),
            type: getNestedValue(order, ['order.orderType', 'orderType'], 'limit'),
            coin: getNestedValue(order, ['order.coin', 'coin'], 'UNKNOWN'),
            side: parseSide(side),
            filledSize: getNestedValue(order, ['order.filledSz', 'filledSz'], '0'),
            originalSize: getNestedValue(order, ['order.origSz', 'origSz', 'order.sz', 'sz'], '0'),
            price: price,
            value: calculateValue(size, price),
            reduceOnly: getNestedValue(order, ['order.reduceOnly', 'reduceOnly'], false),
            triggerCondition: getNestedValue(order, ['order.triggerCondition', 'triggerCondition'], undefined),
            tpsl: getNestedValue(order, ['order.tpsl', 'tpsl'], undefined),
            status: order.status || 'filled',
            orderId: getNestedValue(order, ['order.oid', 'oid', 'id'], ''),
            cancelReason: order.cancelReason,
        }
    })
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
    const { enabled = true } = options
    const { sdk, isInitialized, address: sdkAddress } = useHyperliquidSDK()

    // use address from sdk (only available when authenticated with wallets)
    const address = sdkAddress

    // state for websocket data
    const [webData, setWebData] = useState<WebData2 | null>(null)
    const [openOrders, setOpenOrders] = useState<OpenOrder[]>([])
    const [trades, setTrades] = useState<Trade[]>([])
    const [fundingPayments, setFundingPayments] = useState<FundingPayment[]>([])
    const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([])
    const [twapOrders, setTwapOrders] = useState<TwapOrder[]>([])
    const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    // refs for cleanup
    const unsubscribeRefs = useRef<(() => void)[]>([])

    // fetch initial account state and historical data via REST
    const fetchInitialUserData = useCallback(async () => {
        if (!sdk || !address) return

        try {
            // fetch initial account state to show immediately
            const userState = await sdk.getUserState(address)
            if (userState) {
                logger.info('Got initial userState from REST:', userState)
                // set initial webData with clearinghouse state
                setWebData({ clearinghouseState: userState } as WebData2)
            }

            // fetch historical data (websocket only provides updates)
            const [userFills, userFunding, historicalOrders] = await Promise.all([
                sdk.getUserFills(address),
                sdk.getUserFunding(address),
                sdk.getHistoricalOrders(address),
            ])

            // set historical data
            if (userFills && userFills.length > 0) {
                logger.info('Got user fills from REST:', userFills.length)
                setTrades(parseTrades(userFills))
            }

            if (userFunding && userFunding.length > 0) {
                logger.info('Got funding history from REST:', userFunding.length)
                setFundingPayments(parseFundingHistory(userFunding))
            }

            if (historicalOrders && historicalOrders.length > 0) {
                logger.info('Got order history from REST:', historicalOrders.length)
                setOrderHistory(parseOrderHistory(historicalOrders))
            }
        } catch (err) {
            logger.warn('Could not fetch initial data, waiting for WebSocket:', err)
        }

        // websocket will provide real-time updates
        setIsLoading(false)
    }, [sdk, address])

    useEffect(() => {
        // guard: require address and sdk (read-only is ok)
        if (!enabled || !address) {
            // clear all data when disconnected
            setWebData(null)
            setOpenOrders([])
            setTrades([])
            setFundingPayments([])
            setOrderHistory([])
            setTwapOrders([])
            setPortfolio(null)
            setIsLoading(false)
            setError(null)
            return
        }

        // fetch initial state while websocket connects
        fetchInitialUserData()

        // subscribe to websocket updates

        // 1. webdata2 for account state
        const unsubWebData = hyperliquidWS.subscribe(
            {
                type: HyperliquidWebSocketSubscriptionType.WEB_DATA2,
                user: address,
            },
            (data) => {
                if (isWebData2Message(data)) {
                    logger.debug('WebData2 received:', data)
                    setWebData(data)
                    setIsLoading(false)
                    // log positions if any
                    const parsed = parseWebData2(data)
                    if (parsed.positions.length > 0) {
                        logger.info('WebSocket positions update:', parsed.positions)
                    }
                }
            },
        )
        unsubscribeRefs.current.push(unsubWebData)

        // 2. order updates
        const unsubOrders = hyperliquidWS.subscribe(
            {
                type: HyperliquidWebSocketSubscriptionType.ORDER_UPDATES,
                user: address,
            },
            (data) => {
                if (isWebSocketOrderArrayMessage(data)) {
                    setOpenOrders(parseWsOrders(data))
                }
            },
        )
        unsubscribeRefs.current.push(unsubOrders)

        // 3. user fills
        const unsubFills = hyperliquidWS.subscribe(
            {
                type: HyperliquidWebSocketSubscriptionType.USER_FILLS,
                user: address,
                aggregateByTime: true, // match official client
            },
            (data) => {
                if (isWebSocketUserFillsMessage(data)) {
                    if (data.isSnapshot) {
                        // replace all trades with snapshot
                        setTrades(parseTrades(data.fills as UserFill[]))
                    } else {
                        // append new fills
                        setTrades((prev) => [...parseTrades(data.fills as UserFill[]), ...prev].slice(0, 1000)) // keep last 1000 trades
                    }
                }
            },
        )
        unsubscribeRefs.current.push(unsubFills)

        // 4. funding payments
        const unsubFunding = hyperliquidWS.subscribe(
            {
                type: HyperliquidWebSocketSubscriptionType.USER_FUNDINGS,
                user: address,
            },
            (data) => {
                if (isWebSocketFundingDataMessage(data)) {
                    if (data.isSnapshot) {
                        // replace all funding with snapshot
                        setFundingPayments(parseFundingHistory(data.fundings))
                    } else {
                        // append new funding
                        setFundingPayments((prev) => [...parseFundingHistory(data.fundings), ...prev].slice(0, 1000)) // keep last 1000
                    }
                }
            },
        )
        unsubscribeRefs.current.push(unsubFunding)

        // 5. twap history
        const unsubTwapHistory = hyperliquidWS.subscribe(
            {
                type: HyperliquidWebSocketSubscriptionType.USER_TWAP_HISTORY,
                user: address,
            },
            (data) => {
                if (isWebSocketTwapHistoryMessage(data)) {
                    if (data.isSnapshot) {
                        // replace all with snapshot
                        setTwapOrders(parseTwapOrders(data.history || []))
                    } else if (data.history) {
                        // append new twap updates
                        setTwapOrders((prev) => [...parseTwapOrders(data.history), ...prev].slice(0, 100)) // keep last 100 twap orders
                    }
                }
            },
        )
        unsubscribeRefs.current.push(unsubTwapHistory)

        // 6. notification
        const unsubNotification = hyperliquidWS.subscribe(
            {
                type: HyperliquidWebSocketSubscriptionType.NOTIFICATION,
                user: address,
            },
            (data) => {
                // handle notifications if needed
                logger.debug('Notification received:', data)
            },
        )
        unsubscribeRefs.current.push(unsubNotification)

        // 7. user non-funding ledger updates
        const unsubLedger = hyperliquidWS.subscribe(
            {
                type: HyperliquidWebSocketSubscriptionType.USER_NON_FUNDING_LEDGER_UPDATES,
                user: address,
            },
            (data) => {
                // handle ledger updates if needed
                logger.debug('Ledger update:', data)
            },
        )
        unsubscribeRefs.current.push(unsubLedger)

        // 8. user historical orders
        const unsubHistoricalOrders = hyperliquidWS.subscribe(
            {
                type: HyperliquidWebSocketSubscriptionType.USER_HISTORICAL_ORDERS,
                user: address,
            },
            (data) => {
                // handle historical orders updates
                logger.debug('Historical orders update:', data)
                // could parse and update orderHistory state here
            },
        )
        unsubscribeRefs.current.push(unsubHistoricalOrders)

        // 9. user twap slice fills
        const unsubTwapSliceFills = hyperliquidWS.subscribe(
            {
                type: HyperliquidWebSocketSubscriptionType.USER_TWAP_SLICE_FILLS,
                user: address,
            },
            (data) => {
                // handle twap slice fills
                logger.debug('TWAP slice fills:', data)
            },
        )
        unsubscribeRefs.current.push(unsubTwapSliceFills)

        // cleanup
        return () => {
            unsubscribeRefs.current.forEach((unsub) => unsub())
            unsubscribeRefs.current = []
        }
    }, [enabled, address, sdk, isInitialized, fetchInitialUserData])

    // combine all account data
    const parsedWebData = parseWebData2(webData)

    // log account data for debugging
    if (parsedWebData.balances.length > 0) {
        logger.info('Account has balances:', parsedWebData.balances)
    }
    if (parsedWebData.positions.length > 0) {
        logger.info('Account has positions:', parsedWebData.positions)
    }

    const accountData: UserAccountData = {
        ...parsedWebData,
        openOrders,
        twapOrders,
        tradeHistory: trades,
        fundingHistory: fundingPayments,
        orderHistory,
    }

    // websocket provides real-time updates
    const refreshBalances = useCallback(() => {
        logger.debug('Balances are updated via WebSocket in real-time')
    }, [])

    const refreshOrders = useCallback(() => {
        logger.debug('Orders are updated via WebSocket in real-time')
    }, [])

    const refreshAllUserData = useCallback(() => {
        logger.debug('All user data is updated via WebSocket in real-time')
    }, [])

    // cancel order function
    const cancelOrder = useCallback(
        async (orderId: string, coin: string) => {
            if (!sdk || !isInitialized) {
                throw new Error('SDK not initialized')
            }
            await sdk.cancelOrder(orderId, coin)
            // orders will update via websocket
        },
        [sdk, isInitialized],
    )

    // cancel all orders function
    const cancelAllOrders = useCallback(
        async (coin?: string) => {
            if (!sdk || !isInitialized) {
                throw new Error('SDK not initialized')
            }
            await sdk.cancelAllOrders(coin)
            // orders will update via websocket
        },
        [sdk, isInitialized],
    )

    return {
        // data
        accountData,
        portfolio,

        // loading states
        isLoading,
        isLoadingHistory: false, // no longer needed with websocket

        // error states
        error,

        // refresh functions
        refreshBalances,
        refreshOrders,
        refreshAll: refreshAllUserData,

        // action functions
        cancelOrder,
        cancelAllOrders,

        // connection status
        isConnected: !!address, // we have address from privy or wagmi
    }
}
