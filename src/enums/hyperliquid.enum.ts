// cf. https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions

export enum HyperliquidWebSocketSubscriptionType {
    // market data
    ALL_MIDS = 'allMids',
    L2_BOOK = 'l2Book',
    TRADES = 'trades',
    CANDLE = 'candle',
    BBO = 'bbo',

    // asset context
    ACTIVE_ASSET_CTX = 'activeAssetCtx',
    ACTIVE_ASSET_DATA = 'activeAssetData',

    // user data
    NOTIFICATION = 'notification',
    WEB_DATA2 = 'webData2',
    ORDER_UPDATES = 'orderUpdates',
    USER_EVENTS = 'userEvents',
    USER_FILLS = 'userFills',
    USER_FUNDINGS = 'userFundings',
    USER_NON_FUNDING_LEDGER_UPDATES = 'userNonFundingLedgerUpdates',
    USER_TWAP_SLICE_FILLS = 'userTwapSliceFills',
    USER_TWAP_HISTORY = 'userTwapHistory',
    USER_HISTORICAL_ORDERS = 'userHistoricalOrders', // undocumented but used by official client
}

// see https://app.hyperliquid.xyz/trade
// > console
// >> network tab
// >>> ws://api-ui.hyperliquid.xyz/ws
// >>>> copy all listed as HAR
// >>>>> ideally we should match
