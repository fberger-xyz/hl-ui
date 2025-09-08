import { create } from 'zustand'
import { hyperliquidWS } from '@/services/hyperliquid-websocket'
import { HyperliquidWebSocketSubscriptionType } from '@/enums'
import type { SubscriptionOptions } from '@/types/hyperliquid.types'

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

interface Subscription {
    callbacks: Set<(data: unknown) => void> // reference counting prevents duplicates
    unsubscribe?: () => void
}

interface WsState {
    status: ConnectionStatus
    subscriptions: Map<string, Subscription>
    setStatus: (status: ConnectionStatus) => void
    subscribe: (channel: string, callback: (data: unknown) => void) => () => void
    unsubscribe: (channel: string, callback: (data: unknown) => void) => void
    clearAll: () => void
}

export const useWsStore = create<WsState>((set, get) => ({
    status: 'disconnected',
    subscriptions: new Map(),

    setStatus: (status) => set({ status }),

    subscribe: (channel, callback) => {
        const state = get()
        const existing = state.subscriptions.get(channel)

        if (existing) {
            // reuse existing subscription
            existing.callbacks.add(callback)
        } else {
            // create new subscription
            const callbacks = new Set([callback])
            const [type, ...params] = channel.split(':')

            // build subscription options
            const options: SubscriptionOptions = {
                type: type as HyperliquidWebSocketSubscriptionType,
            }
            if (params[0]) options.coin = params[0]
            if (params[1]) options.interval = params[1]

            // subscribe via websocket
            const unsubscribe = hyperliquidWS.subscribe(options, (data) => {
                callbacks.forEach((cb) => cb(data))
            })

            set((state) => ({
                subscriptions: new Map(state.subscriptions).set(channel, {
                    callbacks,
                    unsubscribe,
                }),
            }))
        }

        // return cleanup function
        return () => get().unsubscribe(channel, callback)
    },

    unsubscribe: (channel, callback) => {
        const state = get()
        const subscription = state.subscriptions.get(channel)
        // guard: no subscription
        if (!subscription) return

        subscription.callbacks.delete(callback)

        // cleanup when last subscriber leaves
        if (subscription.callbacks.size === 0) {
            subscription.unsubscribe?.()
            set((state) => {
                const newSubs = new Map(state.subscriptions)
                newSubs.delete(channel)
                return { subscriptions: newSubs }
            })
        }
    },

    clearAll: () => {
        const state = get()
        state.subscriptions.forEach((sub) => sub.unsubscribe?.())
        set({ subscriptions: new Map() })
    },
}))

// monitor connection status for ui feedback
if (typeof window !== 'undefined') {
    const checkStatus = () => {
        const status = hyperliquidWS.getConnectionStatus()
        useWsStore.getState().setStatus(status)
    }

    // check every second
    setInterval(checkStatus, 1000)
    checkStatus() // check immediately

    // check on error
    hyperliquidWS.onError((error) => {
        console.error('WebSocket error:', error)
        useWsStore.getState().setStatus('error')
    })

    // network monitoring saves battery
    window.addEventListener('online', () => {
        console.log('Network online, reconnecting WebSocket')
        hyperliquidWS.reconnect()
    })

    window.addEventListener('offline', () => {
        console.log('Network offline')
        // update ui immediately while ws handles reconnect
        useWsStore.getState().setStatus('disconnected')
    })
}
