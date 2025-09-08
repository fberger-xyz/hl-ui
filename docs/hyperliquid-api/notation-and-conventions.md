# Hyperliquid API Notation and Conventions

## Field Abbreviations

The Hyperliquid API uses specific abbreviations for common fields:

| Abbreviation | Full Name | Description |
|-------------|-----------|-------------|
| `px` | Price | Price of an asset |
| `sz` | Size | Size in units of the base currency |
| `szi` | Signed Size | Positive for long positions, negative for short |
| `ntl` | Notional | USD value (calculated as Price × Size) |
| `oid` | Order ID | Unique identifier for an order |
| `cloid` | Client Order ID | User-provided order identifier |
| `tif` | Time in Force | Order lifetime specification |

## Side Notation

### For Orders
- **"B"** = **Buy** (Bid side)
- **"A"** = **Sell** (Ask side, Short)

### For Trades
The side represents the **aggressing side**:
- **"B"** = Buy aggressor (took from asks)
- **"A"** = Sell aggressor (took from bids)

## Asset Identification

Assets are identified by:
1. **Integer Index** - Used in exchange operations
2. **Symbol/Name** - Used for display and some info queries

### Asset Index Mapping
```python
# Example mapping (check meta endpoint for current)
assets = {
    0: "BTC",
    1: "ETH", 
    2: "SOL",
    # ... etc
}
```

## Time in Force (TIF) Options

| Value | Name | Description |
|-------|------|-------------|
| `Gtc` | Good Till Canceled | Order remains active until filled or canceled |
| `Alo` | Add Liquidity Only | Post-only order, canceled if would take liquidity |
| `Ioc` | Immediate or Cancel | Fill immediately or cancel remainder |

## Number Formatting

### Decimals and Precision
- **Prices**: String format to preserve precision
- **Sizes**: String or number, depends on context
- **Timestamps**: Milliseconds since Unix epoch

### Size Decimals
Each asset has specific decimal places for size:
```json
{
  "BTC": {
    "szDecimals": 5,  // 0.00001 BTC minimum
    "pxDecimals": 1   // 0.1 USD minimum tick
  }
}
```

## Order Type Structure

### Limit Order
```json
{
  "limit": {
    "tif": "Gtc"  // or "Alo", "Ioc"
  }
}
```

### Market Order
```json
{
  "market": {}
}
```

### Trigger Order (Stop/Take Profit)
```json
{
  "trigger": {
    "triggerPx": "65000.0",
    "isMarket": true,  // true for stop market, false for stop limit
    "tpsl": "sl"  // "tp" for take profit, "sl" for stop loss
  }
}
```

## Position Notation

### Direction
- **Positive `szi`**: Long position
- **Negative `szi`**: Short position
- **Zero**: No position

### Leverage Types
- **Cross**: `isCross: true`
- **Isolated**: `isCross: false`

## Response Status Codes

### Order Statuses
```python
class OrderStatus:
    OPEN = "open"
    FILLED = "filled"
    CANCELED = "canceled"
    PARTIALLY_FILLED = "partial"
    REJECTED = "rejected"
    TRIGGERED = "triggered"
```

### Error Codes
```python
class ErrorCode:
    INSUFFICIENT_MARGIN = "insufficient_margin"
    INVALID_PRICE = "invalid_price"
    INVALID_SIZE = "invalid_size"
    RATE_LIMITED = "rate_limited"
    ORDER_NOT_FOUND = "order_not_found"
```

## Batch Operation Notation

### Multiple Orders
```json
{
  "orders": [
    {"a": 0, "b": true, "p": "65000", "s": "0.1", ...},
    {"a": 1, "b": false, "p": "3500", "s": "1.0", ...}
  ]
}
```

### Multiple Cancels
```json
{
  "cancels": [
    {"a": 0, "o": 123456},
    {"a": 1, "o": 789012}
  ]
}
```

## WebSocket Channel Names

Standard channel naming:
- `trades` - Trade feed
- `l2Book` - Order book updates
- `allMids` - All mid prices
- `candle` - Candlestick data
- `userEvents` - User-specific events

## Pagination Parameters

For endpoints supporting pagination:
```json
{
  "type": "userFills",
  "user": "0x...",
  "startTime": 1234567890000,  // Start timestamp
  "endTime": 1234567899999,    // End timestamp
  "limit": 100                  // Max results
}
```

## Special Values

### Reduce Only Flag
- `true`: Order can only reduce position
- `false`: Order can open or increase position

### Cross/Isolated Margin
```json
{
  "isCross": true,   // Cross margin mode
  "leverage": 10     // Leverage value
}
```

## Address Format

All addresses must be:
- **Lowercase** for signing
- **Hex format** with `0x` prefix
- **42 characters** total (0x + 40 hex chars)

Example: `0x1234567890abcdef1234567890abcdef12345678`

## Timestamp Format

All timestamps are in **milliseconds since Unix epoch**:
```javascript
const now = Date.now(); // Current timestamp
const timestamp = 1234567890000; // Specific time
```

## Important Notes

1. **This notation is nonstandard** - May change in future API versions
2. **Always check the meta endpoint** for current asset configurations
3. **Use strings for prices** to avoid floating-point precision issues
4. **Validate against szDecimals** before submitting orders

## Examples

### Complete Order Structure
```json
{
  "a": 0,                    // Asset index (BTC)
  "b": true,                 // Buy side
  "p": "65432.1",           // Price as string
  "s": "0.12345",           // Size as string
  "r": false,               // Not reduce-only
  "t": {                    // Order type
    "limit": {
      "tif": "Gtc"          // Good till canceled
    }
  },
  "c": "myorder123"         // Client order ID
}
```

### Position Response
```json
{
  "coin": "ETH",
  "szi": "10.5",            // Long 10.5 ETH
  "entryPx": "3450.0",      // Entry price
  "positionValue": "36225.0", // Position value in USD
  "unrealizedPnl": "525.0", // Unrealized P&L
  "marginUsed": "3622.5",   // Margin used
  "maxLeverage": 10         // Maximum leverage allowed
}
```