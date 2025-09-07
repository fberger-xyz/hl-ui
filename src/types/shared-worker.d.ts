// worker message types
export interface WorkerMessage {
    type: 'connected' | 'disconnected' | 'message' | 'error' | 'subscribed' | 'unsubscribed' | 'stats'
    channel?: string
    data?: unknown
    timestamp?: number
}

export interface ClientMessage {
    type: 'send' | 'subscribe' | 'unsubscribe' | 'ping' | 'getStats'
    channel?: string
    data?: unknown
}
