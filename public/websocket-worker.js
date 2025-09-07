// websocket sharedworker - plain js for browser compatibility

let ws = null
const ports = []
const portSubscriptions = new Map()
const activeSubscriptions = new Set()

const WS_URL = 'wss://api-ui.hyperliquid.xyz/ws'
const RECONNECT_DELAY = 3000
const HEARTBEAT_INTERVAL = 30000

let heartbeatTimer = null
let reconnectTimer = null

let connectionStats = {
    connectedAt: null,
    messagesReceived: 0,
    reconnectCount: 0,
}

function broadcast(message) {
    const messageWithTimestamp = { ...message, timestamp: Date.now() }
    ports.forEach(port => {
        try {
            port.postMessage(messageWithTimestamp)
        } catch (error) {
            console.error('Failed to post message to port:', error)
        }
    })
}

function sendToPort(port, message) {
    const messageWithTimestamp = { ...message, timestamp: Date.now() }
    try {
        port.postMessage(messageWithTimestamp)
    } catch (error) {
        console.error('Failed to send to port:', error)
    }
}

function connectWebSocket() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        return
    }

    console.log('[SharedWorker] Connecting to WebSocket:', WS_URL)
    
    try {
        ws = new WebSocket(WS_URL)
        
        ws.onopen = () => {
            console.log('[SharedWorker] WebSocket connected')
            connectionStats.connectedAt = Date.now()
            broadcast({ type: 'connected' })
            
            // resubscribe to all active channels
            activeSubscriptions.forEach(channel => {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        method: 'subscribe',
                        subscription: { type: channel }
                    }))
                }
            })
            
            startHeartbeat()
        }
        
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)
                connectionStats.messagesReceived++
                
                // hyperliquid sends data with 'channel' field for subscription responses
                // for allMids, it's { channel: 'allMids', data: {...} }
                const channel = data.channel || 'allMids'
                
                broadcast({ 
                    type: 'message', 
                    channel: channel,
                    data: data
                })
            } catch (error) {
                console.error('[SharedWorker] Error parsing message:', error)
                broadcast({ 
                    type: 'message',
                    data: event.data 
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
            
            // reconnect if we still have connected ports
            if (ports.length > 0) {
                scheduleReconnect()
            }
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

// reconnection logic
function scheduleReconnect() {
    if (reconnectTimer) return
    
    reconnectTimer = setTimeout(() => {
        reconnectTimer = null
        if (ports.length > 0) {
            connectWebSocket()
        }
    }, RECONNECT_DELAY)
}

// handle port (tab) disconnection
function handlePortDisconnect(port) {
    const index = ports.indexOf(port)
    if (index !== -1) {
        ports.splice(index, 1)
        console.log(`[SharedWorker] Port disconnected. Active ports: ${ports.length}`)
        
        // clean up subscriptions for this port
        const subscriptions = portSubscriptions.get(port)
        if (subscriptions) {
            subscriptions.forEach(channel => {
                // check if any other port is still subscribed
                let stillSubscribed = false
                portSubscriptions.forEach((subs, p) => {
                    if (p !== port && subs.has(channel)) {
                        stillSubscribed = true
                    }
                })
                
                // unsubscribe if no other port needs this channel
                if (!stillSubscribed) {
                    activeSubscriptions.delete(channel)
                    if (ws && ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({
                            method: 'unsubscribe',
                            subscription: { type: channel }
                        }))
                    }
                }
            })
            portSubscriptions.delete(port)
        }
        
        // close websocket if no more ports
        if (ports.length === 0) {
            console.log('[SharedWorker] No more ports, closing WebSocket')
            if (ws) {
                ws.close()
                ws = null
            }
            stopHeartbeat()
            if (reconnectTimer) {
                clearTimeout(reconnectTimer)
                reconnectTimer = null
            }
        }
    }
}

// handle new connection from a tab
self.onconnect = (event) => {
    const port = event.ports[0]
    
    console.log(`[SharedWorker] New port connected. Total ports: ${ports.length + 1}`)
    ports.push(port)
    
    // initialize subscription tracking for this port
    portSubscriptions.set(port, new Set())
    
    // handle messages from this port
    port.onmessage = (event) => {
        const message = event.data
        
        switch (message.type) {
            case 'getStats':
                sendToPort(port, {
                    type: 'stats',
                    data: {
                        ...connectionStats,
                        tabsConnected: ports.length,
                        activeSubscriptions: activeSubscriptions.size,
                        wsState: ws ? ws.readyState : 'no connection',
                        wsStateText: ws ? 
                            (ws.readyState === WebSocket.OPEN ? 'connected' : 
                             ws.readyState === WebSocket.CONNECTING ? 'connecting' : 
                             ws.readyState === WebSocket.CLOSING ? 'closing' : 'closed') 
                            : 'no connection'
                    }
                })
                break
                
            case 'send':
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify(message.data))
                } else {
                    sendToPort(port, { 
                        type: 'error', 
                        data: 'WebSocket not connected' 
                    })
                }
                break
                
            case 'subscribe':
                if (message.channel) {
                    // track subscription for this port
                    portSubscriptions.get(port)?.add(message.channel)
                    
                    // subscribe if not already subscribed
                    if (!activeSubscriptions.has(message.channel)) {
                        activeSubscriptions.add(message.channel)
                        if (ws && ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify({
                                method: 'subscribe',
                                subscription: { type: message.channel }
                            }))
                        }
                    }
                    sendToPort(port, { 
                        type: 'subscribed', 
                        channel: message.channel 
                    })
                }
                break
                
            case 'unsubscribe':
                if (message.channel) {
                    // remove subscription for this port
                    portSubscriptions.get(port)?.delete(message.channel)
                    
                    // check if any other port still needs this channel
                    let stillNeeded = false
                    portSubscriptions.forEach(subs => {
                        if (subs.has(message.channel)) {
                            stillNeeded = true
                        }
                    })
                    
                    // unsubscribe if no port needs it
                    if (!stillNeeded) {
                        activeSubscriptions.delete(message.channel)
                        if (ws && ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify({
                                method: 'unsubscribe',
                                subscription: { type: message.channel }
                            }))
                        }
                    }
                    sendToPort(port, { 
                        type: 'unsubscribed', 
                        channel: message.channel 
                    })
                }
                break
                
            case 'ping':
                // respond to ping to check if worker is alive
                sendToPort(port, { type: 'message', data: 'pong' })
                break
        }
    }
    
    // handle port disconnection
    port.addEventListener('messageerror', () => handlePortDisconnect(port))
    
    // start the port
    port.start()
    
    // connect websocket on first port connection
    if (ports.length === 1) {
        connectWebSocket()
    } else if (ws && ws.readyState === WebSocket.OPEN) {
        // notify new port of current connection state
        sendToPort(port, { type: 'connected' })
    } else {
        sendToPort(port, { type: 'disconnected' })
    }
}