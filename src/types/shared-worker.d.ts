// worker message types
export interface WorkerMessage {
    type: 'init' | 'connected' | 'disconnected' | 'message' | 'error' | 'subscribed' | 'unsubscribed' | 'stats' | 'pong'
    channel?: string
    data?: unknown
    timestamp?: number
    portId?: number
}

export interface ClientMessage {
    type: 'send' | 'subscribe' | 'unsubscribe' | 'ping' | 'getStats'
    channel?: string
    data?: unknown
    subscription?: Record<string, unknown>
}
