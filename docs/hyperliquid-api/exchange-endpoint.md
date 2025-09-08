# Hyperliquid Exchange Endpoint

## Overview
The Exchange endpoint is used for all write operations that modify account state, including trading, transfers, and account management.

**Endpoint**: `POST https://api.hyperliquid.xyz/exchange`

## Authentication

All Exchange endpoint requests require:
- **Signature**: Cryptographic signature of the request
- **Nonce**: Unique value (recommended: current timestamp in milliseconds)

### Request Format
```json
{
  "action": {
    "type": "actionType",
    // Action-specific parameters
  },
  "nonce": 1234567890000,
  "signature": "0x...",
  "vaultAddress": "0x..." // Optional, for vault/subaccount operations
}
```

## Order Management Actions

### Place Order
```json
{
  "type": "order",
  "orders": [{
    "a": 0, // Asset index
    "b": true, // Is buy
    "p": "30000", // Price
    "s": "0.1", // Size
    "r": false, // Reduce only
    "t": {
      "limit": {
        "tif": "Gtc" // Good till canceled | Ioc | Alo
      }
    },
    "c": "client123" // Optional client order ID
  }]
}
```

### Cancel Order
```json
{
  "type": "cancel",
  "cancels": [{
    "a": 0, // Asset index
    "o": 123456 // Order ID
  }]
}
```

### Cancel by Client Order ID
```json
{
  "type": "cancelByCloid",
  "cancels": [{
    "asset": 0,
    "cloid": "client123"
  }]
}
```

### Modify Order
```json
{
  "type": "modify",
  "modifies": [{
    "oid": 123456,
    "order": {
      "a": 0,
      "b": true,
      "p": "31000", // New price
      "s": "0.15", // New size
      "r": false,
      "t": {"limit": {"tif": "Gtc"}},
      "c": "client123"
    }
  }]
}
```

### Batch Modify Orders
```json
{
  "type": "batchModify",
  "modifies": [
    // Array of modify operations
  ]
}
```

## Advanced Order Types

### TWAP Order
```json
{
  "type": "twapOrder",
  "twap": {
    "a": 0,
    "b": true,
    "s": "1.0",
    "r": false,
    "m": 10, // Number of slices
    "t": 3600 // Duration in seconds
  }
}
```

### Cancel TWAP
```json
{
  "type": "twapCancel",
  "a": 0,
  "t": 123456789 // TWAP ID
}
```

## Position Management

### Update Leverage
```json
{
  "type": "updateLeverage",
  "asset": 0,
  "isCross": true,
  "leverage": 5
}
```

### Update Isolated Margin
```json
{
  "type": "updateIsolatedMargin",
  "asset": 0,
  "isBuy": true,
  "ntli": 1000 // Dollar amount
}
```

## Transfers

### USD Transfer (Spot ↔ Perp)
```json
{
  "type": "usdClassTransfer",
  "amount": "1000",
  "toPerp": true // true: spot→perp, false: perp→spot
}
```

### Spot Transfer
```json
{
  "type": "spotUser",
  "classTransfer": {
    "usdc": "100",
    "toPerp": false
  }
}
```

### Withdraw
```json
{
  "type": "withdraw3",
  "unwrap": false, // Convert to USDC
  "hyperliquidChain": {
    "signatureChainId": "0xa4b1",
    "destination": "0x..." // Destination address
  }
}
```

## Vault Operations

### Vault Transfer
```json
{
  "type": "vaultTransfer",
  "vaultAddress": "0x...",
  "isDeposit": true,
  "usd": 1000
}
```

### Approve API Wallet
```json
{
  "type": "approveAgent",
  "hyperliquidChain": {
    "agentAddress": "0x...",
    "agentName": "My Trading Bot",
    "nonce": 123456789
  }
}
```

## Staking Operations

### Deposit to Staking
```json
{
  "type": "spotUser",
  "classTransfer": {
    "hyperliquidChain": {
      "signatureChainId": "0xa4b1",
      "amount": "1000"
    }
  }
}
```

### Delegate Stake
```json
{
  "type": "delegate",
  "hyperliquidChain": {
    "signatureChainId": "0xa4b1",
    "validator": "0x...",
    "amount": "500"
  }
}
```

### Undelegate Stake
```json
{
  "type": "undelegate",
  "hyperliquidChain": {
    "signatureChainId": "0xa4b1",
    "validator": "0x...",
    "amount": "500"
  }
}
```

## Response Format

### Success Response
```json
{
  "status": "ok",
  "response": {
    "type": "order",
    "data": {
      "statuses": ["success"]
    }
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

## Builder Fees

Add builder fee to support specific frontends:
```json
{
  "action": {
    "type": "order",
    // Order details
  },
  "nonce": 1234567890000,
  "signature": "0x...",
  "builderId": "0x..." // Builder address for fee sharing
}
```

## Best Practices

1. **Nonce Management**
   - Use current timestamp in milliseconds
   - Ensure uniqueness for each request
   - Avoid nonce reuse

2. **Error Handling**
   - Check response status
   - Handle rate limit errors
   - Implement retry logic with backoff

3. **Order Management**
   - Use client order IDs for tracking
   - Implement order status polling
   - Handle partial fills

4. **Security**
   - Never expose private keys
   - Use secure signature generation
   - Validate all responses