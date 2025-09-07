// note: have a look to https://github.com/nktkas/hyperliquid

// hyperliquid websocket client - handles serverless deployments
// rate limits: 1200 weight/min rest, 2000 msg/min ws, 1000 subs max

import { HyperliquidWebSocketSubscriptionType } from '@/enums'
import type { SubscriptionCallback, WebSocketMessage, SubscriptionOptions } from '@/types/hyperliquid.types'

class HyperliquidWebSocketClient {
    // singleton prevents multiple connections
    private static instance: HyperliquidWebSocketClient | null = null

    // endpoints from env or fallback to production
    private readonly WS_URL = process.env.NEXT_PUBLIC_HL_WS_URL || 'wss://api-ui.hyperliquid.xyz/ws'
    // use proxy for rest calls to avoid cors
    private readonly REST_URL =
        typeof window !== 'undefined' && window.location.hostname !== 'localhost'
            ? '/api/hyperliquid'
            : process.env.NEXT_PUBLIC_HL_REST_URL || 'https://api.hyperliquid.xyz/info'

    private ws: WebSocket | null = null
    private subscriptions: Map<string, Set<SubscriptionCallback>> = new Map()
    private messageQueue: unknown[] = [] // queue messages when offline
    private reconnectTimeout: NodeJS.Timeout | null = null
    private reconnectAttempts = 0
    private heartbeatInterval: NodeJS.Timeout | null = null

    // exponential backoff saves battery - more aggressive in dev
    private readonly MAX_RECONNECT_ATTEMPTS = process.env.NODE_ENV === 'development' ? 5 : 10
    private readonly INITIAL_RECONNECT_DELAY = process.env.NODE_ENV === 'development' ? 500 : 1000
    private readonly MAX_RECONNECT_DELAY = process.env.NODE_ENV === 'development' ? 10000 : 30000
    private readonly HEARTBEAT_INTERVAL = 30000

    // rate limits with safety margin
    private readonly WS_MESSAGE_LIMIT = 1900
    private readonly WS_MESSAGE_WINDOW = 60000
    private readonly REST_WEIGHT_LIMIT = 1100
    private readonly REST_WEIGHT_WINDOW = 60000
    private readonly MAX_SUBSCRIPTIONS = 900

    // rate tracking
    private messagesSent = 0
    private messageResetTime = 0
    private restWeightUsed = 0
    private restWeightResetTime = 0
    private restRetryCount = 0

    private isConnecting = false
    private isDestroyed = false
    private readonly isDev = process.env.NODE_ENV === 'development'

    private constructor() {
        // guard: browser only
        if (typeof window === 'undefined') {
            console.warn('WebSocket client initialized in non-browser environment')
            return
        }

        // log configuration in dev
        if (this.isDev) {
            console.log('WebSocket client initialized with:', {
                WS_URL: this.WS_URL,
                REST_URL: this.REST_URL,
                environment: process.env.NODE_ENV,
            })
        }
    }

    static getInstance(): HyperliquidWebSocketClient {
        if (!HyperliquidWebSocketClient.instance) HyperliquidWebSocketClient.instance = new HyperliquidWebSocketClient()
        return HyperliquidWebSocketClient.instance
    }

    getConnectionState(): 'connecting' | 'connected' | 'disconnected' | 'error' {
        if (this.isConnecting) return 'connecting'
        if (this.ws?.readyState === WebSocket.OPEN) return 'connected'
        if (this.isDestroyed) return 'error'
        return 'disconnected'
    }

    onError(callback: (error: Error) => void): () => void {
        const errorHandler = (event: Event) => {
            if (event instanceof ErrorEvent) {
                callback(new Error(event.message))
            }
        }

        if (this.ws) {
            this.ws.addEventListener('error', errorHandler)
        }

        return () => {
            if (this.ws) {
                this.ws.removeEventListener('error', errorHandler)
            }
        }
    }

    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            // guard: no double connect
            if (this.isConnecting) {
                if (this.isDev) console.log('Connection already in progress')
                return resolve()
            }

            if (this.ws?.readyState === WebSocket.OPEN) {
                if (this.isDev) console.log('Already connected')
                return resolve()
            }

            // guard: not destroyed
            if (this.isDestroyed) return reject(new Error('WebSocket client has been destroyed'))

            this.isConnecting = true

            try {
                if (this.isDev) console.log(`Connecting to WebSocket: ${this.WS_URL}`)
                this.ws = new WebSocket(this.WS_URL)

                // for potential compression
                this.ws.binaryType = 'arraybuffer'

                this.ws.onopen = () => {
                    console.log('WebSocket connected')
                    this.isConnecting = false
                    this.reconnectAttempts = 0

                    this.startHeartbeat()

                    // flush queued messages after reconnect
                    this.processMessageQueue()

                    // restore subscriptions after reconnect
                    this.resubscribeAll()

                    resolve()
                }

                this.ws.onmessage = (event) => {
                    this.handleMessage(event)
                }

                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error)
                    this.isConnecting = false
                    reject(error)
                }

                this.ws.onclose = (event) => {
                    console.log('WebSocket closed:', event.code, event.reason)
                    this.isConnecting = false

                    this.stopHeartbeat()

                    // auto-reconnect unless explicitly destroyed
                    if (!this.isDestroyed) this.handleReconnection()
                }
            } catch (error) {
                console.error('Failed to create WebSocket:', error)
                this.isConnecting = false
                reject(error)
            }
        })
    }

    private handleMessage(event: MessageEvent) {
        try {
            let data: WebSocketMessage

            // handle text and binary
            if (event.data instanceof ArrayBuffer) {
                // compressed binary
                const decoder = new TextDecoder()
                data = JSON.parse(decoder.decode(event.data))
            } else {
                data = JSON.parse(event.data)
            }

            if (data.channel === 'pong') return // heartbeat

            if (data.channel === 'error') {
                const errorMsg = data.error?.toString() || ''
                if (errorMsg.includes('rate') || errorMsg.includes('limit') || errorMsg.includes('too many')) {
                    console.warn('Rate limit detected:', data.error)
                    this.handleRateLimitError()
                }
                return console.error('WebSocket error message:', data.error)
            }

            if (data.channel && data.data) {
                const key = this.getSubscriptionKey(data.channel, data.data)
                const callbacks = this.subscriptions.get(key)

                // log candle messages only in dev
                if (this.isDev && data.channel === 'candle') {
                    console.log('Candle message received:', {
                        channel: data.channel,
                        key,
                        hasCallbacks: callbacks && callbacks.size > 0,
                        subscribedKeys: Array.from(this.subscriptions.keys()).filter((k) => k.startsWith('candle')),
                        data: data.data,
                    })
                }

                if (callbacks && callbacks.size > 0) {
                    callbacks.forEach((callback) => {
                        try {
                            callback(data.data)
                        } catch (error) {
                            console.error('Error in subscription callback:', error)
                        }
                    })
                }
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error)
        }
    }

    private handleReconnection() {
        if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) return console.error('Max reconnection attempts reached')

        // exponential backoff prevents server overload
        const delay = Math.min(this.INITIAL_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts), this.MAX_RECONNECT_DELAY)

        console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`)

        this.reconnectTimeout = setTimeout(() => {
            this.reconnectAttempts++
            this.connect().catch(console.error)
        }, delay)
    }

    private startHeartbeat() {
        this.stopHeartbeat()

        this.heartbeatInterval = setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                const now = Date.now()
                if (now > this.messageResetTime) {
                    this.messagesSent = 0
                    this.messageResetTime = now + this.WS_MESSAGE_WINDOW
                }

                // rate limited heartbeat
                if (this.messagesSent < this.WS_MESSAGE_LIMIT) {
                    this.ws.send(JSON.stringify({ method: 'ping' }))
                    this.messagesSent++
                }
            }
        }, this.HEARTBEAT_INTERVAL)
    }

    private stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval)
            this.heartbeatInterval = null
        }
    }

    private processMessageQueue() {
        // send queued messages after reconnect
        if (this.ws?.readyState === WebSocket.OPEN) {
            const now = Date.now()

            // reset if window expired
            if (now > this.messageResetTime) {
                this.messagesSent = 0
                this.messageResetTime = now + this.WS_MESSAGE_WINDOW
            }

            while (this.messageQueue.length > 0 && this.messagesSent < this.WS_MESSAGE_LIMIT) {
                const message = this.messageQueue.shift()
                this.ws.send(JSON.stringify(message))
                this.messagesSent++
            }

            // retry if messages remain
            if (this.messageQueue.length > 0) {
                const remainingTime = this.messageResetTime - now
                const retryDelay = Math.min(1000, remainingTime)
                setTimeout(() => this.processMessageQueue(), retryDelay)
            }
        }
    }

    private handleRateLimitError() {
        // exponential backoff
        const backoffDelay = Math.min(1000 * Math.pow(2, this.restRetryCount), 30000)
        console.log(`Rate limited, backing off for ${backoffDelay}ms`)

        this.restRetryCount++

        setTimeout(() => {
            this.restRetryCount = Math.max(0, this.restRetryCount - 1)
            this.processMessageQueue()
        }, backoffDelay)
    }

    private resubscribeAll() {
        this.subscriptions.forEach((callbacks, key) => {
            if (callbacks.size > 0) {
                const [channel, params] = this.parseSubscriptionKey(key)

                if (this.ws?.readyState === WebSocket.OPEN) {
                    const subscription = {
                        method: 'subscribe',
                        subscription: {
                            type: channel,
                            ...params,
                        },
                    }
                    const now = Date.now()
                    if (now > this.messageResetTime) {
                        this.messagesSent = 0
                        this.messageResetTime = now + this.WS_MESSAGE_WINDOW
                    }

                    if (this.messagesSent < this.WS_MESSAGE_LIMIT) {
                        this.ws.send(JSON.stringify(subscription))
                        this.messagesSent++
                    } else {
                        this.messageQueue.push(subscription)
                    }
                }
            }
        })
    }

    private getSubscriptionKey(channel: string, data: unknown): string {
        const typedData = data as Record<string, unknown>

        if (channel === HyperliquidWebSocketSubscriptionType.L2_BOOK && typedData?.coin) return `l2Book:${typedData.coin}`
        if (channel === HyperliquidWebSocketSubscriptionType.TRADES) {
            // handle both single and array trades
            if (Array.isArray(data)) {
                const firstTrade = data[0] as Record<string, unknown>
                if (firstTrade?.coin) return `trades:${firstTrade.coin}`
            } else if (typedData?.coin) {
                return `trades:${typedData.coin}`
            }
        }
        if (channel === 'userEvents' && typedData?.user) return `userEvents:${typedData.user}`
        if (channel === 'candle') {
            // candle data has symbol 's' and interval 'i' in the actual message
            if (typedData?.s && typedData?.i) {
                return `candle:${typedData.s}:${typedData.i}`
            }
            // subscription options use 'coin' and 'interval'
            if (typedData?.coin && typedData?.interval) {
                return `candle:${typedData.coin}:${typedData.interval}`
            }
        }
        if (channel === HyperliquidWebSocketSubscriptionType.ALL_MIDS) return 'allMids'
        return `${channel}:${JSON.stringify(data)}`
    }

    private parseSubscriptionKey(key: string): [string, Record<string, unknown>] {
        const parts = key.split(':')
        const channel = parts[0]

        if (channel === HyperliquidWebSocketSubscriptionType.L2_BOOK || channel === HyperliquidWebSocketSubscriptionType.TRADES)
            return [channel, { coin: parts[1] }]
        if (channel === 'userEvents') return [channel, { user: parts[1] }]
        if (channel === 'candle') return [channel, { coin: parts[1], interval: parts[2] }]
        if (channel === HyperliquidWebSocketSubscriptionType.ALL_MIDS) return [channel, {}]

        try {
            return [channel, JSON.parse(parts.slice(1).join(':'))]
        } catch {
            return [channel, {}]
        }
    }

    subscribe(options: SubscriptionOptions, callback: SubscriptionCallback): () => void {
        // guard: sub limit
        if (this.subscriptions.size >= this.MAX_SUBSCRIPTIONS) {
            console.warn(`Maximum subscriptions (${this.MAX_SUBSCRIPTIONS}) reached, cannot add new subscription`)
            return () => {} // no-op
        }

        const key = this.getSubscriptionKey(options.type, options)

        // log candle subscriptions for debugging
        if (options.type === HyperliquidWebSocketSubscriptionType.CANDLE) {
            console.log('Creating candle subscription:', {
                options,
                key,
                existingKeys: Array.from(this.subscriptions.keys()).filter((k) => k.startsWith('candle')),
            })
        }

        if (!this.subscriptions.has(key)) {
            this.subscriptions.set(key, new Set())
        }
        this.subscriptions.get(key)!.add(callback)

        const message = {
            method: 'subscribe',
            subscription: options,
        }

        if (this.ws?.readyState === WebSocket.OPEN) {
            const now = Date.now()
            if (now > this.messageResetTime) {
                this.messagesSent = 0
                this.messageResetTime = now + this.WS_MESSAGE_WINDOW
            }

            if (this.messagesSent < this.WS_MESSAGE_LIMIT) {
                this.ws.send(JSON.stringify(message))
                this.messagesSent++
            } else {
                // queue if rate limited
                this.messageQueue.push(message)
                const retryDelay = Math.min(1000, this.messageResetTime - now)
                setTimeout(() => this.processMessageQueue(), retryDelay)
            }
        } else {
            // queue if not connected
            this.messageQueue.push(message)
            if (!this.isConnecting && !this.ws) {
                this.connect().catch(console.error)
            }
        }

        return () => {
            const callbacks = this.subscriptions.get(key)
            if (callbacks) {
                callbacks.delete(callback)

                // unsubscribe if no callbacks
                if (callbacks.size === 0) {
                    this.subscriptions.delete(key)

                    const unsubMessage = {
                        method: 'unsubscribe',
                        subscription: options,
                    }

                    if (this.ws?.readyState === WebSocket.OPEN) {
                        const now = Date.now()
                        if (now > this.messageResetTime) {
                            this.messagesSent = 0
                            this.messageResetTime = now + this.WS_MESSAGE_WINDOW
                        }

                        if (this.messagesSent < this.WS_MESSAGE_LIMIT) {
                            this.ws.send(JSON.stringify(unsubMessage))
                            this.messagesSent++
                        }
                    }
                }
            }
        }
    }

    async fetchInfo(requestType: string, params: Record<string, unknown> = {}): Promise<unknown> {
        const weight = this.calculateRequestWeight(requestType)

        // check rate limit
        const now = Date.now()
        if (now > this.restWeightResetTime) {
            this.restWeightUsed = 0
            this.restWeightResetTime = now + this.REST_WEIGHT_WINDOW
        }

        if (this.restWeightUsed + weight > this.REST_WEIGHT_LIMIT) {
            const waitTime = this.restWeightResetTime - now
            console.warn(`REST rate limit would be exceeded, waiting ${waitTime}ms`)
            await new Promise((resolve) => setTimeout(resolve, waitTime))
            return this.fetchInfo(requestType, params) // retry after wait
        }

        try {
            const response = await fetch(this.REST_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: requestType,
                    ...params,
                }),
            })

            // handle 429
            if (response.status === 429) {
                const retryAfter = response.headers.get('Retry-After')
                const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.min(1000 * Math.pow(2, this.restRetryCount), 30000)

                console.warn(`Rate limited (429), retrying after ${waitTime}ms`)
                this.restRetryCount++

                await new Promise((resolve) => setTimeout(resolve, waitTime))
                return this.fetchInfo(requestType, params) // retry
            }

            if (!response.ok) throw new Error(`API request failed: ${response.status}`)

            this.restWeightUsed += weight
            this.restRetryCount = 0

            return response.json()
        } catch (error) {
            console.error('API request error:', error)
            throw error
        }
    }

    private calculateRequestWeight(requestType: string): number {
        const lowWeightTypes = [
            HyperliquidWebSocketSubscriptionType.L2_BOOK,
            HyperliquidWebSocketSubscriptionType.ALL_MIDS,
            'clearinghouseState',
            'orderStatus',
            'spotClearinghouseState',
            'exchangeStatus',
        ]
        const highWeightTypes = ['userRole']

        if (lowWeightTypes.includes(requestType)) return 2
        if (highWeightTypes.includes(requestType)) return 60
        return 20 // default weight
    }

    getConnectionStatus(): 'connecting' | 'connected' | 'disconnected' | 'error' {
        if (this.isDestroyed) return 'error'
        if (this.isConnecting) return 'connecting'
        if (this.ws?.readyState === WebSocket.OPEN) return 'connected'
        return 'disconnected'
    }

    // for monitoring
    getRateLimitStatus() {
        const now = Date.now()
        return {
            websocket: {
                messagesSent: this.messagesSent,
                limit: this.WS_MESSAGE_LIMIT,
                resetIn: Math.max(0, this.messageResetTime - now),
                subscriptions: this.subscriptions.size,
                maxSubscriptions: this.MAX_SUBSCRIPTIONS,
            },
            rest: {
                weightUsed: this.restWeightUsed,
                limit: this.REST_WEIGHT_LIMIT,
                resetIn: Math.max(0, this.restWeightResetTime - now),
                retryCount: this.restRetryCount,
            },
            queued: {
                messages: this.messageQueue.length,
            },
        }
    }

    reconnect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout)
            this.reconnectTimeout = null
        }
        this.reconnectAttempts = 0
        this.connect().catch(console.error)
    }

    destroy() {
        this.isDestroyed = true

        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval)
            this.heartbeatInterval = null
        }

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout)
            this.reconnectTimeout = null
        }

        if (this.ws) {
            this.ws.close()
            this.ws = null
        }

        // clear data
        this.subscriptions.clear()
        this.messageQueue = []
    }
}

// export singleton instance
export const hyperliquidWS = HyperliquidWebSocketClient.getInstance()

// removed auto-connect - handled by providers.tsx
