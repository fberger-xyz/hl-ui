# Hyperliquid API Rate Limits

## Overview
Hyperliquid implements multiple rate limiting mechanisms to ensure fair usage and system stability. Rate limits are applied at both IP and address levels.

## IP-Based Rate Limits

### REST API Limits
- **Aggregate Weight Limit**: 1200 per minute
- Weight is calculated based on request type and complexity

### Weight Calculations

#### Exchange Endpoint
```
Weight = 1 + floor(batch_length / 40)
```
Examples:
- Single order: Weight = 1
- 40 orders in batch: Weight = 2
- 80 orders in batch: Weight = 3

#### Info Endpoint Weights
- **Weight 2**: 
  - `l2Book` - Order book data
  - `allMids` - All mid prices
  - `clearinghouseState` - Account state
  - `orderStatus` - Order status query
  
- **Weight 20**: Most other info requests
  - `openOrders`
  - `userFills`
  - `portfolio`
  - `candleSnapshot`
  
- **Weight 60**: 
  - `userRole` - User role information

### WebSocket Limits
- **Max Connections**: 100 per IP
- **Max Subscriptions**: 1000 total
- **Max Unique Users**: 10 across user-specific subscriptions
- **Max Messages**: 2000 per minute
- **Max Inflight Posts**: 100 simultaneous

## Address-Based Rate Limits

### Request Allocation
```
Available Requests = 10000 + (Total USDC Volume)
```
- Initial buffer: 10,000 requests
- Additional requests: 1 per 1 USDC traded cumulatively
- When exhausted: 1 request allowed every 10 seconds

### Open Order Limits
```
Max Open Orders = min(1000 + (Volume / 5,000,000), 5000)
```
- Base limit: 1,000 orders
- Additional: 1 order per 5M USDC volume
- Maximum: 5,000 orders

## EVM RPC Limits
- **Endpoint**: `rpc.hyperliquid.xyz/evm`
- **Limit**: 100 requests per minute

## Rate Limit Headers

Response headers indicate rate limit status:
```
X-RateLimit-Limit: 1200
X-RateLimit-Remaining: 1150
X-RateLimit-Reset: 1234567890
```

## Error Responses

### Rate Limit Exceeded
```json
{
  "status": "err",
  "response": "Rate limit exceeded",
  "code": 429
}
```

### Address Rate Limited
```json
{
  "status": "err",
  "response": "Address rate limited. Please wait 10 seconds"
}
```

## Best Practices

### 1. Use WebSockets for Real-time Data
```javascript
// Prefer WebSocket for market data
ws.subscribe({ type: "l2Book", coin: "BTC" })

// Instead of polling REST API
// ❌ setInterval(() => fetch("/info", { type: "l2Book" }), 1000)
```

### 2. Batch Operations
```python
# ✅ Good: Single request with multiple orders
orders = [
    {"coin": "BTC", "sz": 0.1, "px": 65000, ...},
    {"coin": "ETH", "sz": 1.0, "px": 3500, ...}
]
exchange.bulk_order(orders)

# ❌ Bad: Multiple individual requests
for order in orders:
    exchange.order(order)  # Multiple requests
```

### 3. Implement Exponential Backoff
```python
import time
import random

def make_request_with_retry(func, *args, max_retries=5):
    for attempt in range(max_retries):
        try:
            result = func(*args)
            if result.get("status") != "err":
                return result
        except Exception as e:
            pass
        
        # Exponential backoff with jitter
        wait_time = (2 ** attempt) + random.uniform(0, 1)
        time.sleep(wait_time)
    
    raise Exception("Max retries exceeded")
```

### 4. Cache Static Data
```python
# Cache relatively static data
meta_cache = {}
cache_timestamp = 0
CACHE_DURATION = 3600  # 1 hour

def get_meta():
    global meta_cache, cache_timestamp
    current_time = time.time()
    
    if current_time - cache_timestamp < CACHE_DURATION:
        return meta_cache
    
    meta_cache = info.meta()
    cache_timestamp = current_time
    return meta_cache
```

### 5. Monitor Rate Limit Usage
```python
class RateLimitMonitor:
    def __init__(self):
        self.requests = []
        self.window_size = 60  # 1 minute
    
    def add_request(self, weight=1):
        current_time = time.time()
        self.requests.append((current_time, weight))
        self.cleanup()
    
    def cleanup(self):
        current_time = time.time()
        self.requests = [
            (t, w) for t, w in self.requests 
            if current_time - t < self.window_size
        ]
    
    def get_current_weight(self):
        self.cleanup()
        return sum(w for _, w in self.requests)
    
    def can_make_request(self, weight=1):
        return self.get_current_weight() + weight <= 1200
```

### 6. Optimize Request Weights
```python
# Use appropriate endpoints for your needs
# ✅ Light weight request for mid prices
all_mids = info.all_mids()  # Weight: 2

# ❌ Heavy weight request if you only need mid prices
for coin in coins:
    book = info.l2_book(coin)  # Weight: 2 per request
    mid = (book["bids"][0][0] + book["asks"][0][0]) / 2
```

## Rate Limit Strategies

### For High-Frequency Trading
1. Use WebSocket for all market data
2. Batch order operations
3. Cache account state locally
4. Update local state with WebSocket events

### For Portfolio Management
1. Use longer polling intervals
2. Cache relatively static data
3. Batch info requests when possible
4. Subscribe to user events via WebSocket

### For Market Making
1. WebSocket for order book updates
2. Batch order modifications
3. Local order tracking
4. Efficient cancellation strategies

## Monitoring and Alerts

```python
def check_rate_limit_status():
    try:
        # Make a lightweight request
        response = info.user_rate_limit(address)
        
        if response["remaining"] < 100:
            send_alert(f"Low rate limit: {response['remaining']} requests remaining")
        
        return response
    except Exception as e:
        send_alert(f"Rate limit check failed: {e}")
        return None
```

## Recovery from Rate Limiting

```python
class RateLimitRecovery:
    def __init__(self):
        self.rate_limited_until = 0
    
    def handle_rate_limit(self, error):
        if "rate limit" in str(error).lower():
            # Address-based: wait 10 seconds
            if "address" in str(error).lower():
                self.rate_limited_until = time.time() + 10
            # IP-based: wait until next minute
            else:
                self.rate_limited_until = time.time() + 60
    
    def can_request(self):
        return time.time() > self.rate_limited_until
    
    def wait_if_needed(self):
        if not self.can_request():
            wait_time = self.rate_limited_until - time.time()
            time.sleep(wait_time)
```