'use client'

import { cn } from '@/utils'
import { logger } from '@/utils/logger.util'
import { useRef, useEffect, useState, useLayoutEffect, useCallback, ReactNode } from 'react'
import { NuqsKeys, TradeTableTabs } from '@/enums'
import { useQueryState } from 'nuqs'
import IconWrapper from '@/components/shared/Wrappers/IconWrapper'
import { IconIds } from '@/enums/icons.enum'
import TextWithTooltip from '@/components/primitives/Tooltip/TextWithTooltip'
import { useHyperliquidUserAccount } from '@/hooks/useHyperliquidUserAccount'
import type { UserAccountData, Balance, Position, OpenOrder, TwapOrder, Trade, FundingPayment, OrderHistory } from '@/types/user-account.types'
import {
    BalanceRow,
    PositionRow,
    OpenOrderRow,
    TwapOrderRow,
    TradeRow,
    FundingRow,
    OrderHistoryRow,
    BalanceTableTemplate,
    PositionTableTemplate,
    OpenOrderTableTemplate,
    TwapOrderTableTemplate,
    TradeTableTemplate,
    FundingTableTemplate,
    OrderHistoryTableTemplate,
} from '@/components/shared/Table/TableRowTemplates'
import toast from 'react-hot-toast'
import { useVirtualizer } from '@tanstack/react-virtual'

// ============================================
// types
// ============================================

type ColumnConfig = {
    label: string
    sortable?: boolean
    tooltip?: string
}

type TableHandlers = {
    handleCancelOrder?: (orderId: string | number) => void
    [key: string]: unknown
}

type TableConfig<T = unknown> = {
    HeaderComponent: React.ComponentType<any> // eslint-disable-line @typescript-eslint/no-explicit-any
    RowComponent: React.ComponentType<any> // eslint-disable-line @typescript-eslint/no-explicit-any
    getData: (accountData: UserAccountData) => T[]
    emptyMessage: string
    isHistorical: boolean
    columns: Record<string, ColumnConfig>
    renderExtraContent?: (data: T[], handlers: TableHandlers) => ReactNode
}

// ============================================
// components
// ============================================

// reusable loading spinner
function LoadingSpinner() {
    return (
        <div className="flex h-full items-center justify-center p-4">
            <div className="text-center">
                <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-hlr-5 border-t-transparent" />
                {/* <p className="text-hlt-17">{message}</p> */}
            </div>
        </div>
    )
}

// reusable empty state
function EmptyState({ message }: { message: string }) {
    return <p className="p-2 text-hlt-17">{message}</p>
}

// sortable column header
function SortableColumn({ label, tooltip, sortable = false }: ColumnConfig) {
    return (
        <button className="group flex flex-shrink-0 cursor-pointer items-center gap-1 text-left">
            {tooltip ? <TextWithTooltip tooltip={{ text: tooltip }} text={label} /> : <p>{label}</p>}
            {sortable && (
                <IconWrapper id={IconIds.CHEVRON_DOWN} className="size-3.5 text-transparent transition-colors duration-200 group-hover:text-hlt-17" />
            )}
        </button>
    )
}

// ============================================
// table configurations
// ============================================

const TABLE_CONFIGS: Record<TradeTableTabs, TableConfig> = {
    [TradeTableTabs.BALANCES]: {
        HeaderComponent: BalanceTableTemplate,
        RowComponent: BalanceRow,
        getData: (accountData) => accountData.balances,
        emptyMessage: 'No balances yet',
        isHistorical: false,
        columns: {
            coin: { label: 'Coin', sortable: true },
            total: { label: 'Total Balance', sortable: true },
            available: { label: 'Available Balance', sortable: true },
            usdcValue: { label: 'USDC Value', sortable: true },
            pnl: {
                label: 'PNL (ROE %)',
                sortable: true,
                tooltip: 'Mark price is used to estimate unrealized PNL. Only trade prices are used for realized PNL.',
            },
            send: { label: 'Send' },
            transfer: { label: 'Transfer' },
            contract: { label: 'Contract' },
        },
    },
    [TradeTableTabs.POSITIONS]: {
        HeaderComponent: PositionTableTemplate,
        RowComponent: PositionRow,
        getData: (accountData) => accountData.positions,
        emptyMessage: 'No open positions yet',
        isHistorical: false,
        columns: {
            coin: { label: 'Coin', sortable: true },
            size: { label: 'Size', sortable: true },
            value: { label: 'Position Value', sortable: true },
            entryPrice: { label: 'Entry Price', sortable: true },
            markPrice: { label: 'Mark Price', sortable: true },
            pnl: {
                label: 'PNL (ROE %)',
                sortable: true,
                tooltip: 'Mark price is used to estimate unrealized PNL. Only trade prices are used for realized PNL.',
            },
            liqPrice: { label: 'Liq. Price', sortable: true },
            margin: { label: 'Margin', sortable: true, tooltip: 'For isolated positions margin includes unrealized pnl.' },
            funding: {
                label: 'Funding',
                sortable: true,
                tooltip: 'Net funding payments since the position was opened. Hover for all-time and since changed.',
            },
            close: { label: 'Close' },
            tpsl: { label: 'TP/SL' },
        },
    },
    [TradeTableTabs.OPEN_ORDERS]: {
        HeaderComponent: OpenOrderTableTemplate,
        RowComponent: OpenOrderRow,
        getData: (accountData) => accountData.openOrders,
        emptyMessage: 'No open orders yet',
        isHistorical: false,
        columns: {
            time: { label: 'Time', sortable: true },
            type: { label: 'Type', sortable: true },
            coin: { label: 'Coin', sortable: true },
            side: { label: 'Direction' },
            size: { label: 'Size', sortable: true },
            originalSize: { label: 'Original Size', sortable: true },
            value: { label: 'Order Value', sortable: true },
            price: { label: 'Price', sortable: true },
            reduceOnly: { label: 'Reduce Only' },
            triggerCondition: { label: 'Trigger Conditions' },
            tpsl: { label: 'TP/SL' },
        },
        renderExtraContent: (orders, { handleCancelAllOrders }) =>
            orders.length > 0 ? (
                <div className="flex justify-end p-2">
                    <button className="rounded bg-hlb-10 px-3 py-1 text-xs text-hlt-12 hover:bg-hlb-9" onClick={handleCancelAllOrders as () => void}>
                        Cancel All Orders
                    </button>
                </div>
            ) : null,
    },
    [TradeTableTabs.TWAP]: {
        HeaderComponent: TwapOrderTableTemplate,
        RowComponent: TwapOrderRow,
        getData: (accountData) => accountData.twapOrders,
        emptyMessage: 'No TWAP yet',
        isHistorical: false,
        columns: {
            coin: { label: 'Coin', sortable: true },
            size: { label: 'Size', sortable: true },
            executedSize: { label: 'Executed Size', sortable: true },
            averagePrice: { label: 'Average Price', sortable: true },
            runningTime: { label: 'Running Time / Total' },
            reduceOnly: { label: 'Reduce Only' },
            creationTime: { label: 'Creation Time', sortable: true },
            action: { label: 'Terminate' },
        },
    },
    [TradeTableTabs.TRADE_HISTORY]: {
        HeaderComponent: TradeTableTemplate,
        RowComponent: TradeRow,
        getData: (accountData) => accountData.tradeHistory,
        emptyMessage: 'No trade history yet',
        isHistorical: true,
        columns: {
            time: { label: 'Time', sortable: true },
            coin: { label: 'Coin', sortable: true },
            direction: { label: 'Direction' },
            price: { label: 'Price', sortable: true },
            size: { label: 'Size', sortable: true },
            value: { label: 'Trade Value', sortable: true },
            fee: { label: 'Fee', sortable: true },
            closedPnl: { label: 'Closed PNL', sortable: true, tooltip: 'Closed PNL includes fees and rebates.' },
        },
    },
    [TradeTableTabs.FUNDING_HISTORY]: {
        HeaderComponent: FundingTableTemplate,
        RowComponent: FundingRow,
        getData: (accountData) => accountData.fundingHistory,
        emptyMessage: 'No funding history yet',
        isHistorical: true,
        columns: {
            time: { label: 'Time', sortable: true },
            coin: { label: 'Coin', sortable: true },
            size: { label: 'Size', sortable: true },
            positionSide: { label: 'Position Side' },
            payment: { label: 'Payment', sortable: true },
            rate: { label: 'Rate', sortable: true },
        },
    },
    [TradeTableTabs.ORDER_HISTORY]: {
        HeaderComponent: OrderHistoryTableTemplate,
        RowComponent: OrderHistoryRow,
        getData: (accountData) => accountData.orderHistory,
        emptyMessage: 'No order history yet',
        isHistorical: true,
        columns: {
            time: { label: 'Time', sortable: true },
            type: { label: 'Type', sortable: true },
            coin: { label: 'Coin', sortable: true },
            side: { label: 'Direction' },
            filledSize: { label: 'Filled Size', sortable: true, tooltip: 'Also includes rejected size for reduce only orders.' },
            filledRatio: { label: 'Filled Ratio', sortable: true },
            value: { label: 'Order Value', sortable: true },
            price: { label: 'Price', sortable: true },
            reduceOnly: { label: 'Reduce Only' },
            triggerCondition: { label: 'Trigger Conditions' },
            tpsl: { label: 'TP/SL' },
            status: { label: 'Status' },
            orderId: { label: 'Order ID' },
        },
    },
}

// ============================================
// table content renderer
// ============================================

function TableContent({
    config,
    data,
    isLoading,
    isLoadingHistory,
    handlers,
    scrollRef,
}: {
    config: TableConfig
    data: unknown[]
    isLoading: boolean
    isLoadingHistory: boolean
    handlers: Record<string, unknown>
    scrollRef?: React.RefObject<HTMLDivElement | null>
}) {
    const { RowComponent, emptyMessage, isHistorical, renderExtraContent } = config

    // determine if virtualization should be used (for historical tables with many rows)
    const shouldVirtualize = isHistorical && data.length > 50

    // virtualizer for large datasets
    const rowVirtualizer = useVirtualizer({
        count: data.length,
        getScrollElement: () => scrollRef?.current || null,
        estimateSize: () => 40, // estimated row height
        overscan: 5, // render 5 items outside visible area
        enabled: shouldVirtualize && !!scrollRef?.current,
    })

    // show loading for historical data
    if (isHistorical && isLoadingHistory) return <LoadingSpinner />

    // show loading for non-historical data
    if (!isHistorical && isLoading) return <LoadingSpinner />

    // empty state
    if (!data.length) return <EmptyState message={emptyMessage} />

    // row renderer configuration map
    const ROW_RENDERERS: Record<string, (item: unknown, index: number) => ReactNode> = {
        [BalanceRow.name]: (item: unknown, index) => {
            const balance = item as Balance
            return <BalanceRow key={`${balance.coin}-${index}`} balance={balance} />
        },

        [PositionRow.name]: (item: unknown, index) => {
            const position = item as Position
            return <PositionRow key={`${position.coin}-${index}`} position={position} onClose={() => toast('Close position not yet implemented')} />
        },

        [OpenOrderRow.name]: (item: unknown, index) => {
            const order = item as OpenOrder
            return (
                <OpenOrderRow
                    key={`${order.id}-${index}`}
                    order={order}
                    onCancel={() => (handlers.handleCancelOrder as (id: string, coin: string) => void)?.(order.id.toString(), order.coin)}
                />
            )
        },

        [TwapOrderRow.name]: (item: unknown, index) => {
            const order = item as TwapOrder
            return <TwapOrderRow key={`${order.id}-${index}`} order={order} onTerminate={() => toast('Terminate TWAP not yet implemented')} />
        },

        [TradeRow.name]: (item: unknown, index) => <TradeRow key={`trade-${index}`} trade={item as Trade} />,

        [FundingRow.name]: (item: unknown, index) => <FundingRow key={`funding-${index}`} funding={item as FundingPayment} />,

        [OrderHistoryRow.name]: (item: unknown, index) => <OrderHistoryRow key={`order-${index}`} order={item as OrderHistory} />,
    }

    // render single row based on type
    const renderRow = (item: unknown, index: number) => {
        const renderer = ROW_RENDERERS[RowComponent.name]
        return renderer ? renderer(item, index) : null
    }

    // render rows with virtualization for large datasets
    if (shouldVirtualize && scrollRef?.current) {
        return (
            <>
                {renderExtraContent?.(data, handlers)}
                <div className="relative" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => (
                        <div
                            key={virtualRow.index}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: `${virtualRow.size}px`,
                                transform: `translateY(${virtualRow.start}px)`,
                            }}>
                            {renderRow(data[virtualRow.index], virtualRow.index)}
                        </div>
                    ))}
                </div>
            </>
        )
    }

    // render all rows for small datasets
    return (
        <>
            {renderExtraContent?.(data, handlers)}
            {data.map((item, index) => renderRow(item, index))}
        </>
    )
}

// ============================================
// main component
// ============================================

function TradeTables() {
    const [selectedTab, setSelectedTab] = useQueryState(NuqsKeys.TABLE, {
        defaultValue: TradeTableTabs.BALANCES,
        parse: (value) => (Object.values(TradeTableTabs).includes(value as TradeTableTabs) ? (value as TradeTableTabs) : TradeTableTabs.BALANCES),
    })
    const tabRefs = useRef<(HTMLDivElement | null)[]>([])
    const [borderStyle, setBorderStyle] = useState({ left: 0, width: 0 })
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    // fetch user account data
    const { accountData, isLoading, isLoadingHistory, cancelOrder, cancelAllOrders, isConnected } = useHyperliquidUserAccount({
        enabled: true, // always enable, hook will handle address check
    })

    // sliding border position
    const updateBorderPosition = useCallback(() => {
        const selectedIndex = Object.keys(TABLE_CONFIGS).indexOf(selectedTab)
        const selectedTabElement = tabRefs.current[selectedIndex]
        if (!selectedTabElement) return
        setBorderStyle({
            left: selectedTabElement.offsetLeft,
            width: selectedTabElement.offsetWidth,
        })
    }, [selectedTab])

    useLayoutEffect(() => {
        updateBorderPosition()
    }, [selectedTab, updateBorderPosition])

    useEffect(() => {
        const timer = setTimeout(updateBorderPosition, 10)
        window.addEventListener('resize', updateBorderPosition)
        return () => {
            clearTimeout(timer)
            window.removeEventListener('resize', updateBorderPosition)
        }
    }, [updateBorderPosition])

    // handlers
    const handleCancelOrder = useCallback(
        async (orderId: string, coin: string) => {
            try {
                await cancelOrder(orderId, coin)
                toast.success('Order cancelled')
            } catch (error) {
                toast.error('Failed to cancel order')
                logger.error('Failed to cancel order:', error)
            }
        },
        [cancelOrder],
    )

    const handleCancelAllOrders = useCallback(async () => {
        try {
            await cancelAllOrders()
            toast.success('All orders cancelled')
        } catch (error) {
            toast.error('Failed to cancel orders')
            logger.error('Failed to cancel all orders:', error)
        }
    }, [cancelAllOrders])

    const handlers = { handleCancelOrder, handleCancelAllOrders }

    // get current table config
    const currentConfig = TABLE_CONFIGS[selectedTab]
    const currentData = currentConfig.getData(accountData)

    // render header columns
    const renderHeaderColumns = () => {
        const { HeaderComponent, columns } = currentConfig
        const columnProps: Record<string, ReactNode> = {}

        Object.entries(columns).forEach(([key, config]) => {
            if (config.sortable) {
                columnProps[key] = <SortableColumn {...config} />
            } else {
                columnProps[key] = <span>{config.label}</span>
            }
        })

        return <HeaderComponent variant="header" className="sticky top-0 z-10 bg-hlb-21" {...columnProps} />
    }

    // show connect wallet message when not connected
    if (!isConnected) {
        return (
            <div className="flex grow flex-col gap-0.5 overflow-x-auto">
                <div className="flex h-full items-center justify-center rounded bg-hlb-21 p-8">
                    <p className="text-hlt-17">Connect wallet to view account data</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex grow flex-col gap-0.5 overflow-x-auto">
            {/* tab navigation */}
            <div className="relative flex h-[35px] w-full rounded-t bg-hlb-21">
                {Object.entries(TABLE_CONFIGS).map(([tabName, config], index) => {
                    const data = config.getData(accountData)
                    const count = data.length
                    return (
                        <div
                            key={tabName}
                            ref={(el) => {
                                if (el) tabRefs.current[index] = el
                            }}
                            className="relative cursor-pointer px-4"
                            onClick={() => setSelectedTab(tabName as TradeTableTabs)}>
                            <div className="flex h-full items-center">
                                <p className={cn('transition-colors duration-300', selectedTab === tabName ? 'text-hlt-1' : 'text-hlt-17')}>
                                    {tabName}
                                    {count > 0 && ` (${count})`}
                                </p>
                            </div>
                        </div>
                    )
                })}

                {/* sliding border */}
                <div
                    className="absolute bottom-0 h-[1px] bg-hlb-1 transition-all duration-300 ease-out"
                    style={{
                        left: `${borderStyle.left}px`,
                        width: `${borderStyle.width}px`,
                    }}
                />
            </div>

            {/* table content */}
            <div className="min-h-full min-w-max rounded-b bg-hlb-21">
                <div className="flex max-h-[400px] flex-col">
                    {renderHeaderColumns()}
                    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
                        <TableContent
                            config={currentConfig}
                            data={currentData}
                            isLoading={isLoading}
                            isLoadingHistory={isLoadingHistory}
                            handlers={handlers}
                            scrollRef={scrollContainerRef}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TradeTables
