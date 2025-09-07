// note: have a look to https://github.com/nktkas/hyperliquid

// sharedworker-enabled hyperliquid websocket client
// uses sharedworker when available, falls back to direct connection

import { hyperliquidWS } from '@/services/hyperliquid-websocket-client'
import type { SubscriptionCallback, SubscriptionOptions } from '@/types/hyperliquid.types'
import type { WorkerMessage } from '@/types/shared-worker'

class HyperliquidSharedWebSocketClient {
    private static instance: HyperliquidSharedWebSocketClient | null = null
    private fallbackClient: typeof hyperliquidWS | null = null
    private sharedWorker: SharedWorker | null = null
    private port: MessagePort | null = null
    private isSharedWorkerConnected = false
    private subscriptions: Map<string, Set<SubscriptionCallback>> = new Map()
    private readonly isDev = process.env.NODE_ENV === 'development'

    private constructor() {
        this.initConnection()
    }

    static getInstance(): HyperliquidSharedWebSocketClient {
        if (!HyperliquidSharedWebSocketClient.instance) HyperliquidSharedWebSocketClient.instance = new HyperliquidSharedWebSocketClient()
        return HyperliquidSharedWebSocketClient.instance
    }

    private async initConnection() {
        // check browser support
        if (typeof window === 'undefined' || typeof SharedWorker === 'undefined') {
            if (this.isDev) console.log('[SharedWSClient] SharedWorker not supported, using fallback')
            this.initFallback()
            return
        }

        try {
            // try sharedworker first
            this.sharedWorker = new SharedWorker('/websocket-worker.js', { name: 'hyperliquid-ws' })
            this.port = this.sharedWorker.port

            this.port.onmessage = (event: MessageEvent<WorkerMessage>) => {
                const message = event.data

                switch (message.type) {
                    case 'connected':
                        this.isSharedWorkerConnected = true
                        if (this.isDev) console.log('[SharedWSClient] Connected via SharedWorker')
                        break

                    case 'disconnected':
                        this.isSharedWorkerConnected = false
                        if (this.isDev) console.log('[SharedWSClient] Disconnected')
                        break

                    case 'message':
                        this.handleMessage(message.data)
                        break

                    case 'stats':
                        // stats are handled by event listeners in getStats()
                        break

                    case 'error':
                        console.error('[SharedWSClient] SharedWorker error:', message.data)
                        // fallback on error
                        this.initFallback()
                        break
                }
            }

            this.port.start()
            // initial ping
            this.port.postMessage({ type: 'ping' })
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

    private handleMessage(data: unknown) {
        const channelData = data as { channel?: string; data?: unknown }
        const channel = channelData?.channel

        if (!channel) return
        const callbacks = this.subscriptions.get(channel)
        if (!callbacks || callbacks.size === 0) return
        callbacks.forEach((cb) => {
            try {
                // pass the nested data, not the wrapper
                cb(channelData.data || data)
            } catch (error) {
                console.error(`Error in subscription callback for ${channel}:`, error)
            }
        })
    }

    private formatSubscriptionKey(options: SubscriptionOptions): string {
        const { type, coin, interval, user } = options

        if (type === 'candle' && coin && interval) return `candle:${coin}:${interval}`
        if (type === 'l2Book' && coin) return `l2Book:${coin}`
        if (type === 'trades' && coin) return `trades:${coin}`
        if (type === 'userEvents' && user) return `userEvents:${user}`
        if (type === 'userFills' && user) return `userFills:${user}`
        if (type === 'userOrders' && user) return `userOrders:${user}`
        if (type === 'allMids') return 'allMids'

        return `${type}:${coin || user || 'default'}`
    }

    connect(): Promise<void> {
        if (this.fallbackClient) return this.fallbackClient.connect()
        // sharedworker auto-connects
        return Promise.resolve()
    }

    getConnectionState(): 'connecting' | 'connected' | 'disconnected' | 'error' {
        if (this.fallbackClient) return this.fallbackClient.getConnectionState()
        return this.isSharedWorkerConnected ? 'connected' : 'disconnected'
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
            // no shared stats in fallback mode
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

        // create a one-time handler for stats response
        const originalOnMessage = this.port.onmessage
        const port = this.port
        this.port.onmessage = (event: MessageEvent) => {
            if (event.data.type === 'stats') {
                callback(event.data.data)
                // restore original handler
                port.onmessage = originalOnMessage
            } else if (originalOnMessage) {
                originalOnMessage.call(port, event)
            }
        }

        this.port.postMessage({ type: 'getStats' })
    }

    subscribe(options: SubscriptionOptions, callback: SubscriptionCallback): () => void {
        // use fallback if available
        if (this.fallbackClient) {
            return this.fallbackClient.subscribe(options, callback)
        }

        const key = this.formatSubscriptionKey(options)

        // track subscription
        if (!this.subscriptions.has(key)) {
            this.subscriptions.set(key, new Set())
        }
        this.subscriptions.get(key)!.add(callback)

        // subscribe via sharedworker
        if (this.port) {
            // send subscribe message with channel name
            const channel = options.type
            this.port.postMessage({
                type: 'subscribe',
                channel: channel,
            })
        }

        // return unsubscribe function
        return () => {
            const callbacks = this.subscriptions.get(key)
            if (callbacks) {
                callbacks.delete(callback)

                if (callbacks.size === 0) {
                    this.subscriptions.delete(key)

                    if (this.port) {
                        const channel = options.type
                        this.port.postMessage({
                            type: 'unsubscribe',
                            channel: channel,
                        })
                    }
                }
            }
        }
    }

    async fetchInfo(requestType: string, params: Record<string, unknown> = {}): Promise<unknown> {
        if (this.fallbackClient) return this.fallbackClient.fetchInfo(requestType, params)

        // rest api calls still go through regular client
        return hyperliquidWS.fetchInfo(requestType, params)
    }

    reconnect() {
        if (this.fallbackClient) return this.fallbackClient.reconnect()
        // sharedworker handles reconnection automatically
    }

    destroy() {
        if (this.port) {
            this.port.close()
            this.port = null
        }
        if (this.fallbackClient) this.fallbackClient.destroy()
        this.subscriptions.clear()
    }
}

// export singleton instance
export const hyperliquidSharedWS = HyperliquidSharedWebSocketClient.getInstance()
