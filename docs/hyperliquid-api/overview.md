# Hyperliquid API Overview

## Introduction
The Hyperliquid API provides programmatic access to the Hyperliquid decentralized exchange for both perpetual and spot trading.

## Base URLs
- **Mainnet**: `https://api.hyperliquid.xyz`
- **Testnet**: `https://api.hyperliquid-testnet.xyz`

## Available SDKs
- **Python SDK** (Official): [hyperliquid-python-sdk](https://github.com/hyperliquid-dex/hyperliquid-python-sdk)
- **Rust SDK**: Available but less maintained
- **TypeScript SDKs**: Community-maintained versions available
- **CCXT Integration**: Hyperliquid is integrated with CCXT for standardized trading

## Main API Components

### 1. Info Endpoint
Used for retrieving market data, account information, and other read-only operations.

### 2. Exchange Endpoint
Used for executing trades, managing orders, and other write operations that modify account state.

### 3. WebSocket API
Real-time data streaming for:
- Market data updates
- Order updates
- Position changes
- Account updates

## Key Concepts

### Asset IDs
Each tradeable asset has a unique identifier used across the API.

### Tick and Lot Sizes
- **Tick Size**: Minimum price increment for an asset
- **Lot Size**: Minimum quantity increment for trading

### Nonce Management
Required for authenticated requests to prevent replay attacks.

### API Wallet
Separate wallet for API trading with controlled permissions.

## Authentication
- Public endpoints: No authentication required
- Private endpoints: Require signed requests with API credentials

## Rate Limits
The API implements rate limiting to ensure fair usage and system stability.

## Error Handling
Standardized error responses with clear error codes and messages.

## Latency Optimization
Tips and best practices for minimizing latency in trading operations.