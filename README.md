## done

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

## todo/wip

- simplify light/dark/any themes
- rethink hooks verbosity
- agent registration
- market orders
- might use https://playwright.dev/ to avoid testing manually

## notes on current data flow

- webSocket messages throttled to 30fps (orderbook) and 10fps (trades)
- cached data shown on page load while fresh data fetches in background
- localStorage persists market data via Zustand middleware
- shared worker maintains single WebSocket connection across browser tabs

## vs code / cursor extensions

See [recommended-extensions.png](./recommended-extensions.png) for suggested VS Code / Cursor extensions.
