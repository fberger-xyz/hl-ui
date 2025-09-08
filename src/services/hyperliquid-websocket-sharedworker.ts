// note: see https://github.com/nktkas/hyperliquid

import { hyperliquidWS } from '@/services/hyperliquid-websocket-client'
import { HyperliquidWebSocketSubscriptionType } from '@/enums'
import type { SubscriptionCallback, SubscriptionOptions } from '@/types/hyperliquid.types'
import type { WorkerMessage } from '@/types/shared-worker'

class HyperliquidSharedWebSocketClient {
    private static instance: HyperliquidSharedWebSocketClient | null = null
    private fallbackClient: typeof hyperliquidWS | null = null
    private sharedWorker: SharedWorker | null = null
    private port: MessagePort | null = null
    private portId: number | null = null
    private isSharedWorkerConnected = false
    private subscriptions: Map<string, Set<SubscriptionCallback>> = new Map()
    private channelToOptions: Map<string, SubscriptionOptions> = new Map()
    private readonly isDev = process.env.NODE_ENV === 'development'
    private pingInterval: NodeJS.Timeout | null = null

    private constructor() {
        this.initConnection()
    }

    static getInstance(): HyperliquidSharedWebSocketClient {
        if (!this.instance) this.instance = new HyperliquidSharedWebSocketClient()
        return this.instance
    }

    private async initConnection() {
        // guard: browser support
        if (typeof window === 'undefined' || typeof SharedWorker === 'undefined') {
            if (this.isDev) console.log('[SharedWSClient] SharedWorker not supported, using fallback')
            this.initFallback()
            return
        }

        try {
            this.sharedWorker = new SharedWorker('/websocket-worker.js', { name: 'hyperliquid-ws' })
            this.port = this.sharedWorker.port

            // queue messages before init
            const messageQueue: MessageEvent<WorkerMessage>[] = []
            let isInitialized = false

            // avoid race conditions
            this.port.start()

            this.port.onmessage = (event: MessageEvent<WorkerMessage>) => {
                if (!isInitialized && event.data.type !== 'init') {
                    messageQueue.push(event)
                    return
                }
                const message = event.data

                switch (message.type) {
                    case 'init':
                        this.portId = message.portId || null
                        if (this.isDev) console.log(`[SharedWSClient] Initialized with port ID: ${this.portId}`)
                        this.startPingInterval()
                        isInitialized = true
                        messageQueue.forEach((queuedEvent) => {
                            this.port?.dispatchEvent(new MessageEvent('message', { data: queuedEvent.data }))
                        })
                        messageQueue.length = 0
                        break

                    case 'connected':
                        this.isSharedWorkerConnected = true
                        if (this.isDev) console.log('[SharedWSClient] Connected via SharedWorker')
                        break

                    case 'disconnected':
                        this.isSharedWorkerConnected = false
                        if (this.isDev) console.log('[SharedWSClient] Disconnected')
                        break

                    case 'message':
                        this.handleMessage(message)
                        break

                    case 'pong':
                        break // worker alive

                    case 'stats':
                        // stats are handled by event listeners in getStats()
                        break

                    case 'error':
                        console.error('[SharedWSClient] SharedWorker error:', message.data)
                        this.initFallback()
                        break
                }
            }

            if (typeof window !== 'undefined') {
                window.addEventListener('beforeunload', () => {
                    this.destroy()
                })
            }
        } catch (err) {
            if (this.isDev) console.log('[SharedWSClient] Failed to init SharedWorker:', err)
            this.initFallback()
        }
    }

    private initFallback() {
        if (this.fallbackClient) return
        this.fallbackClient = hyperliquidWS
        if (this.isDev) console.log('[SharedWSClient] Using direct WebSocket connection')
    }

    private handleMessage(message: WorkerMessage) {
        const channel = message.channel
        if (!channel) return

        this.channelToOptions.forEach((options, key) => {
            if (options.type === channel) {
                const callbacks = this.subscriptions.get(key)
                if (callbacks && callbacks.size > 0) {
                    callbacks.forEach((cb) => {
                        try {
                            cb(message.data)
                        } catch (error) {
                            console.error(`Error in subscription callback for ${key}:`, error)
                        }
                    })
                }
            }
        })
    }

    private startPingInterval() {
        this.stopPingInterval()
        this.pingInterval = setInterval(() => {
            if (this.port) this.port.postMessage({ type: 'ping' })
        }, 4000)
    }

    private stopPingInterval() {
        if (!this.pingInterval) return
        clearInterval(this.pingInterval)
        this.pingInterval = null
    }

    private formatSubscriptionKey(options: SubscriptionOptions): string {
        const { type, coin, interval, user } = options

        switch (type) {
            // market data
            case HyperliquidWebSocketSubscriptionType.ALL_MIDS:
                return 'allMids'
            case HyperliquidWebSocketSubscriptionType.L2_BOOK:
                return coin ? `l2Book:${coin}` : `l2Book:default`
            case HyperliquidWebSocketSubscriptionType.TRADES:
                return coin ? `trades:${coin}` : `trades:default`
            case HyperliquidWebSocketSubscriptionType.CANDLE:
                return coin && interval ? `candle:${coin}:${interval}` : `candle:default`
            case HyperliquidWebSocketSubscriptionType.BBO:
                return coin ? `bbo:${coin}` : `bbo:default`

            // asset context
            case HyperliquidWebSocketSubscriptionType.ACTIVE_ASSET_CTX:
                return coin ? `activeAssetCtx:${coin}` : `activeAssetCtx:default`
            case HyperliquidWebSocketSubscriptionType.ACTIVE_ASSET_DATA:
                return user && coin ? `activeAssetData:${user}:${coin}` : `activeAssetData:default`

            // user data
            case HyperliquidWebSocketSubscriptionType.NOTIFICATION:
                return user ? `notification:${user}` : `notification:default`
            case HyperliquidWebSocketSubscriptionType.WEB_DATA2:
                return user ? `webData2:${user}` : `webData2:default`
            case HyperliquidWebSocketSubscriptionType.ORDER_UPDATES:
                return user ? `orderUpdates:${user}` : `orderUpdates:default`
            case HyperliquidWebSocketSubscriptionType.USER_EVENTS:
                return user ? `userEvents:${user}` : `userEvents:default`
            case HyperliquidWebSocketSubscriptionType.USER_FILLS:
                return user ? `userFills:${user}` : `userFills:default`
            case HyperliquidWebSocketSubscriptionType.USER_FUNDINGS:
                return user ? `userFundings:${user}` : `userFundings:default`
            case HyperliquidWebSocketSubscriptionType.USER_NON_FUNDING_LEDGER_UPDATES:
                return user ? `userNonFundingLedgerUpdates:${user}` : `userNonFundingLedgerUpdates:default`
            case HyperliquidWebSocketSubscriptionType.USER_TWAP_SLICE_FILLS:
                return user ? `userTwapSliceFills:${user}` : `userTwapSliceFills:default`
            case HyperliquidWebSocketSubscriptionType.USER_TWAP_HISTORY:
                return user ? `userTwapHistory:${user}` : `userTwapHistory:default`
            // undocumented but used by hyperliquid client
            // case HyperliquidWebSocketSubscriptionType.USER_HISTORICAL_ORDERS:
            //     return user ? `userHistoricalOrders:${user}` : `userHistoricalOrders:default`

            default:
                return `${type}:${coin || user || 'default'}`
        }
    }

    connect(): Promise<void> {
        if (this.fallbackClient) return this.fallbackClient.connect()
        return Promise.resolve() // auto-connects
    }

    getConnectionState(): 'connecting' | 'connected' | 'disconnected' | 'error' {
        if (this.fallbackClient) return this.fallbackClient.getConnectionState()
        return this.isSharedWorkerConnected ? 'connected' : 'disconnected'
    }

    // alias for compatibility with direct client
    getConnectionStatus(): 'connecting' | 'connected' | 'disconnected' | 'error' {
        return this.getConnectionState()
    }

    getStats(
        callback: (stats: {
            mode?: string
            message?: string
            tabsConnected?: number
            messagesReceived?: number
            activeSubscriptions?: number
            connectedAt?: number
        }) => void,
    ): void {
        if (this.fallbackClient) {
            callback({
                mode: 'direct',
                message: 'Using direct WebSocket (SharedWorker not available)',
            })
            return
        }

        if (!this.port) {
            callback({
                mode: 'error',
                message: 'No port available',
            })
            return
        }

        // one-time handler for stats
        const originalOnMessage = this.port.onmessage
        const port = this.port
        this.port.onmessage = (event: MessageEvent) => {
            if (event.data.type === 'stats') {
                callback({
                    ...event.data.data,
                    mode: 'sharedworker',
                })
                port.onmessage = originalOnMessage
            } else if (originalOnMessage) {
                originalOnMessage.call(port, event)
            }
        }

        this.port.postMessage({ type: 'getStats' })
    }

    subscribe(options: SubscriptionOptions, callback: SubscriptionCallback): () => void {
        if (this.fallbackClient) {
            return this.fallbackClient.subscribe(options, callback)
        }

        const key = this.formatSubscriptionKey(options)

        if (!this.subscriptions.has(key)) {
            this.subscriptions.set(key, new Set())
            this.channelToOptions.set(key, options)
        }
        this.subscriptions.get(key)!.add(callback)

        if (this.port) {
            const subscription: Record<string, unknown> = { type: options.type }

            if (options.coin) subscription.coin = options.coin
            if (options.interval) subscription.interval = options.interval
            if (options.user) subscription.user = options.user
            if (options.nSigFigs) subscription.nSigFigs = options.nSigFigs
            if (options.mantissa) subscription.mantissa = options.mantissa

            this.port.postMessage({
                type: 'subscribe',
                subscription: subscription,
            })
        }

        return () => {
            const callbacks = this.subscriptions.get(key)
            if (!callbacks) return
            callbacks.delete(callback)
            if (callbacks.size > 0) return

            this.subscriptions.delete(key)
            this.channelToOptions.delete(key)
            if (this.port) {
                this.port.postMessage({
                    type: 'unsubscribe',
                    channel: options.type,
                })
            }
        }
    }

    async fetchInfo(requestType: string, params: Record<string, unknown> = {}): Promise<unknown> {
        if (this.fallbackClient) return this.fallbackClient.fetchInfo(requestType, params)

        return hyperliquidWS.fetchInfo(requestType, params)
    }

    reconnect() {
        if (this.fallbackClient) return this.fallbackClient.reconnect()
    }

    onError(callback: (error: Error) => void): () => void {
        if (this.fallbackClient) return this.fallbackClient.onError(callback)
        // sharedworker handles errors internally, return noop cleanup
        return () => {}
    }

    destroy() {
        this.stopPingInterval()
        if (this.port) {
            this.port.close()
            this.port = null
        }
        if (this.sharedWorker) this.sharedWorker = null
        if (this.fallbackClient) this.fallbackClient.destroy()
        this.subscriptions.clear()
        this.channelToOptions.clear()
    }
}

// export singleton instance
export const hyperliquidSharedWS = HyperliquidSharedWebSocketClient.getInstance()
