## WIP

- tentative to reproduce Hyperliquid UI from scratch using Next.js / tailwind
- dropdown to selected assets ticker
- live prices for selected ticker w/ TradingView chart
- live order book
- user feeds
- v basic responsive UI
- deployed on vercel
- websockets with shared worker to use only one ws across multiple tabs
- many error boundaries
- pwa support (add to screen / dock from gchrome or safari)
- zustand persist cache for instant data display on page refresh

## todo

- simplify light/dark/any themes
- agent registration
- market orders

## Current data flow

- WebSocket messages throttled to 30fps (orderbook) and 10fps (trades) to reduce CPU usage
- Cached data shown instantly on page load while fresh data fetches in background
- LocalStorage persists last 5-10min of market data via Zustand middleware
- SharedWorker maintains single WebSocket connection across all browser tabs

## VS Code Extensions

See [recommended-extensions.png](./recommended-extensions.png) for suggested VS Code / Cursor extensions.
