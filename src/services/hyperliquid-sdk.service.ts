// note: have a look to https://github.com/nktkas/hyperliquid

import * as hl from '@nktkas/hyperliquid'
import { Wallet } from 'ethers'
import type { AssetInfo, HyperliquidOrder } from '@/types/hyperliquid.types'

export class HyperliquidSDKService {
    private static instance: HyperliquidSDKService
    private transport: hl.HttpTransport
    private infoClient: hl.InfoClient
    private exchangeClient: hl.ExchangeClient | null = null
    private assetIndices: Map<string, number> = new Map()

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

    async getUserState(address: string): Promise<unknown | null> {
        try {
            return await this.infoClient.clearinghouseState({ user: address as `0x${string}` })
        } catch {
            // console.error(error)
            return null
        }
    }

    async getOpenOrders(address: string): Promise<unknown[]> {
        try {
            return await this.infoClient.openOrders({ user: address as `0x${string}` })
        } catch {
            // console.error(error)
            return []
        }
    }

    async getUserFills(address: string): Promise<unknown[]> {
        try {
            return await this.infoClient.userFills({ user: address as `0x${string}` })
        } catch {
            // console.error(error)
            return []
        }
    }

    async getOrderbook(symbol: string): Promise<unknown> {
        try {
            return await this.infoClient.l2Book({ coin: symbol })
        } catch {
            // console.error(error)
            return { coin: symbol, levels: [[], []], time: Date.now() }
        }
    }

    async getCandles(symbol: string, interval: string = '1m'): Promise<unknown[]> {
        try {
            return await this.infoClient.candleSnapshot({
                coin: symbol,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                interval: interval as any,
                startTime: Date.now() - 24 * 60 * 60 * 1000, // last 24h
                endTime: Date.now(),
            })
        } catch {
            // console.error(error)
            return []
        }
    }

    async placeOrder(order: HyperliquidOrder): Promise<unknown> {
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

            return await this.exchangeClient.order({
                orders: [hlOrder],
                grouping: 'na',
            })
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to place order'
            throw new Error(message)
        }
    }

    async cancelOrder(orderId: string, asset: string): Promise<unknown> {
        // guard: no exchange client
        if (!this.exchangeClient) throw new Error('Exchange client not initialized')

        try {
            const assetIndex = this.getAssetIndex(asset)
            return await this.exchangeClient.cancel({
                cancels: [
                    {
                        a: assetIndex,
                        o: parseInt(orderId),
                    },
                ],
            })
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to cancel order'
            throw new Error(message)
        }
    }

    async cancelAllOrders(asset?: string): Promise<unknown> {
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
            const message = error instanceof Error ? error.message : 'Failed to cancel all orders'
            throw new Error(message)
        }
    }

    async getMarkets(): Promise<Array<AssetInfo & { index: number; symbol: string }>> {
        try {
            const meta = await this.infoClient.meta()
            return meta.universe.map((asset: AssetInfo, index: number) => ({
                ...asset,
                index,
                symbol: asset.name,
            }))
        } catch {
            // console.error(error)
            return []
        }
    }

    async getAllMids(): Promise<Record<string, string>> {
        try {
            return await this.infoClient.allMids()
        } catch {
            // console.error(error)
            return {}
        }
    }

    async getUserPortfolio(address: string): Promise<unknown | null> {
        try {
            return await this.infoClient.portfolio({ user: address as `0x${string}` })
        } catch {
            // console.error(error)
            return null
        }
    }

    async getHistoricalOrders(address: string): Promise<unknown[]> {
        try {
            return await this.infoClient.historicalOrders({ user: address as `0x${string}` })
        } catch {
            // console.error(error)
            return []
        }
    }

    async getUserFunding(address: string, startTime?: number, endTime?: number): Promise<unknown[]> {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const params: any = { user: address as `0x${string}` }
            if (startTime !== undefined) params.startTime = startTime
            if (endTime !== undefined) params.endTime = endTime
            return await this.infoClient.userFunding(params)
        } catch {
            // console.error(error)
            return []
        }
    }

    async getTwapHistory(address: string): Promise<unknown[]> {
        try {
            return await this.infoClient.twapHistory({ user: address as `0x${string}` })
        } catch {
            // console.error(error)
            return []
        }
    }

    async getUserTwapSliceFills(address: string): Promise<unknown[]> {
        try {
            return await this.infoClient.userTwapSliceFills({ user: address as `0x${string}` })
        } catch {
            // console.error(error)
            return []
        }
    }

    async getUserFillsByTime(address: string, startTime?: number, endTime?: number): Promise<unknown[]> {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const params: any = { user: address as `0x${string}` }
            if (startTime !== undefined) params.startTime = startTime
            if (endTime !== undefined) params.endTime = endTime
            return await this.infoClient.userFillsByTime(params)
        } catch {
            // console.error(error)
            return []
        }
    }

    async getUserNonFundingLedgerUpdates(address: string, startTime?: number, endTime?: number): Promise<unknown[]> {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const params: any = { user: address as `0x${string}` }
            if (startTime !== undefined) params.startTime = startTime
            if (endTime !== undefined) params.endTime = endTime
            return await this.infoClient.userNonFundingLedgerUpdates(params)
        } catch {
            // console.error(error)
            return []
        }
    }

    isConnected(): boolean {
        return this.exchangeClient !== null
    }
}
