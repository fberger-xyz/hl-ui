// see: https://github.com/nktkas/hyperliquid

import * as hl from '@nktkas/hyperliquid'
import { Wallet } from 'ethers'
import type { AssetInfo, HyperliquidOrder, CandleInterval } from '@/types/hyperliquid.types'
import { logger } from '@/utils/logger.util'

export class HyperliquidSDKService {
    private static instance: HyperliquidSDKService
    private transport: hl.HttpTransport
    private infoClient: hl.InfoClient
    private exchangeClient: hl.ExchangeClient | null = null
    private assetIndices: Map<string, number> = new Map()

    // removed: websocket replaces caching

    private constructor() {
        this.transport = new hl.HttpTransport({
            isTestnet: false,
        })
        this.infoClient = new hl.InfoClient({ transport: this.transport })
    }

    static getInstance(): HyperliquidSDKService {
        if (!HyperliquidSDKService.instance) HyperliquidSDKService.instance = new HyperliquidSDKService()
        return HyperliquidSDKService.instance
    }

    async initializeWithSigner(privateKey: string): Promise<void> {
        try {
            const wallet = new Wallet(privateKey)
            this.exchangeClient = new hl.ExchangeClient({
                transport: this.transport,
                wallet,
            })
            await this.loadAssetMetadata()
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to initialize with signer'
            throw new Error(message)
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async initializeWithEthersSigner(signer: any): Promise<void> {
        try {
            this.exchangeClient = new hl.ExchangeClient({
                transport: this.transport,
                wallet: signer,
            })
            await this.loadAssetMetadata()
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to initialize with Ethers signer'
            throw new Error(message)
        }
    }

    private async loadAssetMetadata(): Promise<void> {
        try {
            const [meta] = await this.infoClient.metaAndAssetCtxs()

            // build asset index map
            meta.universe.forEach((asset: AssetInfo, index: number) => {
                this.assetIndices.set(asset.name, index)
            })
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to load asset metadata'
            throw new Error(message)
        }
    }

    getAssetIndex(symbol: string): number {
        const index = this.assetIndices.get(symbol)
        if (index === undefined) throw new Error(`Asset ${symbol} not found`)
        return index
    }

    async getUserState(address: string): Promise<hl.PerpsClearinghouseState | null> {
        try {
            const state = await this.infoClient.clearinghouseState({ user: address as `0x${string}` })
            return state
        } catch (error) {
            logger.error('Failed to get user state:', error)
            return null
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async getOpenOrders(address: string): Promise<any[]> {
        try {
            const orders = await this.infoClient.openOrders({ user: address as `0x${string}` })
            return orders
        } catch (error) {
            logger.error('Failed to get open orders:', error)
            return []
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async getUserFills(address: string): Promise<any[]> {
        try {
            const fills = await this.infoClient.userFills({ user: address as `0x${string}` })
            return fills
        } catch (error) {
            logger.error('Failed to get user fills:', error)
            return []
        }
    }

    // deprecated: use websocket l2Book
    async getOrderbook(symbol: string): Promise<hl.Book> {
        logger.warn('getOrderbook is deprecated - use WebSocket l2Book subscription')
        return {
            coin: symbol,
            levels: [[], []],
            time: Date.now(),
        } as unknown as hl.Book
    }

    // keep: needed for initial chart
    async getCandles(symbol: string, interval: CandleInterval = '1m'): Promise<hl.Candle[]> {
        try {
            const candles = await this.infoClient.candleSnapshot({
                coin: symbol,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                interval: interval as any,
                startTime: Date.now() - 24 * 60 * 60 * 1000, // last 24h
                endTime: Date.now(),
            })
            return candles
        } catch (error) {
            logger.error('Failed to get candles:', error)
            return []
        }
    }

    async placeOrder(order: HyperliquidOrder): Promise<hl.OrderResponse | null> {
        // guard: no exchange client
        if (!this.exchangeClient) throw new Error('Exchange client not initialized. Please connect wallet first.')

        try {
            const assetIndex = this.getAssetIndex(order.asset)

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const hlOrder: any = {
                a: assetIndex,
                b: order.isBuy,
                s: order.size,
                r: order.reduceOnly || false,
                t: order.isMarket
                    ? { trigger: { isMarket: true, triggerPx: '0', tpsl: 'tp' } }
                    : { limit: { tif: order.ioc ? 'Ioc' : order.postOnly ? 'Alo' : 'Gtc' } },
                p: order.price || '0',
            }

            const response = await this.exchangeClient.order({
                orders: [hlOrder],
                grouping: 'na',
            })
            return response
        } catch (error) {
            logger.error('Failed to place order:', error)
            const message = error instanceof Error ? error.message : 'Failed to place order'
            throw new Error(message)
        }
    }

    async cancelOrder(orderId: string, asset: string): Promise<hl.CancelResponse | null> {
        // guard: no exchange client
        if (!this.exchangeClient) throw new Error('Exchange client not initialized')

        try {
            const assetIndex = this.getAssetIndex(asset)
            const response = await this.exchangeClient.cancel({
                cancels: [
                    {
                        a: assetIndex,
                        o: parseInt(orderId),
                    },
                ],
            })
            return response
        } catch (error) {
            logger.error('Failed to cancel order:', error)
            const message = error instanceof Error ? error.message : 'Failed to cancel order'
            throw new Error(message)
        }
    }

    async cancelAllOrders(asset?: string): Promise<hl.CancelResponse | null> {
        // guard: no exchange client
        if (!this.exchangeClient) throw new Error('Exchange client not initialized')

        try {
            if (asset) {
                const assetIndex = this.getAssetIndex(asset)
                // cancel for specific asset
                return await this.exchangeClient.cancel({
                    cancels: [
                        {
                            a: assetIndex,
                            o: 0, // cancel all for this asset
                        },
                    ],
                })
            }
            // cancel all assets
            return await this.exchangeClient.cancel({ cancels: [] })
        } catch (error) {
            logger.error('Failed to cancel all orders:', error)
            const message = error instanceof Error ? error.message : 'Failed to cancel all orders'
            throw new Error(message)
        }
    }

    // deprecated: use websocket webData2
    async getMarkets(): Promise<Array<AssetInfo & { index: number; symbol: string }>> {
        logger.warn('getMarkets is deprecated - use WebSocket webData2 subscription')
        return []
    }

    // deprecated: use websocket allMids
    async getAllMids(): Promise<Record<string, string>> {
        logger.warn('getAllMids is deprecated - use WebSocket allMids subscription')
        return {}
    }

    // deprecated: use websocket webData2
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getUserPortfolio(address: string): Promise<hl.PortfolioPeriods | null> {
        logger.warn('getUserPortfolio is deprecated - use WebSocket webData2 subscription')
        return null
    }

    // fetch historical orders
    async getHistoricalOrders(address: string): Promise<hl.OrderStatus<hl.FrontendOrder>[]> {
        try {
            const orders = await this.infoClient.historicalOrders({ user: address as `0x${string}` })
            return orders
        } catch (error) {
            logger.error('Failed to get historical orders:', error)
            return []
        }
    }

    // fetch historical funding
    async getUserFunding(address: string, startTime?: number, endTime?: number): Promise<hl.UserFundingUpdate[]> {
        try {
            const params: hl.UserFundingParameters = {
                user: address as `0x${string}`,
                startTime: startTime ?? 0,
                endTime: endTime ?? Date.now(),
            }
            const funding = await this.infoClient.userFunding(params)
            return funding
        } catch (error) {
            logger.error('Failed to get user funding:', error)
            return []
        }
    }

    // deprecated: use websocket twapHistory
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getTwapHistory(address: string): Promise<hl.TwapHistory[]> {
        logger.warn('getTwapHistory is deprecated - use WebSocket twapHistory subscription')
        return []
    }

    // deprecated: use websocket twapSliceFills
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getUserTwapSliceFills(address: string): Promise<hl.TwapSliceFill[]> {
        logger.warn('getUserTwapSliceFills is deprecated - use WebSocket twapSliceFills subscription')
        return []
    }

    // deprecated: use websocket userFills
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getUserFillsByTime(address: string, startTime?: number, endTime?: number): Promise<unknown[]> {
        logger.warn('getUserFillsByTime is deprecated - use WebSocket userFills subscription')
        return []
    }

    async getUserNonFundingLedgerUpdates(address: string, startTime?: number, endTime?: number): Promise<hl.UserNonFundingLedgerUpdate[]> {
        try {
            const params: hl.UserNonFundingLedgerUpdatesParameters = {
                user: address as `0x${string}`,
                startTime: startTime ?? 0,
                endTime: endTime ?? Date.now(),
            }
            const updates = await this.infoClient.userNonFundingLedgerUpdates(params)
            return updates
        } catch (error) {
            logger.error('Failed to get non-funding ledger updates:', error)
            return []
        }
    }

    isConnected(): boolean {
        return this.exchangeClient !== null
    }
}
