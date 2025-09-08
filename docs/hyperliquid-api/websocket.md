# Hyperliquid WebSocket API

## WebSocket Endpoints
- **Mainnet**: `wss://api.hyperliquid.xyz/ws`
- **Testnet**: `wss://api.hyperliquid-testnet.xyz/ws`

## Connection

### Basic Connection
Establish a WebSocket connection to the appropriate endpoint URL.

### Command Line Example
```bash
$ wscat -c wss://api.hyperliquid.xyz/ws
Connected (press CTRL+C to quit)
>  { "method": "subscribe", "subscription": { "type": "trades", "coin": "SOL" } }
```

## Message Format

### Subscribe Request
```json
{
  "method": "subscribe",
  "subscription": {
    "type": "channel_name",
    // Additional parameters based on channel
  }
}
```

### Unsubscribe Request
```json
{
  "method": "unsubscribe", 
  "subscription": {
    "type": "channel_name",
    // Same parameters as subscribe
  }
}
```

## Available Subscription Types

### Trades
Real-time trade updates for a specific coin
```json
{
  "type": "trades",
  "coin": "SOL"
}
```

### Order Book
Order book updates for a specific coin
```json
{
  "type": "l2Book",
  "coin": "BTC"
}
```

### All Markets
Ticker updates for all markets
```json
{
  "type": "allMids"
}
```

### User Events
User-specific updates (orders, fills, positions)
```json
{
  "type": "userEvents",
  "user": "0x..." // User address
}
```

### Candles
OHLCV candlestick data
```json
{
  "type": "candle",
  "coin": "ETH",
  "interval": "1m" // 1m, 5m, 15m, 1h, 4h, 1d
}
```

## Post Requests
The WebSocket connection can also be used to send requests and receive responses, similar to REST API calls but over the WebSocket connection.

### Request Format
```json
{
  "method": "post",
  "id": 123, // Request ID for matching response
  "request": {
    // Request body (same as REST API)
  }
}
```

## Connection Management

### Heartbeat/Ping
Send periodic ping messages to keep the connection alive:
```json
{
  "method": "ping"
}
```

### Timeout Handling
- Connections may timeout after periods of inactivity
- Implement automatic reconnection logic
- Resubscribe to channels after reconnection

## Error Handling

### Error Response Format
```json
{
  "channel": "error",
  "data": {
    "code": "error_code",
    "msg": "Error description"
  }
}
```

## Best Practices

1. **Connection Management**
   - Implement automatic reconnection
   - Handle network interruptions gracefully
   - Maintain subscription state for resubscription

2. **Message Processing**
   - Process messages asynchronously
   - Implement proper error handling
   - Use message queues for high-volume data

3. **Rate Limiting**
   - Respect subscription limits
   - Avoid excessive subscription/unsubscription

## Implementation References

### Python SDK
- Types: [hyperliquid-python-sdk/types.py](https://github.com/hyperliquid-dex/hyperliquid-python-sdk/blob/master/hyperliquid/utils/types.py)
- WebSocket Manager: [websocket_manager.py](https://github.com/hyperliquid-dex/hyperliquid-python-sdk/blob/master/hyperliquid/websocket_manager.py)

### TypeScript
Community-maintained TypeScript implementations are available with full type definitions.