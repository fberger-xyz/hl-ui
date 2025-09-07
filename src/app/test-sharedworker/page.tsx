'use client'

import { useEffect, useState, useRef } from 'react'
import { hyperliquidSharedWS } from '@/services/hyperliquid-websocket-sharedworker'

export default function TestSharedWorkerPage() {
    const [lastMessage, setLastMessage] = useState<{ data: string; timestamp: number } | null>(null)
    const [connectionState, setConnectionState] = useState<string>('disconnected')
    const [subscribed, setSubscribed] = useState(false)
    const [isSupported, setIsSupported] = useState(true)
    const [connectionId] = useState(() => Math.random().toString(36).substring(7))
    const [sharedStats, setSharedStats] = useState<{
        mode?: string
        message?: string
        tabsConnected?: number
        messagesReceived?: number
        activeSubscriptions?: number
        connectedAt?: number
    } | null>(null)
    const unsubscribeRef = useRef<(() => void) | null>(null)

    useEffect(() => {
        setIsSupported(typeof SharedWorker !== 'undefined')
    }, [])

    useEffect(() => {
        const checkState = setInterval(() => {
            const state = hyperliquidSharedWS.getConnectionState()
            setConnectionState(state)

            hyperliquidSharedWS.getStats((stats) => {
                setSharedStats(stats)
            })
        }, 1000)

        return () => clearInterval(checkState)
    }, [])

    const handleSubscribe = () => {
        if (!subscribed) {
            unsubscribeRef.current = hyperliquidSharedWS.subscribe({ type: 'allMids' }, (data) => {
                setLastMessage({
                    data: JSON.stringify(data, null, 2),
                    timestamp: Date.now(),
                })
            })
            setSubscribed(true)
            return
        }
        unsubscribeRef.current?.()
        unsubscribeRef.current = null
        setSubscribed(false)
    }

    const handleConnect = () => {
        hyperliquidSharedWS.connect()
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="mb-4 text-2xl font-bold">SharedWorker WebSocket Test</h1>

            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded border p-4">
                    <h2 className="mb-2 text-lg font-semibold">This Tab</h2>
                    <div className="space-y-2">
                        <p>
                            Tab ID: <span className="font-mono font-bold text-blue-600">{connectionId}</span>
                        </p>
                        <p>SharedWorker: {isSupported ? '✅ Supported' : '❌ Not Supported'}</p>
                        <p>
                            Status: <span className="font-semibold">{connectionState}</span>
                        </p>
                    </div>
                </div>

                <div className="rounded border p-4">
                    <h2 className="mb-2 text-lg font-semibold">Shared Connection Stats</h2>
                    {sharedStats ? (
                        sharedStats.mode === 'direct' ? (
                            <p className="text-xs text-gray-600">{sharedStats.message}</p>
                        ) : (
                            <div className="space-y-1 text-xs">
                                <p className="font-mono">
                                    <span className="font-bold text-green-600">{sharedStats?.tabsConnected || 0}</span> tabs sharing connection
                                </p>
                                <p className="font-mono">
                                    <span className="font-bold">{sharedStats?.messagesReceived || 0}</span> messages received
                                </p>
                                <p className="font-mono">
                                    <span className="font-bold">{sharedStats?.activeSubscriptions || 0}</span> active subscriptions
                                </p>
                                {sharedStats?.connectedAt && (
                                    <p className="font-mono text-xs text-gray-500">
                                        Connected {Math.floor((Date.now() - sharedStats.connectedAt) / 1000)}s ago
                                    </p>
                                )}
                            </div>
                        )
                    ) : (
                        <p className="text-xs text-gray-500">Loading stats...</p>
                    )}
                </div>
            </div>

            <div className="mb-4 space-x-2">
                <button onClick={handleConnect} className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
                    Connect
                </button>
                <button onClick={handleSubscribe} className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600">
                    {subscribed ? 'Unsubscribe' : 'Subscribe'} allMids
                </button>
            </div>

            <div className="rounded border p-4">
                <h2 className="mb-2 text-lg font-semibold">Latest Message</h2>
                <div className="space-y-2">
                    {!lastMessage ? (
                        <p className="text-gray-500">No messages yet...</p>
                    ) : (
                        <>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                <span className="font-mono font-bold text-blue-600">Tab {connectionId}</span>
                                <span>•</span>
                                <span>{new Date(lastMessage.timestamp).toLocaleTimeString()}</span>
                                <span>•</span>
                                <span className="text-green-600">{Math.floor((Date.now() - lastMessage.timestamp) / 1000)}s ago</span>
                            </div>
                            <pre className="overflow-x-auto rounded p-2 text-xs">{lastMessage.data}</pre>
                        </>
                    )}
                </div>
            </div>

            <div className="mt-4 rounded border border-blue-200 p-4">
                <p className="mb-1 text-xs font-semibold">How to verify SharedWorker is working:</p>
                <ol className="list-inside list-decimal space-y-1 text-xs">
                    <li>Open this page in 2+ browser tabs</li>
                    <li>Click &quot;Connect&quot; in any tab (only needed once)</li>
                    <li>Click &quot;Subscribe&quot; in all tabs</li>
                    <li>Watch the &quot;Shared Connection Stats&quot; - you should see:</li>
                    <li className="ml-4">• Number of tabs increase as you open more</li>
                    <li className="ml-4">• Same message count across all tabs</li>
                    <li className="ml-4">• Connection time stays the same</li>
                </ol>
            </div>
        </div>
    )
}
