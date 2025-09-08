# Hyperliquid TypeScript/JavaScript Examples

## Installation

```bash
# Using npm
npm install ethers axios ws

# Using pnpm
pnpm add ethers axios ws

# Using yarn
yarn add ethers axios ws
```

## Basic API Client

```typescript
import axios from 'axios';
import { ethers } from 'ethers';

interface HyperliquidConfig {
  baseURL: string;
  wsURL: string;
  privateKey?: string;
}

class HyperliquidClient {
  private config: HyperliquidConfig;
  private wallet?: ethers.Wallet;

  constructor(config: HyperliquidConfig) {
    this.config = config;
    if (config.privateKey) {
      this.wallet = new ethers.Wallet(config.privateKey);
    }
  }

  // Info endpoint - public data
  async info(requestType: string, params: any = {}) {
    const response = await axios.post(`${this.config.baseURL}/info`, {
      type: requestType,
      ...params
    });
    return response.data;
  }

  // Exchange endpoint - authenticated requests
  async exchange(action: any) {
    if (!this.wallet) {
      throw new Error('Private key required for exchange operations');
    }

    const nonce = Date.now();
    const signature = await this.signAction(action, nonce);

    const response = await axios.post(`${this.config.baseURL}/exchange`, {
      action,
      nonce,
      signature
    });
    return response.data;
  }

  private async signAction(action: any, nonce: number): Promise<string> {
    // Simplified signature - implement proper signing based on Python SDK
    const message = JSON.stringify({ action, nonce });
    const messageHash = ethers.keccak256(ethers.toUtf8Bytes(message));
    return await this.wallet!.signMessage(ethers.getBytes(messageHash));
  }
}
```

## Market Data Examples

```typescript
class MarketData {
  private client: HyperliquidClient;

  constructor(client: HyperliquidClient) {
    this.client = client;
  }

  // Get all mid prices
  async getAllMidPrices() {
    return await this.client.info('allMids');
  }

  // Get order book for a coin
  async getOrderBook(coin: string, nSigFigs?: number) {
    return await this.client.info('l2Book', { coin, nSigFigs });
  }

  // Get recent trades
  async getRecentTrades(coin: string) {
    return await this.client.info('trades', { coin });
  }

  // Get candle data
  async getCandles(coin: string, interval: string, startTime?: number, endTime?: number) {
    return await this.client.info('candleSnapshot', {
      coin,
      interval,
      startTime,
      endTime
    });
  }

  // Get funding rate
  async getFundingRate(coin: string) {
    return await this.client.info('fundingHistory', { coin });
  }

  // Get market metadata
  async getMarketMeta() {
    return await this.client.info('meta');
  }
}
```

## Trading Examples

```typescript
interface Order {
  coin: string;
  isBuy: boolean;
  size: string;
  price: string;
  orderType: 'limit' | 'market';
  reduceOnly?: boolean;
  timeInForce?: 'Gtc' | 'Ioc' | 'Alo';
  clientOrderId?: string;
}

class Trading {
  private client: HyperliquidClient;
  private assetMap: Map<string, number> = new Map();

  constructor(client: HyperliquidClient) {
    this.client = client;
    this.loadAssetMap();
  }

  private async loadAssetMap() {
    const meta = await this.client.info('meta');
    meta.universe.forEach((asset: any, index: number) => {
      this.assetMap.set(asset.name, index);
    });
  }

  // Place a single order
  async placeOrder(order: Order) {
    const assetIndex = this.assetMap.get(order.coin);
    if (assetIndex === undefined) {
      throw new Error(`Unknown coin: ${order.coin}`);
    }

    const orderType = order.orderType === 'market' 
      ? { market: {} }
      : { limit: { tif: order.timeInForce || 'Gtc' } };

    const action = {
      type: 'order',
      orders: [{
        a: assetIndex,
        b: order.isBuy,
        p: order.price,
        s: order.size,
        r: order.reduceOnly || false,
        t: orderType,
        c: order.clientOrderId
      }]
    };

    return await this.client.exchange(action);
  }

  // Place multiple orders
  async placeMultipleOrders(orders: Order[]) {
    const orderActions = await Promise.all(orders.map(async order => {
      const assetIndex = this.assetMap.get(order.coin);
      if (assetIndex === undefined) {
        throw new Error(`Unknown coin: ${order.coin}`);
      }

      const orderType = order.orderType === 'market'
        ? { market: {} }
        : { limit: { tif: order.timeInForce || 'Gtc' } };

      return {
        a: assetIndex,
        b: order.isBuy,
        p: order.price,
        s: order.size,
        r: order.reduceOnly || false,
        t: orderType,
        c: order.clientOrderId
      };
    }));

    const action = {
      type: 'order',
      orders: orderActions
    };

    return await this.client.exchange(action);
  }

  // Cancel order by ID
  async cancelOrder(coin: string, orderId: number) {
    const assetIndex = this.assetMap.get(coin);
    if (assetIndex === undefined) {
      throw new Error(`Unknown coin: ${coin}`);
    }

    const action = {
      type: 'cancel',
      cancels: [{
        a: assetIndex,
        o: orderId
      }]
    };

    return await this.client.exchange(action);
  }

  // Cancel order by client order ID
  async cancelByClientOrderId(coin: string, clientOrderId: string) {
    const assetIndex = this.assetMap.get(coin);
    if (assetIndex === undefined) {
      throw new Error(`Unknown coin: ${coin}`);
    }

    const action = {
      type: 'cancelByCloid',
      cancels: [{
        asset: assetIndex,
        cloid: clientOrderId
      }]
    };

    return await this.client.exchange(action);
  }

  // Modify existing order
  async modifyOrder(orderId: number, newOrder: Order) {
    const assetIndex = this.assetMap.get(newOrder.coin);
    if (assetIndex === undefined) {
      throw new Error(`Unknown coin: ${newOrder.coin}`);
    }

    const orderType = newOrder.orderType === 'market'
      ? { market: {} }
      : { limit: { tif: newOrder.timeInForce || 'Gtc' } };

    const action = {
      type: 'modify',
      modifies: [{
        oid: orderId,
        order: {
          a: assetIndex,
          b: newOrder.isBuy,
          p: newOrder.price,
          s: newOrder.size,
          r: newOrder.reduceOnly || false,
          t: orderType,
          c: newOrder.clientOrderId
        }
      }]
    };

    return await this.client.exchange(action);
  }

  // Update leverage
  async updateLeverage(coin: string, leverage: number, isCross: boolean = true) {
    const assetIndex = this.assetMap.get(coin);
    if (assetIndex === undefined) {
      throw new Error(`Unknown coin: ${coin}`);
    }

    const action = {
      type: 'updateLeverage',
      asset: assetIndex,
      isCross,
      leverage
    };

    return await this.client.exchange(action);
  }
}
```

## Account Management

```typescript
class AccountManager {
  private client: HyperliquidClient;

  constructor(client: HyperliquidClient) {
    this.client = client;
  }

  // Get user state
  async getUserState(address: string) {
    return await this.client.info('clearinghouseState', { user: address });
  }

  // Get open orders
  async getOpenOrders(address: string) {
    return await this.client.info('openOrders', { user: address });
  }

  // Get fill history
  async getFillHistory(address: string, startTime?: number) {
    return await this.client.info('userFills', { 
      user: address, 
      startTime,
      aggregateByTime: false 
    });
  }

  // Get funding payments
  async getFundingPayments(address: string, startTime?: number, endTime?: number) {
    return await this.client.info('userFunding', {
      user: address,
      startTime,
      endTime
    });
  }

  // Transfer between spot and perp
  async transferUsd(amount: string, toPerp: boolean) {
    const action = {
      type: 'usdClassTransfer',
      amount,
      toPerp
    };

    return await this.client.exchange(action);
  }

  // Withdraw funds
  async withdraw(destination: string, amount: string) {
    const action = {
      type: 'withdraw3',
      unwrap: false,
      hyperliquidChain: {
        signatureChainId: '0xa4b1',
        destination
      }
    };

    return await this.client.exchange(action);
  }
}
```

## WebSocket Implementation

```typescript
import WebSocket from 'ws';

interface Subscription {
  method: 'subscribe' | 'unsubscribe';
  subscription: any;
}

class HyperliquidWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private subscriptions: Map<string, any> = new Map();
  private handlers: Map<string, (data: any) => void> = new Map();

  constructor(url: string) {
    this.url = url;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      this.ws.on('open', () => {
        console.log('WebSocket connected');
        this.resubscribe();
        resolve();
      });

      this.ws.on('message', (data: Buffer) => {
        this.handleMessage(JSON.parse(data.toString()));
      });

      this.ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      });

      this.ws.on('close', () => {
        console.log('WebSocket disconnected');
        this.reconnect();
      });
    });
  }

  private handleMessage(message: any) {
    const { channel, data } = message;
    const handler = this.handlers.get(channel);
    if (handler) {
      handler(data);
    }
  }

  private reconnect() {
    setTimeout(() => {
      console.log('Reconnecting WebSocket...');
      this.connect();
    }, 5000);
  }

  private resubscribe() {
    for (const subscription of this.subscriptions.values()) {
      this.send({
        method: 'subscribe',
        subscription
      });
    }
  }

  private send(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  // Subscribe to trades
  subscribeTrades(coin: string, handler: (data: any) => void) {
    const subscription = { type: 'trades', coin };
    const channel = `trades:${coin}`;
    
    this.subscriptions.set(channel, subscription);
    this.handlers.set(channel, handler);
    
    this.send({
      method: 'subscribe',
      subscription
    });
  }

  // Subscribe to order book
  subscribeOrderBook(coin: string, handler: (data: any) => void) {
    const subscription = { type: 'l2Book', coin };
    const channel = `l2Book:${coin}`;
    
    this.subscriptions.set(channel, subscription);
    this.handlers.set(channel, handler);
    
    this.send({
      method: 'subscribe',
      subscription
    });
  }

  // Subscribe to all mid prices
  subscribeAllMids(handler: (data: any) => void) {
    const subscription = { type: 'allMids' };
    const channel = 'allMids';
    
    this.subscriptions.set(channel, subscription);
    this.handlers.set(channel, handler);
    
    this.send({
      method: 'subscribe',
      subscription
    });
  }

  // Subscribe to user events
  subscribeUserEvents(user: string, handler: (data: any) => void) {
    const subscription = { type: 'userEvents', user };
    const channel = `userEvents:${user}`;
    
    this.subscriptions.set(channel, subscription);
    this.handlers.set(channel, handler);
    
    this.send({
      method: 'subscribe',
      subscription
    });
  }

  // Unsubscribe from channel
  unsubscribe(channel: string) {
    const subscription = this.subscriptions.get(channel);
    if (subscription) {
      this.send({
        method: 'unsubscribe',
        subscription
      });
      this.subscriptions.delete(channel);
      this.handlers.delete(channel);
    }
  }

  // Close connection
  close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
```

## Complete Trading Bot Example

```typescript
class TradingBot {
  private client: HyperliquidClient;
  private ws: HyperliquidWebSocket;
  private trading: Trading;
  private account: AccountManager;
  private marketData: MarketData;
  private userAddress: string;

  constructor(config: {
    baseURL: string;
    wsURL: string;
    privateKey: string;
    userAddress: string;
  }) {
    this.client = new HyperliquidClient({
      baseURL: config.baseURL,
      wsURL: config.wsURL,
      privateKey: config.privateKey
    });
    
    this.ws = new HyperliquidWebSocket(config.wsURL);
    this.trading = new Trading(this.client);
    this.account = new AccountManager(this.client);
    this.marketData = new MarketData(this.client);
    this.userAddress = config.userAddress;
  }

  async initialize() {
    // Connect WebSocket
    await this.ws.connect();

    // Subscribe to market data
    this.ws.subscribeAllMids((data) => {
      console.log('Mid prices update:', data);
    });

    // Subscribe to user events
    this.ws.subscribeUserEvents(this.userAddress, (data) => {
      console.log('User event:', data);
      this.handleUserEvent(data);
    });

    // Get initial account state
    const accountState = await this.account.getUserState(this.userAddress);
    console.log('Account state:', accountState);
  }

  private handleUserEvent(event: any) {
    // Handle different event types
    switch (event.type) {
      case 'fill':
        console.log('Order filled:', event);
        break;
      case 'order':
        console.log('Order update:', event);
        break;
      case 'position':
        console.log('Position update:', event);
        break;
    }
  }

  // Example strategy: Simple market making
  async startMarketMaking(coin: string, spread: number, size: string) {
    // Get current mid price
    const orderBook = await this.marketData.getOrderBook(coin);
    const bestBid = parseFloat(orderBook.levels[0][0][0]);
    const bestAsk = parseFloat(orderBook.levels[1][0][0]);
    const midPrice = (bestBid + bestAsk) / 2;

    // Place buy and sell orders
    const orders: Order[] = [
      {
        coin,
        isBuy: true,
        size,
        price: (midPrice - spread).toFixed(1),
        orderType: 'limit',
        timeInForce: 'Alo' // Post-only
      },
      {
        coin,
        isBuy: false,
        size,
        price: (midPrice + spread).toFixed(1),
        orderType: 'limit',
        timeInForce: 'Alo' // Post-only
      }
    ];

    const result = await this.trading.placeMultipleOrders(orders);
    console.log('Orders placed:', result);

    // Monitor and adjust orders
    this.ws.subscribeOrderBook(coin, async (data) => {
      // Implement order adjustment logic
      await this.adjustOrders(coin, spread, size);
    });
  }

  private async adjustOrders(coin: string, spread: number, size: string) {
    // Cancel existing orders
    const openOrders = await this.account.getOpenOrders(this.userAddress);
    for (const order of openOrders) {
      if (order.coin === coin) {
        await this.trading.cancelOrder(coin, order.oid);
      }
    }

    // Place new orders at updated prices
    await this.startMarketMaking(coin, spread, size);
  }

  async stop() {
    // Cancel all open orders
    const openOrders = await this.account.getOpenOrders(this.userAddress);
    for (const order of openOrders) {
      await this.trading.cancelOrder(order.coin, order.oid);
    }

    // Close WebSocket
    this.ws.close();
  }
}

// Usage
async function main() {
  const bot = new TradingBot({
    baseURL: 'https://api.hyperliquid.xyz',
    wsURL: 'wss://api.hyperliquid.xyz/ws',
    privateKey: process.env.PRIVATE_KEY!,
    userAddress: process.env.USER_ADDRESS!
  });

  await bot.initialize();
  
  // Start market making on BTC with 0.5% spread
  await bot.startMarketMaking('BTC', 50, '0.001');

  // Run for 1 hour then stop
  setTimeout(async () => {
    await bot.stop();
    process.exit(0);
  }, 3600000);
}

// Run the bot
main().catch(console.error);
```

## Error Handling

```typescript
class ErrorHandler {
  static handle(error: any): void {
    if (error.response) {
      // API error response
      const { status, data } = error.response;
      
      switch (status) {
        case 429:
          console.error('Rate limited. Waiting before retry...');
          break;
        case 400:
          console.error('Bad request:', data.response);
          break;
        case 500:
          console.error('Server error. Retrying...');
          break;
        default:
          console.error('API error:', status, data);
      }
    } else if (error.request) {
      // Network error
      console.error('Network error:', error.message);
    } else {
      // Other errors
      console.error('Error:', error.message);
    }
  }
}

// Usage with retry logic
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      ErrorHandler.handle(error);
      
      if (i === maxRetries - 1) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  throw new Error('Max retries exceeded');
}

// Example usage
const result = await withRetry(() => trading.placeOrder(order));
```

## Environment Setup

```typescript
// .env file
HYPERLIQUID_API_URL=https://api.hyperliquid.xyz
HYPERLIQUID_WS_URL=wss://api.hyperliquid.xyz/ws
PRIVATE_KEY=0x...
USER_ADDRESS=0x...

// config.ts
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  api: {
    baseURL: process.env.HYPERLIQUID_API_URL || 'https://api.hyperliquid.xyz',
    wsURL: process.env.HYPERLIQUID_WS_URL || 'wss://api.hyperliquid.xyz/ws'
  },
  auth: {
    privateKey: process.env.PRIVATE_KEY!,
    userAddress: process.env.USER_ADDRESS!
  },
  trading: {
    maxOrderSize: 1000,
    defaultLeverage: 5,
    riskLimit: 0.02 // 2% per trade
  }
};
```