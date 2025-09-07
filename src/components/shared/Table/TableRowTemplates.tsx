'use client'

import { cn, formatAmount } from '@/utils'
import { ReactNode } from 'react'
import IconWrapper from '@/components/shared/Wrappers/IconWrapper'
import { IconIds } from '@/enums/icons.enum'
import type { Balance, Position, OpenOrder, TwapOrder, Trade, FundingPayment, OrderHistory } from '@/types/user-account.types'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { showNotImplementedToast } from '@/utils/toast'

// ============================================
// column configurations
// ============================================

const BALANCE_COLUMNS = [
    { key: 'coin', width: 'w-[140px]', align: 'text-left' },
    { key: 'total', width: 'w-[120px]', align: 'text-left' },
    { key: 'available', width: 'w-[120px]', align: 'text-left' },
    { key: 'usdcValue', width: 'w-[120px]', align: 'text-left' },
    { key: 'pnl', width: 'w-[120px]', align: 'text-left' },
    { key: 'send', width: 'w-[100px]', align: 'text-left' },
    { key: 'transfer', width: 'w-[120px]', align: 'text-left' },
    { key: 'contract', width: 'w-[120px]', align: 'text-left' },
]

const POSITION_COLUMNS = [
    { key: 'coin', width: 'w-[120px]', align: 'text-left' },
    { key: 'size', width: 'w-[100px]', align: 'text-left' },
    { key: 'value', width: 'w-[100px]', align: 'text-left' },
    { key: 'entryPrice', width: 'w-[100px]', align: 'text-left' },
    { key: 'markPrice', width: 'w-[100px]', align: 'text-left' },
    { key: 'pnl', width: 'w-[120px]', align: 'text-left' },
    { key: 'liqPrice', width: 'w-[100px]', align: 'text-left' },
    { key: 'margin', width: 'w-[100px]', align: 'text-left' },
    { key: 'funding', width: 'w-[100px]', align: 'text-left' },
    { key: 'close', width: 'w-[100px]', align: 'text-left' },
    { key: 'tpsl', width: 'w-[100px]', align: 'text-left' },
]

const OPEN_ORDER_COLUMNS = [
    { key: 'time', width: 'w-[140px]', align: 'text-left' },
    { key: 'type', width: 'w-[100px]', align: 'text-left' },
    { key: 'coin', width: 'w-[100px]', align: 'text-left' },
    { key: 'side', width: 'w-[100px]', align: 'text-left' },
    { key: 'size', width: 'w-[100px]', align: 'text-left' },
    { key: 'originalSize', width: 'w-[100px]', align: 'text-left' },
    { key: 'value', width: 'w-[100px]', align: 'text-left' },
    { key: 'price', width: 'w-[100px]', align: 'text-left' },
    { key: 'reduceOnly', width: 'w-[100px]', align: 'text-left' },
    { key: 'triggerCondition', width: 'w-[120px]', align: 'text-left' },
    { key: 'tpsl', width: 'w-[100px]', align: 'text-left' },
]

const TWAP_ORDER_COLUMNS = [
    { key: 'coin', width: 'w-[100px]', align: 'text-left' },
    { key: 'size', width: 'w-[100px]', align: 'text-left' },
    { key: 'executedSize', width: 'w-[100px]', align: 'text-left' },
    { key: 'averagePrice', width: 'w-[100px]', align: 'text-left' },
    { key: 'runningTime', width: 'w-[120px]', align: 'text-left' },
    { key: 'reduceOnly', width: 'w-[100px]', align: 'text-left' },
    { key: 'creationTime', width: 'w-[140px]', align: 'text-left' },
    { key: 'action', width: 'w-[100px]', align: 'text-left' },
]

const TRADE_COLUMNS = [
    { key: 'time', width: 'w-[140px]', align: 'text-left' },
    { key: 'coin', width: 'w-[100px]', align: 'text-left' },
    { key: 'direction', width: 'w-[100px]', align: 'text-left' },
    { key: 'price', width: 'w-[100px]', align: 'text-left' },
    { key: 'size', width: 'w-[100px]', align: 'text-left' },
    { key: 'value', width: 'w-[100px]', align: 'text-left' },
    { key: 'fee', width: 'w-[100px]', align: 'text-left' },
    { key: 'closedPnl', width: 'w-[100px]', align: 'text-left' },
]

const FUNDING_COLUMNS = [
    { key: 'time', width: 'w-[140px]', align: 'text-left' },
    { key: 'coin', width: 'w-[100px]', align: 'text-left' },
    { key: 'size', width: 'w-[100px]', align: 'text-left' },
    { key: 'positionSide', width: 'w-[100px]', align: 'text-left' },
    { key: 'payment', width: 'w-[100px]', align: 'text-left' },
    { key: 'rate', width: 'w-[100px]', align: 'text-left' },
]

const ORDER_HISTORY_COLUMNS = [
    { key: 'time', width: 'w-[140px]', align: 'text-left' },
    { key: 'type', width: 'w-[100px]', align: 'text-left' },
    { key: 'coin', width: 'w-[100px]', align: 'text-left' },
    { key: 'side', width: 'w-[100px]', align: 'text-left' },
    { key: 'filledSize', width: 'w-[100px]', align: 'text-left' },
    { key: 'filledRatio', width: 'w-[100px]', align: 'text-left' },
    { key: 'value', width: 'w-[100px]', align: 'text-left' },
    { key: 'price', width: 'w-[100px]', align: 'text-left' },
    { key: 'reduceOnly', width: 'w-[100px]', align: 'text-left' },
    { key: 'triggerCondition', width: 'w-[120px]', align: 'text-left' },
    { key: 'tpsl', width: 'w-[100px]', align: 'text-left' },
    { key: 'status', width: 'w-[100px]', align: 'text-left' },
    { key: 'orderId', width: 'w-[120px]', align: 'text-left' },
]

// ============================================
// unified template components
// ============================================

type TableTemplateProps = {
    variant: 'header' | 'row'
    className?: string
    data: Record<string, ReactNode>
    columns: typeof BALANCE_COLUMNS
}

function TableTemplate({ variant, className, data, columns }: TableTemplateProps) {
    const role = variant === 'header' ? 'columnheader' : 'cell'
    const baseClass =
        variant === 'header'
            ? 'flex items-center gap-2 px-4 py-2 text-xs text-hlt-17'
            : 'flex items-center gap-2 border-b border-hlr-10 px-4 py-2 hover:bg-hlb-19'

    return (
        <div role="row" className={cn(baseClass, className)}>
            {columns.map((col) => (
                <div key={col.key} role={role} className={cn(col.width, col.align)}>
                    {data[col.key]}
                </div>
            ))}
        </div>
    )
}

// ============================================
// specific table templates
// ============================================

// balance table template
export function BalanceTableTemplate(props: {
    variant: 'header' | 'row'
    coin: ReactNode
    total: ReactNode
    available: ReactNode
    usdcValue: ReactNode
    pnl: ReactNode
    send: ReactNode
    transfer: ReactNode
    contract: ReactNode
    className?: string
}) {
    return (
        <TableTemplate
            variant={props.variant}
            className={props.className}
            data={{
                coin: props.coin,
                total: props.total,
                available: props.available,
                usdcValue: props.usdcValue,
                pnl: props.pnl,
                send: props.send,
                transfer: props.transfer,
                contract: props.contract,
            }}
            columns={BALANCE_COLUMNS}
        />
    )
}

// position table template
export function PositionTableTemplate(props: {
    variant: 'header' | 'row'
    coin: ReactNode
    size: ReactNode
    value: ReactNode
    entryPrice: ReactNode
    markPrice: ReactNode
    pnl: ReactNode
    liqPrice: ReactNode
    margin: ReactNode
    funding: ReactNode
    close: ReactNode
    tpsl: ReactNode
    className?: string
}) {
    return (
        <TableTemplate
            variant={props.variant}
            className={props.className}
            data={{
                coin: props.coin,
                size: props.size,
                value: props.value,
                entryPrice: props.entryPrice,
                markPrice: props.markPrice,
                pnl: props.pnl,
                liqPrice: props.liqPrice,
                margin: props.margin,
                funding: props.funding,
                close: props.close,
                tpsl: props.tpsl,
            }}
            columns={POSITION_COLUMNS}
        />
    )
}

// open order table template
export function OpenOrderTableTemplate(props: {
    variant: 'header' | 'row'
    time: ReactNode
    type: ReactNode
    coin: ReactNode
    side: ReactNode
    size: ReactNode
    originalSize: ReactNode
    value: ReactNode
    price: ReactNode
    reduceOnly: ReactNode
    triggerCondition: ReactNode
    tpsl: ReactNode
    className?: string
}) {
    return (
        <TableTemplate
            variant={props.variant}
            className={props.className}
            data={{
                time: props.time,
                type: props.type,
                coin: props.coin,
                side: props.side,
                size: props.size,
                originalSize: props.originalSize,
                value: props.value,
                price: props.price,
                reduceOnly: props.reduceOnly,
                triggerCondition: props.triggerCondition,
                tpsl: props.tpsl,
            }}
            columns={OPEN_ORDER_COLUMNS}
        />
    )
}

// twap order table template
export function TwapOrderTableTemplate(props: {
    variant: 'header' | 'row'
    coin: ReactNode
    size: ReactNode
    executedSize: ReactNode
    averagePrice: ReactNode
    runningTime: ReactNode
    reduceOnly: ReactNode
    creationTime: ReactNode
    action: ReactNode
    className?: string
}) {
    return (
        <TableTemplate
            variant={props.variant}
            className={props.className}
            data={{
                coin: props.coin,
                size: props.size,
                executedSize: props.executedSize,
                averagePrice: props.averagePrice,
                runningTime: props.runningTime,
                reduceOnly: props.reduceOnly,
                creationTime: props.creationTime,
                action: props.action,
            }}
            columns={TWAP_ORDER_COLUMNS}
        />
    )
}

// trade table template
export function TradeTableTemplate(props: {
    variant: 'header' | 'row'
    time: ReactNode
    coin: ReactNode
    direction: ReactNode
    price: ReactNode
    size: ReactNode
    value: ReactNode
    fee: ReactNode
    closedPnl: ReactNode
    className?: string
}) {
    return (
        <TableTemplate
            variant={props.variant}
            className={props.className}
            data={{
                time: props.time,
                coin: props.coin,
                direction: props.direction,
                price: props.price,
                size: props.size,
                value: props.value,
                fee: props.fee,
                closedPnl: props.closedPnl,
            }}
            columns={TRADE_COLUMNS}
        />
    )
}

// funding table template
export function FundingTableTemplate(props: {
    variant: 'header' | 'row'
    time: ReactNode
    coin: ReactNode
    size: ReactNode
    positionSide: ReactNode
    payment: ReactNode
    rate: ReactNode
    className?: string
}) {
    return (
        <TableTemplate
            variant={props.variant}
            className={props.className}
            data={{
                time: props.time,
                coin: props.coin,
                size: props.size,
                positionSide: props.positionSide,
                payment: props.payment,
                rate: props.rate,
            }}
            columns={FUNDING_COLUMNS}
        />
    )
}

// order history table template
export function OrderHistoryTableTemplate(props: {
    variant: 'header' | 'row'
    time: ReactNode
    type: ReactNode
    coin: ReactNode
    side: ReactNode
    filledSize: ReactNode
    filledRatio: ReactNode
    value: ReactNode
    price: ReactNode
    reduceOnly: ReactNode
    triggerCondition: ReactNode
    tpsl: ReactNode
    status: ReactNode
    orderId: ReactNode
    className?: string
}) {
    return (
        <TableTemplate
            variant={props.variant}
            className={props.className}
            data={{
                time: props.time,
                type: props.type,
                coin: props.coin,
                side: props.side,
                filledSize: props.filledSize,
                filledRatio: props.filledRatio,
                value: props.value,
                price: props.price,
                reduceOnly: props.reduceOnly,
                triggerCondition: props.triggerCondition,
                tpsl: props.tpsl,
                status: props.status,
                orderId: props.orderId,
            }}
            columns={ORDER_HISTORY_COLUMNS}
        />
    )
}

// ============================================
// row components (business logic)
// ============================================

// balance row
export function BalanceRow({ balance }: { balance: Balance }) {
    const copyContract = () => {
        if (!balance.contract) return
        navigator.clipboard.writeText(balance.contract)
        toast.success('Contract copied!')
    }

    return (
        <BalanceTableTemplate
            variant="row"
            coin={
                <div className="flex items-center gap-2">
                    <span>{balance.coin}</span>
                    {balance.chain && <span className="text-xs">({balance.chain})</span>}
                </div>
            }
            total={<span>{formatAmount(balance.total)}</span>}
            available={<span>{formatAmount(balance.available)}</span>}
            usdcValue={<span>{formatAmount(balance.usdcValue)}</span>}
            pnl={
                balance.pnl !== undefined ? (
                    <div className={cn('flex items-center gap-1', balance.pnl >= 0 ? 'text-hlt-13' : 'text-hlt-12')}>
                        <span>
                            {balance.pnl >= 0 ? '+' : ''}
                            {formatAmount(balance.pnl)}
                        </span>
                        {balance.roe !== undefined && <span className="text-xs">({balance.roe.toFixed(1)}%)</span>}
                        <IconWrapper id={IconIds.EXTERNAL_LINK} className="size-3" />
                    </div>
                ) : (
                    <span>--</span>
                )
            }
            send={
                <button onClick={() => showNotImplementedToast('Send feature not yet implemented')} className="text-xs text-hlt-8 hover:text-hlt-4">
                    Send
                </button>
            }
            transfer={
                <button
                    onClick={() => showNotImplementedToast('Transfer to Spot not yet implemented')}
                    className="text-xs text-hlt-8 hover:text-hlt-4">
                    Transfer to Spot
                </button>
            }
            contract={
                balance.contract ? (
                    <div className="flex items-center gap-1">
                        <span className="font-mono text-xs text-hlt-17">
                            {balance.contract.slice(0, 6)}...{balance.contract.slice(-4)}
                        </span>
                        <button onClick={copyContract} className="text-hlt-17 hover:text-hlt-2">
                            <IconWrapper id={IconIds.COPY} className="size-3" />
                        </button>
                    </div>
                ) : (
                    <span className="text-xs text-hlt-17">--</span>
                )
            }
        />
    )
}

// position row
export function PositionRow({ position, onClose }: { position: Position; onClose?: () => void }) {
    const pnlColor = position.pnl >= 0 ? 'text-hlt-13' : 'text-hlt-12'
    const leverageColor = position.side === 'short' ? 'bg-hlb-4' : 'bg-hlb-1'

    return (
        <PositionTableTemplate
            variant="row"
            coin={
                <div className="flex items-center gap-2">
                    <span>{position.coin}</span>
                    {position.leverage && <span className={cn('rounded px-1 py-0.5', leverageColor)}>{position.leverage}x</span>}
                </div>
            }
            size={
                <span>
                    {formatAmount(position.size)} {position.coin}
                </span>
            }
            value={<span>{formatAmount(position.value)}</span>}
            entryPrice={<span>{formatAmount(position.entryPrice)}</span>}
            markPrice={<span>{formatAmount(position.markPrice)}</span>}
            pnl={
                <div className={cn('flex items-center gap-1', pnlColor)}>
                    <span>
                        {position.pnl >= 0 ? '+' : ''}
                        {formatAmount(position.pnl)}
                    </span>
                    <span className="text-xs">({(typeof position.pnlPercentage === 'number' ? position.pnlPercentage : 0).toFixed(1)}%)</span>
                    <IconWrapper id={IconIds.EXTERNAL_LINK} className="size-3" />
                </div>
            }
            liqPrice={<span>{position.liqPrice ? formatAmount(position.liqPrice) : '--'}</span>}
            margin={
                <div>
                    {formatAmount(position.margin)}
                    <span className="ml-1 text-xs">(Cross)</span>
                </div>
            }
            funding={<span className={parseFloat(position.funding) >= 0 ? 'text-hlt-13' : 'text-hlt-12'}>{formatAmount(position.funding)}</span>}
            close={
                onClose ? (
                    <button className="rounded bg-hlb-1 px-3 py-1 text-xs text-hlt-21 hover:bg-hlb-0" onClick={onClose}>
                        Close All
                    </button>
                ) : (
                    <span>--</span>
                )
            }
            tpsl={
                <div className="flex items-center gap-1">
                    <span className="text-xs">-- / --</span>
                    <button
                        onClick={() => showNotImplementedToast('Take Profit / Stop Loss not yet implemented')}
                        className="text-hlt-17 hover:text-hlt-2">
                        <IconWrapper id={IconIds.EDIT} className="size-3" />
                    </button>
                </div>
            }
        />
    )
}

// open order row
export function OpenOrderRow({ order, onCancel }: { order: OpenOrder; onCancel?: () => void }) {
    const directionColor = order.side === 'buy' ? 'text-hlt-13' : 'text-hlt-12'
    const typeColor = order.type === 'limit' ? 'bg-hlb-14 text-hlt-6' : order.type === 'stop' ? 'bg-hlb-10 text-hlt-12' : 'bg-hlb-6 text-hlt-4'

    return (
        <OpenOrderTableTemplate
            variant="row"
            time={<span className="text-xs">{dayjs(order.time).format('M/D/YYYY - HH:mm:ss')}</span>}
            type={
                <span className={cn('rounded px-2 py-0.5 text-xs', typeColor)}>
                    {order.type === 'limit' ? 'Limit' : order.type === 'market' ? 'Market' : order.type === 'stop' ? 'Stop' : order.type}
                </span>
            }
            coin={<span>{order.coin}</span>}
            side={<span className={cn('font-medium', directionColor)}>{order.side === 'buy' ? 'Long' : 'Short'}</span>}
            size={<span>{formatAmount(order.size)}</span>}
            originalSize={<span className="">{formatAmount(order.originalSize)}</span>}
            value={<span>{formatAmount(order.value)}</span>}
            price={<span>{formatAmount(order.price)}</span>}
            reduceOnly={<span className="text-xs">{order.reduceOnly ? 'Yes' : 'No'}</span>}
            triggerCondition={<span className="text-xs">{order.triggerCondition || 'N/A'}</span>}
            tpsl={
                <div className="flex items-center gap-2">
                    <span className="text-xs">{order.tpsl || '--'}</span>
                    {onCancel && (
                        <button className="text-xs text-hlt-12 hover:text-hlt-4" onClick={onCancel}>
                            Cancel
                        </button>
                    )}
                </div>
            }
        />
    )
}

// twap order row
export function TwapOrderRow({ order, onTerminate }: { order: TwapOrder; onTerminate?: () => void }) {
    const progress = (parseFloat(order.executedSize) / parseFloat(order.size)) * 100
    const sideColor = order.side === 'buy' ? 'text-hlt-13' : 'text-hlt-12'

    return (
        <TwapOrderTableTemplate
            variant="row"
            coin={<span>{order.coin}</span>}
            size={
                <span className={cn('font-medium', sideColor)}>
                    {order.side === 'buy' ? '+' : '-'}
                    {formatAmount(order.size)}
                </span>
            }
            executedSize={
                <div className="flex items-center justify-end gap-1">
                    <span className="text-right">{formatAmount(order.executedSize)}</span>
                    <div className="h-1 w-12 rounded bg-hlb-12">
                        <div className="h-full rounded bg-hlb-1" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            }
            averagePrice={<span>{formatAmount(order.averagePrice)}</span>}
            runningTime={
                <span className="text-xs">
                    {Math.floor(order.runningTime / 60)}m / {Math.floor(order.totalTime / 60)}m
                </span>
            }
            reduceOnly={<span className="text-xs">{order.reduceOnly ? 'Yes' : 'No'}</span>}
            creationTime={<span className="text-xs">{dayjs(order.creationTime).format('M/D/YYYY - HH:mm:ss')}</span>}
            action={
                onTerminate && order.status === 'active' ? (
                    <button className="text-xs text-hlt-12 hover:text-hlt-4" onClick={onTerminate}>
                        Terminate
                    </button>
                ) : (
                    <span>--</span>
                )
            }
        />
    )
}

// trade history row
export function TradeRow({ trade }: { trade: Trade }) {
    const directionText = trade.direction ? `${trade.direction} ${trade.side === 'sell' ? 'Short' : 'Long'}` : trade.side.toUpperCase()
    const directionColor = trade.direction === 'Close' || trade.side === 'buy' ? 'text-hlt-13' : 'text-hlt-12'

    return (
        <TradeTableTemplate
            variant="row"
            time={
                <div className="flex items-center gap-1 text-xs">
                    {dayjs(trade.time).format('M/D/YYYY - HH:mm:ss')}
                    <IconWrapper id={IconIds.EXTERNAL_LINK} className="size-3" />
                </div>
            }
            coin={<span>{trade.coin}</span>}
            direction={<span className={cn('font-medium', directionColor)}>{directionText}</span>}
            price={<span>{formatAmount(trade.price)}</span>}
            size={<span>{formatAmount(trade.size)}</span>}
            value={<span>{formatAmount(trade.value)}</span>}
            fee={<span>{formatAmount(trade.fee)}</span>}
            closedPnl={
                trade.closedPnl !== undefined ? (
                    <span className={trade.closedPnl >= 0 ? 'text-hlt-13' : 'text-hlt-12'}>
                        {trade.closedPnl >= 0 ? '+' : ''}
                        {formatAmount(trade.closedPnl)}
                    </span>
                ) : (
                    <span>--</span>
                )
            }
        />
    )
}

// funding history row
export function FundingRow({ funding }: { funding: FundingPayment }) {
    const isReceiving = parseFloat(funding.payment) > 0

    return (
        <FundingTableTemplate
            variant="row"
            time={<span className="text-xs">{dayjs(funding.time).format('M/D/YYYY - HH:mm:ss')}</span>}
            coin={<span>{funding.coin}</span>}
            size={
                <span>
                    {formatAmount(funding.size)} {funding.coin}
                </span>
            }
            positionSide={
                <span className={cn('font-medium', funding.positionSide === 'short' ? 'text-hlt-12' : 'text-hlt-13')}>
                    {funding.positionSide === 'short' ? 'Short' : 'Long'}
                </span>
            }
            payment={
                <span className={isReceiving ? 'text-hlt-13' : 'text-hlt-12'}>
                    {isReceiving ? '+' : ''}
                    {formatAmount(funding.payment)}
                </span>
            }
            rate={<span className="text-xs">{funding.rate ? `${(funding.rate * 100).toFixed(4)}%` : '--'}</span>}
        />
    )
}

// order history row
export function OrderHistoryRow({ order }: { order: OrderHistory }) {
    const statusColors = {
        filled: 'text-hlt-17',
        partially_filled: 'text-hlt-9',
        cancelled: 'text-hlt-17',
        rejected: 'text-hlt-12',
    }

    const directionColor = order.side === 'sell' ? 'text-hlt-12' : 'text-hlt-13'

    return (
        <OrderHistoryTableTemplate
            variant="row"
            time={<span className="text-xs">{dayjs(order.time).format('M/D/YYYY - HH:mm:ss')}</span>}
            type={<span className="text-xs">{order.type === 'limit' ? 'Limit' : order.type === 'market' ? 'Market' : order.type}</span>}
            coin={<span>{order.coin}</span>}
            side={<span className={cn('font-medium', directionColor)}>{order.side === 'sell' ? 'Short' : 'Long'}</span>}
            filledSize={<span>{order.filledSize || '--'}</span>}
            filledRatio={<span>{order.filledSize && order.originalSize ? `${order.filledSize} / ${order.originalSize}` : '--'}</span>}
            value={<span>{formatAmount(order.value)}</span>}
            price={<span>{formatAmount(order.price)}</span>}
            reduceOnly={<span className="text-xs">{order.reduceOnly ? 'Yes' : 'No'}</span>}
            triggerCondition={<span className="text-xs">{order.triggerCondition || 'N/A'}</span>}
            tpsl={<span className="text-xs">{order.tpsl || '--'}</span>}
            status={
                <span className={cn('text-xs capitalize', statusColors[order.status])}>
                    {order.status === 'filled' ? 'Filled' : order.status === 'rejected' ? 'Rejected' : 'Open'}
                </span>
            }
            orderId={<span className="font-mono text-xs">{order.orderId || '--'}</span>}
        />
    )
}
