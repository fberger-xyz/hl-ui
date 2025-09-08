# Hyperliquid Info Endpoint

## Overview
The Info endpoint provides read-only access to market data, account information, and trading history.

**Endpoint**: `POST https://api.hyperliquid.xyz/info`

## Request Format
```json
{
  "type": "requestType",
  // Type-specific parameters
}
```

## Market Data Requests

### All Mid Prices
Get mid prices for all trading pairs
```json
{
  "type": "allMids"
}
```

Response:
```json
{
  "BTC": "65432.1",
  "ETH": "3456.7",
  // ...
}
```

### L2 Order Book
Get order book snapshot (up to 20 levels per side)
```json
{
  "type": "l2Book",
  "coin": "BTC",
  "nSigFigs": 5 // Optional: significant figures for grouping
}
```

Response:
```json
{
  "coin": "BTC",
  "levels": [
    [["65000.0", "1.5"], ["64999.0", "2.0"]], // Bids
    [["65001.0", "1.2"], ["65002.0", "1.8"]]  // Asks
  ],
  "time": 1234567890000
}
```

### Candle Data
Get OHLCV candlestick data
```json
{
  "type": "candleSnapshot",
  "coin": "ETH",
  "interval": "1h", // 1m, 5m, 15m, 1h, 4h, 1d, 1w, 1M
  "startTime": 1234567890000,
  "endTime": 1234567899999
}
```

Response:
```json
[
  {
    "t": 1234567890000, // Timestamp
    "o": "3450.0",      // Open
    "h": "3460.0",      // High
    "l": "3445.0",      // Low
    "c": "3455.0",      // Close
    "v": "1250.5"       // Volume
  }
]
```

### Meta Info
Get trading pair configuration
```json
{
  "type": "meta"
}
```

Response:
```json
{
  "universe": [
    {
      "name": "BTC",
      "szDecimals": 5,
      "maxLeverage": 50,
      "onlyIsolated": false
    }
  ]
}
```

### Funding History
Get historical funding rates
```json
{
  "type": "fundingHistory",
  "coin": "BTC",
  "startTime": 1234567890000,
  "endTime": 1234567899999
}
```

## User Account Requests

### Open Orders
Get user's open orders
```json
{
  "type": "openOrders",
  "user": "0x..." // User address
}
```

Response:
```json
[
  {
    "coin": "BTC",
    "limitPx": "65000.0",
    "oid": 123456,
    "side": "B",
    "sz": "0.1",
    "timestamp": 1234567890000,
    "origSz": "0.1",
    "cloid": "client123"
  }
]
```

### User Fills
Get user's trade history
```json
{
  "type": "userFills",
  "user": "0x...",
  "startTime": 1234567890000, // Optional
  "aggregateByTime": false     // Optional
}
```

Response:
```json
[
  {
    "coin": "ETH",
    "px": "3455.5",
    "sz": "0.5",
    "side": "B",
    "time": 1234567890000,
    "startPosition": "1.0",
    "dir": "Open",
    "closedPnl": "0.0",
    "hash": "0x...",
    "oid": 123456,
    "crossed": true,
    "fee": "1.73"
  }
]
```

### User Fills By Time
Get aggregated fills
```json
{
  "type": "userFillsByTime",
  "user": "0x...",
  "startTime": 1234567890000,
  "endTime": 1234567899999
}
```

### User Funding
Get user's funding payments
```json
{
  "type": "userFunding",
  "user": "0x...",
  "startTime": 1234567890000,
  "endTime": 1234567899999
}
```

### Clearinghouse State
Get user's account state
```json
{
  "type": "clearinghouseState",
  "user": "0x..."
}
```

Response:
```json
{
  "assetPositions": [
    {
      "position": {
        "coin": "BTC",
        "entryPx": "65000.0",
        "positionValue": "6500.0",
        "returnOnEquity": "0.05",
        "szi": "0.1",
        "unrealizedPnl": "50.0"
      },
      "type": "oneWay"
    }
  ],
  "crossMargin": "10000.0",
  "crossMaintenanceMarginUsed": "650.0",
  "marginSummary": {
    "accountValue": "10050.0",
    "totalMarginUsed": "650.0",
    "totalNtlPos": "6500.0",
    "totalRawUsd": "3550.0"
  },
  "time": 1234567890000,
  "withdrawable": "3400.0"
}
```

### Order Status
Get status of specific order
```json
{
  "type": "orderStatus",
  "user": "0x...",
  "oid": 123456
}
```

Response:
```json
{
  "status": "order",
  "order": {
    // Order details
  }
}
```

### Portfolio Summary
Get detailed portfolio metrics
```json
{
  "type": "portfolio",
  "user": "0x..."
}
```

## Spot Market Requests

### Spot Meta Info
```json
{
  "type": "spotMeta"
}
```

### Spot Market Data
```json
{
  "type": "spotClearinghouseState",
  "user": "0x..."
}
```

### Spot Order Book
```json
{
  "type": "spotMetaAndAssetCtxs"
}
```

## Advanced Queries

### Referral State
```json
{
  "type": "referral",
  "user": "0x..."
}
```

### User Fees
```json
{
  "type": "userFees",
  "user": "0x..."
}
```

### TWAP Slice Fills
```json
{
  "type": "twapSliceFills",
  "user": "0x...",
  "twapId": 123456
}
```

### User Rate Limits
```json
{
  "type": "userRateLimit",
  "user": "0x..."
}
```

### Vault Details
```json
{
  "type": "vaultDetails",
  "vaultAddress": "0x...",
  "user": "0x..." // Optional, for user's position in vault
}
```

### Subaccounts
```json
{
  "type": "subAccounts",
  "user": "0x..."
}
```

## Pagination

For endpoints returning large datasets:
```json
{
  "type": "userFills",
  "user": "0x...",
  "startTime": 1234567890000,
  "limit": 100
}
```

## Error Handling

### Response Format
```json
{
  "status": "ok",
  "response": {
    // Data
  }
}
```

### Error Response
```json
{
  "status": "err",
  "response": "Error message"
}
```

## Best Practices

1. **Caching**
   - Cache relatively static data (meta, universe)
   - Use appropriate refresh intervals for market data

2. **Rate Limiting**
   - Respect rate limits
   - Implement exponential backoff on errors

3. **Data Consistency**
   - Use timestamps to ensure data ordering
   - Handle missing data gracefully

4. **Performance**
   - Request only needed data
   - Use pagination for large datasets
   - Batch related requests when possible