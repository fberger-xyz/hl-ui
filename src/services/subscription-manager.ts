'use client'

import { hyperliquidWS } from '@/services/hyperliquid-websocket'
import type { SubscriptionOptions, SubscriptionCallback } from '@/types/hyperliquid.types'

// singleton prevents duplicate ws connections across components
// reference counting ensures one subscription per unique data stream
class SubscriptionManager {
    private static instance: SubscriptionManager

    // count references to reuse existing subscriptions
    private subscriptions = new Map<
        string,
        {
            count: number
            unsubscribe: (() => void) | null
            callbacks: Set<SubscriptionCallback>
        }
    >()

    private constructor() {}

    static getInstance(): SubscriptionManager {
        if (!SubscriptionManager.instance) {
            SubscriptionManager.instance = new SubscriptionManager()
        }
        return SubscriptionManager.instance
    }

    private getKey(options: SubscriptionOptions): string {
        // deterministic key generation for deduplication
        const keyParts: string[] = [options.type]

        if ('coin' in options && options.coin) keyParts.push(options.coin)
        if ('user' in options && options.user) keyParts.push(options.user)
        if ('interval' in options && options.interval) keyParts.push(options.interval)
        if ('nSigFigs' in options) keyParts.push(`nSig:${options.nSigFigs}`)
        if ('aggregateByTime' in options) keyParts.push(`agg:${options.aggregateByTime}`)

        return keyParts.join(':')
    }

    subscribe(options: SubscriptionOptions, callback: SubscriptionCallback): () => void {
        const key = this.getKey(options)

        let subscription = this.subscriptions.get(key)

        if (!subscription) {
            // first subscriber - create actual websocket subscription
            console.log(`[SubManager] Creating new subscription: ${key}`)

            const callbacks = new Set<SubscriptionCallback>()
            callbacks.add(callback)

            // single ws subscription distributes to all listeners
            const masterCallback = (data: unknown) => {
                callbacks.forEach((cb) => {
                    try {
                        cb(data)
                    } catch (error) {
                        console.error('Error in subscription callback:', error)
                    }
                })
            }

            const unsubscribe = hyperliquidWS.subscribe(options, masterCallback)

            subscription = {
                count: 1,
                unsubscribe,
                callbacks,
            }

            this.subscriptions.set(key, subscription)
        } else {
            // additional subscriber - just increment count and add callback
            console.log(`[SubManager] Adding to existing subscription: ${key} (count: ${subscription.count + 1})`)
            subscription.count++
            subscription.callbacks.add(callback)
        }

        // return cleanup function
        return () => {
            const sub = this.subscriptions.get(key)
            if (!sub) return

            sub.callbacks.delete(callback)
            sub.count--

            if (sub.count === 0) {
                // last subscriber - cleanup
                console.log(`[SubManager] Removing subscription: ${key}`)
                if (sub.unsubscribe) {
                    sub.unsubscribe()
                }
                this.subscriptions.delete(key)
            } else {
                console.log(`[SubManager] Keeping subscription: ${key} (count: ${sub.count})`)
            }
        }
    }

    getActiveSubscriptions(): string[] {
        return Array.from(this.subscriptions.keys())
    }

    getSubscriptionCount(type?: string): number {
        if (!type) return this.subscriptions.size

        let count = 0
        for (const key of this.subscriptions.keys()) {
            if (key.startsWith(type)) count++
        }
        return count
    }
}

export const subscriptionManager = SubscriptionManager.getInstance()
