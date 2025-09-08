// plain js for browser compatibility

let ws = null
const ports = new Map() // port id to {port, subscriptions, lastPing}
const activeSubscriptions = new Map() // channel to subscription details
let portIdCounter = 0

const WS_URL = 'wss://api-ui.hyperliquid.xyz/ws'
const RECONNECT_DELAY = 3000
const HEARTBEAT_INTERVAL = 30000
const PORT_PING_INTERVAL = 5000 // check health every 5s
const PORT_PING_TIMEOUT = 20000 // dead after 20s (increased from 10s for production stability)

let heartbeatTimer = null
let reconnectTimer = null
let portHealthTimer = null

let connectionStats = {
    connectedAt: null,
    messagesReceived: 0,
    reconnectCount: 0,
}

function broadcast(message) {
    const messageWithTimestamp = { ...message, timestamp: Date.now() }
    ports.forEach(({ port }, portId) => {
        try {
            port.postMessage(messageWithTimestamp)
        } catch (error) {
            console.error(`Failed to post message to port ${portId}:`, error)
            handlePortDisconnect(portId) // remove dead port
        }
    })
}

function sendToPort(port, message, portId = null) {
    const messageWithTimestamp = { ...message, timestamp: Date.now() }
    try {
        port.postMessage(messageWithTimestamp)
    } catch (error) {
        console.error(`Failed to send to port ${portId}:`, error)
        if (portId) {
            handlePortDisconnect(portId)
        }
    }
}

function connectWebSocket() {
    if (ws && ws.readyState === WebSocket.OPEN) return

    console.log('[SharedWorker] Connecting to WebSocket:', WS_URL)

    try {
        ws = new WebSocket(WS_URL)

        ws.onopen = () => {
            console.log('[SharedWorker] WebSocket connected')
            connectionStats.connectedAt = Date.now()
            broadcast({ type: 'connected' })

            // resubscribe to all active channels
            activeSubscriptions.forEach((subscription) => {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(
                        JSON.stringify({
                            method: 'subscribe',
                            subscription: subscription,
                        }),
                    )
                }
            })

            startHeartbeat()
        }

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)
                connectionStats.messagesReceived++

                // parse hyperliquid message types
                let channel = null
                let messageData = data

                if (data.channel) {
                    channel = data.channel
                    messageData = data.data || data
                } else if (data.method === 'subscription') {
                    channel = data.subscription?.type
                } else if (data.data) {
                    const d = data.data
                    if (d.allMids !== undefined) {
                        channel = 'allMids'
                        messageData = d
                    } else if (d.levels !== undefined) {
                        channel = 'l2Book'
                        messageData = d
                    } else if (Array.isArray(d) && d.length > 0) {
                        if (d[0].px !== undefined && d[0].sz !== undefined) {
                            channel = 'trades'
                            messageData = d
                        } else if (d[0].t !== undefined && d[0].o !== undefined) {
                            channel = 'candle'
                            messageData = d
                        }
                    }
                }

                // route to subscribers
                if (channel) {
                    const subscribers = []
                    ports.forEach((portData, portId) => {
                        portData.subscriptions.forEach((subChannel) => {
                            if (subChannel === channel || subChannel.startsWith(channel + ':')) subscribers.push(portId)
                        })
                    })

                    subscribers.forEach((portId) => {
                        const portData = ports.get(portId)
                        if (portData) {
                            sendToPort(
                                portData.port,
                                {
                                    type: 'message',
                                    channel: channel,
                                    data: messageData,
                                },
                                portId,
                            )
                        }
                    })

                    if (subscribers.length === 0 && channel !== 'subscription') {
                        console.log(`[SharedWorker] No subscribers for channel: ${channel}`)
                    }
                } else if (!data.method) {
                    broadcast({
                        type: 'message',
                        data: data,
                    })
                }
            } catch (error) {
                console.error('[SharedWorker] Error parsing message:', error)
                broadcast({
                    type: 'message',
                    data: event.data,
                })
            }
        }

        ws.onerror = (error) => {
            console.error('[SharedWorker] WebSocket error:', error)
            broadcast({ type: 'error', data: error })
        }

        ws.onclose = () => {
            console.log('[SharedWorker] WebSocket disconnected')
            connectionStats.reconnectCount++
            broadcast({ type: 'disconnected' })
            ws = null
            stopHeartbeat()

            if (ports.size > 0) scheduleReconnect() // reconnect if ports exist
        }
    } catch (error) {
        console.error('[SharedWorker] Failed to create WebSocket:', error)
        broadcast({ type: 'error', data: error })
        scheduleReconnect()
    }
}

// heartbeat to keep connection alive
function startHeartbeat() {
    stopHeartbeat()
    heartbeatTimer = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ method: 'ping' }))
        }
    }, HEARTBEAT_INTERVAL)
}

function stopHeartbeat() {
    if (heartbeatTimer) {
        clearInterval(heartbeatTimer)
        heartbeatTimer = null
    }
}

// Port health monitoring
function startPortHealthCheck() {
    stopPortHealthCheck()
    portHealthTimer = setInterval(() => {
        const now = Date.now()
        const deadPorts = []

        ports.forEach(({ lastPing }, portId) => {
            if (now - lastPing > PORT_PING_TIMEOUT) {
                console.log(`[SharedWorker] Port ${portId} is not responding, removing`)
                deadPorts.push(portId)
            }
        })

        deadPorts.forEach((portId) => handlePortDisconnect(portId))
    }, PORT_PING_INTERVAL)
}

function stopPortHealthCheck() {
    if (!portHealthTimer) return
    clearInterval(portHealthTimer)
    portHealthTimer = null
}

function scheduleReconnect() {
    if (reconnectTimer) return

    reconnectTimer = setTimeout(() => {
        reconnectTimer = null
        if (ports.size > 0) {
            connectWebSocket()
        }
    }, RECONNECT_DELAY)
}

// handle port disconnection
function handlePortDisconnect(portId) {
    const portData = ports.get(portId)
    if (!portData) return

    ports.delete(portId)
    console.log(`[SharedWorker] Port ${portId} disconnected. Active ports: ${ports.size}`)

    // clean up subscriptions
    if (portData.subscriptions) {
        portData.subscriptions.forEach((channel) => {
            let stillSubscribed = false
            ports.forEach(({ subscriptions }) => {
                if (subscriptions.has(channel)) stillSubscribed = true
            })

            if (!stillSubscribed) {
                // unsubscribe if no port needs it
                const subscription = activeSubscriptions.get(channel)
                if (subscription && ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(
                        JSON.stringify({
                            method: 'unsubscribe',
                            subscription: subscription,
                        }),
                    )
                }
                activeSubscriptions.delete(channel)
            }
        })
    }

    if (ports.size === 0) {
        // close if no ports
        console.log('[SharedWorker] No more ports, closing WebSocket')
        if (ws) {
            ws.close()
            ws = null
        }
        stopHeartbeat()
        stopPortHealthCheck()
        if (reconnectTimer) {
            clearTimeout(reconnectTimer)
            reconnectTimer = null
        }
    }
}

// Cleanup on worker termination
self.addEventListener('beforeunload', () => {
    console.log('[SharedWorker] Worker terminating, cleaning up...')
    if (ws) {
        ws.close()
        ws = null
    }
    stopHeartbeat()
    stopPortHealthCheck()
    if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
    }
})

// handle new connection from a tab
self.onconnect = (event) => {
    const port = event.ports[0]
    const portId = ++portIdCounter

    console.log(`[SharedWorker] New port ${portId} connected. Total ports: ${ports.size + 1}`)

    // Store port with metadata
    ports.set(portId, {
        port: port,
        subscriptions: new Set(),
        lastPing: Date.now(),
    })

    // Start the port immediately to avoid race conditions
    port.start()

    // handle messages from this port
    port.onmessage = (event) => {
        const message = event.data
        const portData = ports.get(portId)
        if (portData) {
            portData.lastPing = Date.now()
        }

        switch (message.type) {
            case 'getStats':
                sendToPort(
                    port,
                    {
                        type: 'stats',
                        data: {
                            ...connectionStats,
                            tabsConnected: ports.size,
                            activeSubscriptions: activeSubscriptions.size,
                            wsState: ws ? ws.readyState : 'no connection',
                            wsStateText: ws
                                ? ws.readyState === WebSocket.OPEN
                                    ? 'connected'
                                    : ws.readyState === WebSocket.CONNECTING
                                      ? 'connecting'
                                      : ws.readyState === WebSocket.CLOSING
                                        ? 'closing'
                                        : 'closed'
                                : 'no connection',
                        },
                    },
                    portId,
                )
                break

            case 'send':
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify(message.data))
                } else {
                    sendToPort(
                        port,
                        {
                            type: 'error',
                            data: 'WebSocket not connected',
                        },
                        portId,
                    )
                }
                break

            case 'subscribe':
                if (message.subscription) {
                    const channel = message.subscription.type
                    const portData = ports.get(portId)

                    if (portData) {
                        // track subscription for this port
                        portData.subscriptions.add(channel)

                        // subscribe if not already subscribed
                        if (!activeSubscriptions.has(channel)) {
                            activeSubscriptions.set(channel, message.subscription)
                            if (ws && ws.readyState === WebSocket.OPEN) {
                                ws.send(
                                    JSON.stringify({
                                        method: 'subscribe',
                                        subscription: message.subscription,
                                    }),
                                )
                            }
                        }
                        sendToPort(
                            port,
                            {
                                type: 'subscribed',
                                channel: channel,
                            },
                            portId,
                        )
                    }
                }
                break

            case 'unsubscribe':
                if (message.channel) {
                    const portData = ports.get(portId)
                    if (portData) {
                        // remove subscription for this port
                        portData.subscriptions.delete(message.channel)

                        // check if any other port still needs this channel
                        let stillNeeded = false
                        ports.forEach(({ subscriptions }) => {
                            if (subscriptions.has(message.channel)) {
                                stillNeeded = true
                            }
                        })

                        // unsubscribe if no port needs it
                        if (!stillNeeded) {
                            const subscription = activeSubscriptions.get(message.channel)
                            if (subscription && ws && ws.readyState === WebSocket.OPEN) {
                                ws.send(
                                    JSON.stringify({
                                        method: 'unsubscribe',
                                        subscription: subscription,
                                    }),
                                )
                            }
                            activeSubscriptions.delete(message.channel)
                        }
                        sendToPort(
                            port,
                            {
                                type: 'unsubscribed',
                                channel: message.channel,
                            },
                            portId,
                        )
                    }
                }
                break

            case 'ping':
                // respond to ping to check if worker is alive
                sendToPort(port, { type: 'pong' }, portId)
                // also update lastPing explicitly for ping messages
                if (portData) portData.lastPing = Date.now()

                break
        }
    }

    // Send initial port ID to client
    sendToPort(port, { type: 'init', portId: portId }, portId)

    // connect websocket on first port connection
    if (ports.size === 1) {
        connectWebSocket()
        startPortHealthCheck()
    } else if (ws && ws.readyState === WebSocket.OPEN) {
        // notify new port of current connection state
        sendToPort(port, { type: 'connected' }, portId)
    } else {
        sendToPort(port, { type: 'disconnected' }, portId)
    }
}
