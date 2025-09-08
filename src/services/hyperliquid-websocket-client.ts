// note: have a look to https://github.com/nktkas/hyperliquid

// hyperliquid websocket client - handles serverless deployments
// rate limits: 1200 weight/min rest, 2000 msg/min ws, 1000 subs max

import { HyperliquidWebSocketSubscriptionType } from '@/enums'
import type { SubscriptionCallback, WebSocketMessage, SubscriptionOptions } from '@/types/hyperliquid.types'
import { logger } from '@/utils/logger.util'

class HyperliquidWebSocketClient {
    // singleton prevents multiple connections
    private static instance: HyperliquidWebSocketClient | null = null

    // endpoints from env or fallback to production
    private readonly WS_URL = process.env.NEXT_PUBLIC_HL_WS_URL || 'wss://api-ui.hyperliquid.xyz/ws'
    // use proxy for rest calls to avoid cors
    private readonly REST_URL = process.env.NEXT_PUBLIC_HL_REST_URL || 'https://api.hyperliquid.xyz/info'

    private ws: WebSocket | null = null
    private subscriptions: Map<string, Set<SubscriptionCallback>> = new Map()
    private messageQueue: unknown[] = [] // queue messages when offline
    private reconnectTimeout: NodeJS.Timeout | null = null
    private reconnectAttempts = 0
    private heartbeatInterval: NodeJS.Timeout | null = null

    // exponential backoff prevents server overload
    private readonly MAX_RECONNECT_ATTEMPTS = process.env.NODE_ENV === 'development' ? 5 : 10
    private readonly INITIAL_RECONNECT_DELAY = process.env.NODE_ENV === 'development' ? 500 : 1000
    private readonly MAX_RECONNECT_DELAY = process.env.NODE_ENV === 'development' ? 10000 : 30000
    private readonly HEARTBEAT_INTERVAL = 30000

    // rate limits: 10% safety margin prevents 429s
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

    // ttl cache reduces rest calls for static data
    private metadataCache: Map<string, { data: unknown; timestamp: number }> = new Map()
    private readonly CACHE_TTL = 60000 // 1 minute

    private constructor() {
        // guard: browser only
        if (typeof window === 'undefined') {
            logger.warn('WebSocket client initialized in non-browser environment')
            return
        }

        // log configuration in dev
        if (this.isDev) {
            logger.debug('WebSocket client initialized with:', {
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
                if (this.isDev) logger.debug('Connection already in progress')
                return resolve()
            }

            if (this.ws?.readyState === WebSocket.OPEN) {
                if (this.isDev) logger.debug('Already connected')
                return resolve()
            }

            // guard: not destroyed
            if (this.isDestroyed) return reject(new Error('WebSocket client has been destroyed'))

            this.isConnecting = true

            try {
                if (this.isDev) logger.debug(`Connecting to WebSocket: ${this.WS_URL}`)
                this.ws = new WebSocket(this.WS_URL)

                // for potential compression
                this.ws.binaryType = 'arraybuffer'

                this.ws.onopen = () => {
                    logger.info('WebSocket connected')
                    this.isConnecting = false
                    this.reconnectAttempts = 0

                    this.startHeartbeat()

                    // clear queue first to avoid duplicates
                    this.messageQueue = []

                    // resubscribe all active subscriptions
                    this.resubscribeAll()

                    resolve()
                }

                this.ws.onmessage = (event) => {
                    this.handleMessage(event)
                }

                this.ws.onerror = (error) => {
                    logger.error('WebSocket error:', error)
                    this.isConnecting = false
                    reject(error)
                }

                this.ws.onclose = (event) => {
                    logger.info('WebSocket closed:', event.code, event.reason)
                    this.isConnecting = false

                    this.stopHeartbeat()

                    // auto-reconnect unless explicitly destroyed
                    if (!this.isDestroyed) this.handleReconnection()
                }
            } catch (error) {
                logger.error('Failed to create WebSocket:', error)
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
                const errorMsg = data.error?.toString() || data.data?.toString() || ''
                if (errorMsg.includes('Already subscribed')) {
                    // ignore duplicate subscription errors
                    if (this.isDev) logger.debug('Ignoring duplicate subscription:', errorMsg)
                    return
                }
                if (errorMsg.includes('rate') || errorMsg.includes('limit') || errorMsg.includes('too many')) {
                    logger.warn('Rate limit detected:', data.error)
                    this.handleRateLimitError()
                }
                return logger.error('WebSocket error message:', data.error || data.data)
            }

            if (data.channel && data.data) {
                const key = this.getSubscriptionKey(data.channel, data.data)
                const callbacks = this.subscriptions.get(key)

                // log candle messages only in dev
                if (this.isDev && data.channel === 'candle') {
                    logger.debug(Date.now(), 'Candle message received:', {
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
                            logger.error('Error in subscription callback:', error)
                        }
                    })
                }
            }
        } catch (error) {
            logger.error('Error parsing WebSocket message:', error)
        }
    }

    private handleReconnection() {
        if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) return logger.error('Max reconnection attempts reached')

        // exponential backoff: 250ms → 10s max
        const delay = Math.min(this.INITIAL_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts), this.MAX_RECONNECT_DELAY)

        logger.info(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`)

        this.reconnectTimeout = setTimeout(() => {
            this.reconnectAttempts++
            this.connect().catch((err) => logger.error('Reconnect failed:', err))
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

                // heartbeat maintains connection health
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
        // batch process queued messages respecting rate limits
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

            // retry remaining messages after rate window
            if (this.messageQueue.length > 0) {
                const remainingTime = this.messageResetTime - now
                const retryDelay = Math.min(1000, remainingTime)
                setTimeout(() => this.processMessageQueue(), retryDelay)
            }
        }
    }

    private handleRateLimitError() {
        // backoff: 1s → 30s max on rate limit
        const backoffDelay = Math.min(1000 * Math.pow(2, this.restRetryCount), 30000)
        logger.warn(`Rate limited, backing off for ${backoffDelay}ms`)

        this.restRetryCount++

        setTimeout(() => {
            this.restRetryCount = Math.max(0, this.restRetryCount - 1)
            this.processMessageQueue()
        }, backoffDelay)
    }

    private resubscribeAll() {
        // restore all active subscriptions after reconnect
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
                        console.log(`[WS] Resubscribing after reconnect:`, key, subscription.subscription)
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
        const keyParams: Record<string, unknown> = { type: channel }

        // extract params for key
        if (Array.isArray(data)) {
            const firstItem = data[0] as Record<string, unknown>
            if (firstItem?.coin) keyParams.coin = firstItem.coin
        } else if (typedData) {
            // normalize coin params
            if (typedData.coin) keyParams.coin = typedData.coin
            else if (typedData.s) keyParams.coin = typedData.s // candle uses 's'

            if (typedData.user) keyParams.user = typedData.user

            // normalize interval params
            if (typedData.interval) keyParams.interval = typedData.interval
            else if (typedData.i) keyParams.interval = typedData.i // candle uses 'i'

            // include nSigFigs for l2Book
            if (typedData.nSigFigs !== undefined) keyParams.nSigFigs = typedData.nSigFigs

            // include aggregateByTime for userFills
            if (typedData.aggregateByTime !== undefined) keyParams.aggregateByTime = typedData.aggregateByTime
        }

        // deterministic key via sorted json
        return JSON.stringify(keyParams, Object.keys(keyParams).sort())
    }

    private parseSubscriptionKey(key: string): [string, Record<string, unknown>] {
        try {
            const keyParams = JSON.parse(key)
            const { type, ...params } = keyParams
            return [type, params]
        } catch {
            // fallback: malformed keys
            return [HyperliquidWebSocketSubscriptionType.ALL_MIDS, {}]
        }
    }

    subscribe(options: SubscriptionOptions, callback: SubscriptionCallback): () => void {
        // guard: sub limit
        if (this.subscriptions.size >= this.MAX_SUBSCRIPTIONS) {
            logger.warn(`Maximum subscriptions (${this.MAX_SUBSCRIPTIONS}) reached, cannot add new subscription`)
            return () => {} // no-op
        }

        const key = this.getSubscriptionKey(options.type, options)

        // log all subscriptions for debugging
        logger.debug(`[WS] Subscribe attempt: ${options.type}`, {
            coin: 'coin' in options ? options.coin : undefined,
            interval: 'interval' in options ? options.interval : undefined,
            nSigFigs: 'nSigFigs' in options ? options.nSigFigs : undefined,
            key,
            isNew: !this.subscriptions.has(key),
            existingSubs: Array.from(this.subscriptions.keys()).filter((k) => k.includes(options.type)),
        })

        const isNewSubscription = !this.subscriptions.has(key)
        if (isNewSubscription) {
            this.subscriptions.set(key, new Set())
        } else {
            console.log(`[WS] Already subscribed to:`, key, 'skipping WS message')
        }
        this.subscriptions.get(key)!.add(callback)

        // only send subscription if it's new
        if (isNewSubscription) {
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
                    console.log(`[WS] Sending NEW subscription:`, key, message.subscription)
                    this.ws.send(JSON.stringify(message))
                    this.messagesSent++
                } else {
                    // dedup queue to prevent duplicate subs
                    const messageStr = JSON.stringify(message)
                    const isDuplicate = this.messageQueue.some((m) => JSON.stringify(m) === messageStr)

                    if (!isDuplicate) {
                        logger.debug(`[WS] Queueing subscription (rate limited):`, message.subscription)
                        this.messageQueue.push(message)
                    } else {
                        logger.debug(`[WS] Skipping duplicate queued subscription:`, message.subscription)
                    }

                    const retryDelay = Math.min(1000, this.messageResetTime - now)
                    setTimeout(() => this.processMessageQueue(), retryDelay)
                }
            } else {
                // dedup queue to prevent duplicate subs
                const messageStr = JSON.stringify(message)
                const isDuplicate = this.messageQueue.some((m) => JSON.stringify(m) === messageStr)

                if (!isDuplicate) {
                    logger.debug(`[WS] Queueing subscription (not connected):`, message.subscription)
                    this.messageQueue.push(message)
                } else {
                    logger.debug(`[WS] Skipping duplicate queued subscription:`, message.subscription)
                }

                if (!this.isConnecting && !this.ws) {
                    this.connect().catch((err) => logger.error('Reconnect failed:', err))
                }
            }
        }

        return () => {
            const callbacks = this.subscriptions.get(key)
            if (callbacks) {
                callbacks.delete(callback)

                // cleanup: unsubscribe when no listeners
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
        const requestKey = `${requestType}:${JSON.stringify(params)}`

        // check in-flight request
        // removed pending request dedup - simpler is better

        // cache static data to reduce rest calls
        const requestTypesThatCanBeCached = ['metaAndAssetCtxs', 'spotMetaAndAssetCtxs', 'candleSnapshot']
        if (requestTypesThatCanBeCached.includes(requestType)) {
            const previouslyCachedResponse = this.metadataCache.get(requestKey)
            const currentTimestamp = Date.now()

            // ttl: candles 30s, metadata 60s
            const cacheTTL = requestType === 'candleSnapshot' ? 30000 : this.CACHE_TTL

            if (previouslyCachedResponse && currentTimestamp - previouslyCachedResponse.timestamp < cacheTTL) {
                if (this.isDev) logger.debug(`cache hit: ${requestType}`)
                return previouslyCachedResponse.data
            }
        }

        // make the request
        return this.doFetchInfo(requestType, params, requestKey)
    }

    private async doFetchInfo(requestType: string, params: Record<string, unknown>, requestKey: string): Promise<unknown> {
        const weight = this.calculateRequestWeight(requestType)

        // check rate limit
        const now = Date.now()
        if (now > this.restWeightResetTime) {
            this.restWeightUsed = 0
            this.restWeightResetTime = now + this.REST_WEIGHT_WINDOW
        }

        if (this.restWeightUsed + weight > this.REST_WEIGHT_LIMIT) {
            const waitTime = this.restWeightResetTime - now
            logger.warn(`REST rate limit would be exceeded, waiting ${waitTime}ms`)
            await new Promise((resolve) => setTimeout(resolve, waitTime))
            return this.doFetchInfo(requestType, params, requestKey) // retry after wait
        }

        try {
            const response = await fetch(this.REST_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: requestType, ...params }),
            })

            // handle 429 with retry-after header
            if (response.status === 429) {
                const retryAfter = response.headers.get('Retry-After')
                const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.min(1000 * Math.pow(2, this.restRetryCount), 30000)

                logger.warn(`Rate limited (429), retrying after ${waitTime}ms`)
                this.restRetryCount++

                await new Promise((resolve) => setTimeout(resolve, waitTime))
                return this.doFetchInfo(requestType, params, requestKey) // retry
            }

            if (!response.ok) throw new Error(`API request failed: ${response.status}`)

            this.restWeightUsed += weight
            this.restRetryCount = 0

            const data = await response.json()

            // cache immutable/slow-changing data
            const responseTypesThatShouldBeCached = ['metaAndAssetCtxs', 'spotMetaAndAssetCtxs', 'candleSnapshot']
            if (responseTypesThatShouldBeCached.includes(requestType)) {
                this.metadataCache.set(requestKey, { data, timestamp: Date.now() })
                if (this.isDev) logger.debug(`cached: ${requestType}`)
            }

            return data
        } catch (error) {
            logger.error('API request error:', error)
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

    // monitoring: track rate limit usage
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
        callback({
            mode: 'direct',
            message: 'Using direct WebSocket connection',
        })
    }

    reconnect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout)
            this.reconnectTimeout = null
        }
        this.reconnectAttempts = 0
        this.connect().catch((err) => logger.error('Manual reconnect failed:', err))
    }

    // manual cache invalidation
    clearMetadataCache() {
        this.metadataCache.clear()
        if (this.isDev) logger.debug('cache cleared')
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
