# Hyperliquid API Authentication & Signing

## Overview
All Exchange endpoint requests require cryptographic signatures for authentication. The signing process is complex and error-prone, so using an official SDK is strongly recommended.

## Python SDK

### Installation
```bash
pip install hyperliquid-python-sdk
```

### Basic Setup
```python
from hyperliquid.info import Info
from hyperliquid.exchange import Exchange
from hyperliquid.utils import constants
import eth_account

# Initialize with private key
account = eth_account.Account.from_key("0x...")
info = Info(constants.MAINNET_API_URL, skip_ws=True)
exchange = Exchange(account, constants.MAINNET_API_URL)
```

### Example Operations

#### Place Order
```python
order = {
    "coin": "BTC",
    "is_buy": True,
    "sz": 0.1,
    "limit_px": 65000,
    "order_type": {"limit": {"tif": "Gtc"}},
    "reduce_only": False
}
result = exchange.order(order["coin"], order["is_buy"], order["sz"], 
                        order["limit_px"], order["order_type"], 
                        reduce_only=order["reduce_only"])
```

#### Cancel Order
```python
cancel_result = exchange.cancel(coin="BTC", oid=123456)
```

#### Get Account Info
```python
user_state = info.user_state(account.address)
open_orders = info.open_orders(account.address)
```

## Signing Schemes

### Two Types of Signatures

1. **L1 Action Signing** (`sign_l1_action`)
   - Used for most exchange operations
   - Signs the action payload directly

2. **User Signed Action** (`sign_user_signed_action`)
   - Used for specific operations requiring user signature
   - Additional wrapper around the action

## Common Pitfalls & Solutions

### 1. Field Order in Msgpack
The order of fields in msgpack encoding matters. Always follow the exact field order as in the SDK.

**Wrong:**
```python
action = {
    "orders": [...],
    "type": "order",  # Wrong order!
}
```

**Correct:**
```python
action = {
    "type": "order",  # Type must come first
    "orders": [...]
}
```

### 2. Trailing Zeroes on Numbers
Numbers should not have unnecessary trailing zeroes.

**Wrong:**
```python
"limit_px": 65000.00  # Trailing zeroes
```

**Correct:**
```python
"limit_px": 65000  # Or "65000" as string
```

### 3. Address Case Sensitivity
Addresses must be lowercase before signing.

**Wrong:**
```python
address = "0xABC123..."  # Mixed case
```

**Correct:**
```python
address = "0xabc123...".lower()  # All lowercase
```

### 4. Nonce Management
```python
import time

# Use current timestamp in milliseconds
nonce = int(time.time() * 1000)
```

### 5. Signature Verification
If you get errors like:
- `"L1 error: User or API Wallet 0x... does not exist."`
- `"Must deposit before performing actions."`

This usually means the signature is incorrect, causing a different address to be recovered.

## TypeScript/JavaScript Implementation

For TypeScript implementations, refer to community SDKs that handle signing correctly:
- Check the signature generation matches Python SDK exactly
- Use the same cryptographic libraries (ethers.js or web3.js)
- Ensure msgpack encoding matches Python implementation

## Debugging Tips

### 1. Enable Logging
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### 2. Verify Signature Components
```python
# Log each component before signing
print(f"Action: {action}")
print(f"Nonce: {nonce}")
print(f"Vault Address: {vault_address}")
```

### 3. Compare with SDK
Always compare your implementation with the official SDK:
```python
# SDK source: https://github.com/hyperliquid-dex/hyperliquid-python-sdk
```

### 4. Test on Testnet First
```python
from hyperliquid.utils import constants

# Use testnet for testing
info = Info(constants.TESTNET_API_URL, skip_ws=True)
exchange = Exchange(account, constants.TESTNET_API_URL)
```

## Best Practices

1. **Use Official SDKs**
   - Python SDK is most reliable
   - Community TypeScript SDKs available
   - Avoid manual signature implementation

2. **Handle Errors Gracefully**
   ```python
   try:
       result = exchange.order(...)
       if result["status"] == "err":
           print(f"Error: {result['response']}")
   except Exception as e:
       print(f"Exception: {e}")
   ```

3. **Secure Key Management**
   - Never hardcode private keys
   - Use environment variables
   - Consider hardware wallets for production

4. **Rate Limiting**
   - Implement proper delays between requests
   - Handle rate limit errors with exponential backoff

## SDK References

### Python SDK
- Repository: [hyperliquid-python-sdk](https://github.com/hyperliquid-dex/hyperliquid-python-sdk)
- Key files:
  - `hyperliquid/exchange.py` - Exchange operations
  - `hyperliquid/info.py` - Info endpoint queries
  - `hyperliquid/utils/signing.py` - Signature generation
  - `hyperliquid/utils/types.py` - Type definitions

### Integration Examples
```python
# Complete trading bot example
from hyperliquid.info import Info
from hyperliquid.exchange import Exchange
from hyperliquid.utils import constants
import eth_account
import time

class TradingBot:
    def __init__(self, private_key):
        self.account = eth_account.Account.from_key(private_key)
        self.info = Info(constants.MAINNET_API_URL)
        self.exchange = Exchange(self.account, constants.MAINNET_API_URL)
    
    def place_limit_order(self, coin, is_buy, size, price):
        return self.exchange.order(
            coin, is_buy, size, price,
            {"limit": {"tif": "Gtc"}},
            reduce_only=False
        )
    
    def get_open_orders(self):
        return self.info.open_orders(self.account.address)
    
    def cancel_all_orders(self):
        orders = self.get_open_orders()
        for order in orders:
            self.exchange.cancel(order["coin"], order["oid"])
            time.sleep(0.1)  # Rate limiting
```