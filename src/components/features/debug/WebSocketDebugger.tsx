'use client'

import { useState, useEffect } from 'react'
import { hyperliquidWS } from '@/services/hyperliquid-websocket'
import { subscriptionManager } from '@/services/subscription-manager'

export function WebSocketDebugger() {
    const [stats, setStats] = useState<{
        mode?: string
        message?: string
        tabsConnected?: number
        messagesReceived?: number
        activeSubscriptions?: number
        connectedAt?: number
    } | null>(null)
    const [subscriptions, setSubscriptions] = useState<string[]>([])
    const [connectionState, setConnectionState] = useState<string>('')
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        const interval = setInterval(() => {
            // get connection state
            setConnectionState(hyperliquidWS.getConnectionStatus())

            // get active subscriptions
            setSubscriptions(subscriptionManager.getActiveSubscriptions())

            // get shared worker stats
            hyperliquidWS.getStats((newStats) => setStats(newStats))
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    if (!isVisible) return null

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-md rounded-lg bg-black/90 p-4 font-mono text-xs text-green-400">
            <div className="mb-2 flex items-center justify-between">
                <div className="text-yellow-400">WebSocket Debug</div>
                <button onClick={() => setIsVisible(false)} className="ml-4 text-gray-400 hover:text-white" aria-label="Close">
                    ✕
                </button>
            </div>

            <div>Mode: {stats?.mode || 'unknown'}</div>
            <div>Status: {connectionState}</div>

            {stats?.mode === 'sharedworker' && (
                <>
                    <div>Tabs Connected: {stats.tabsConnected}</div>
                    <div>Messages Received: {stats.messagesReceived}</div>
                    <div>Active Subscriptions: {stats.activeSubscriptions}</div>
                    <div>Connected At: {stats.connectedAt ? new Date(stats.connectedAt).toLocaleTimeString() : 'N/A'}</div>
                    {stats.tabsConnected && stats.tabsConnected > 1 && (
                        <div className="mt-1 text-green-500">✓ Saving {(stats.tabsConnected - 1) * subscriptions.length} duplicate subscriptions</div>
                    )}
                    <div className="mt-2">
                        <a
                            href="chrome://inspect/#workers"
                            className="text-blue-400 underline hover:text-blue-300"
                            onClick={(e) => {
                                e.preventDefault()
                                navigator.clipboard.writeText('chrome://inspect/#workers')
                                alert('chrome://inspect/#workers copied to clipboard')
                            }}>
                            Inspect Worker ↗
                        </a>
                    </div>
                </>
            )}

            {stats?.mode === 'direct' && <div className="text-orange-400">{stats.message}</div>}

            <div className="mt-2 text-blue-400">Local Subscriptions ({subscriptions.length}):</div>
            <div className="max-h-32 overflow-y-auto">
                {subscriptions.map((sub, i) => (
                    <div key={i} className="truncate text-gray-400">
                        {sub}
                    </div>
                ))}
            </div>
        </div>
    )
}
