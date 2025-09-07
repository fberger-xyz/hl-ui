// note: have a look to https://github.com/nktkas/hyperliquid

/* eslint-disable @typescript-eslint/no-explicit-any */

import * as hl from '@nktkas/hyperliquid'
import { Wallet } from 'ethers'

export interface HyperliquidOrder {
    asset: string
    isBuy: boolean
    size: string
    price?: string
    isMarket?: boolean
    reduceOnly?: boolean
    postOnly?: boolean
    ioc?: boolean
}

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
            console.error(error)
            throw error
        }
    }

    async initializeWithEthersSigner(signer: any): Promise<void> {
        try {
            this.exchangeClient = new hl.ExchangeClient({
                transport: this.transport,
                wallet: signer,
            })
            await this.loadAssetMetadata()
        } catch (error) {
            console.error(error)
            throw error
        }
    }

    private async loadAssetMetadata(): Promise<void> {
        try {
            const [meta] = await this.infoClient.metaAndAssetCtxs()

            // build asset index map
            meta.universe.forEach((asset: any, index: number) => {
                this.assetIndices.set(asset.name, index)
            })
        } catch (error) {
            console.error(error)
            throw error
        }
    }

    getAssetIndex(symbol: string): number {
        const index = this.assetIndices.get(symbol)
        if (index === undefined) throw new Error(`Asset ${symbol} not found`)
        return index
    }

    async getUserState(address: string): Promise<any | null> {
        try {
            return await this.infoClient.clearinghouseState({ user: address as `0x${string}` })
        } catch (error) {
            console.error(error)
            return null
        }
    }

    async getOpenOrders(address: string): Promise<any[]> {
        try {
            return await this.infoClient.openOrders({ user: address as `0x${string}` })
        } catch (error) {
            console.error(error)
            return []
        }
    }

    async getUserFills(address: string): Promise<any[]> {
        try {
            return await this.infoClient.userFills({ user: address as `0x${string}` })
        } catch (error) {
            console.error(error)
            return []
        }
    }

    async getOrderbook(symbol: string): Promise<any> {
        try {
            return await this.infoClient.l2Book({ coin: symbol })
        } catch (error) {
            console.error(error)
            return { levels: [[], []] }
        }
    }

    async getCandles(symbol: string, interval: string = '1m'): Promise<any[]> {
        try {
            return await this.infoClient.candleSnapshot({
                coin: symbol,
                interval: interval as any,
                startTime: Date.now() - 24 * 60 * 60 * 1000, // last 24h
                endTime: Date.now(),
            })
        } catch (error) {
            console.error(error)
            return []
        }
    }

    async placeOrder(order: HyperliquidOrder): Promise<any> {
        // guard: no exchange client
        if (!this.exchangeClient) throw new Error('Exchange client not initialized. Please connect wallet first.')

        try {
            const assetIndex = this.getAssetIndex(order.asset)

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
            console.error(error)
            throw error
        }
    }

    async cancelOrder(orderId: string, asset: string): Promise<any> {
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
            console.error(error)
            throw error
        }
    }

    async cancelAllOrders(asset?: string): Promise<any> {
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
            console.error(error)
            throw error
        }
    }

    async getMarkets(): Promise<Array<any & { index: number; symbol: string }>> {
        try {
            const meta = await this.infoClient.meta()
            return meta.universe.map((asset: any, index: number) => ({
                ...asset,
                index,
                symbol: asset.name,
            }))
        } catch (error) {
            console.error(error)
            return []
        }
    }

    async getAllMids(): Promise<Record<string, string>> {
        try {
            return await this.infoClient.allMids()
        } catch (error) {
            console.error(error)
            return {}
        }
    }

    async getUserPortfolio(address: string): Promise<any | null> {
        try {
            return await this.infoClient.portfolio({ user: address as `0x${string}` })
        } catch (error) {
            console.error(error)
            return null
        }
    }

    async getHistoricalOrders(address: string): Promise<any[]> {
        try {
            return await this.infoClient.historicalOrders({ user: address as `0x${string}` })
        } catch (error) {
            console.error(error)
            return []
        }
    }

    async getUserFunding(address: string, startTime?: number, endTime?: number): Promise<any[]> {
        try {
            const params: any = { user: address as `0x${string}` }
            if (startTime !== undefined) params.startTime = startTime
            if (endTime !== undefined) params.endTime = endTime
            return await this.infoClient.userFunding(params)
        } catch (error) {
            console.error(error)
            return []
        }
    }

    async getTwapHistory(address: string): Promise<any[]> {
        try {
            return await this.infoClient.twapHistory({ user: address as `0x${string}` })
        } catch (error) {
            console.error(error)
            return []
        }
    }

    async getUserTwapSliceFills(address: string): Promise<any[]> {
        try {
            return await this.infoClient.userTwapSliceFills({ user: address as `0x${string}` })
        } catch (error) {
            console.error(error)
            return []
        }
    }

    async getUserFillsByTime(address: string, startTime?: number, endTime?: number): Promise<any[]> {
        try {
            const params: any = { user: address as `0x${string}` }
            if (startTime !== undefined) params.startTime = startTime
            if (endTime !== undefined) params.endTime = endTime
            return await this.infoClient.userFillsByTime(params)
        } catch (error) {
            console.error(error)
            return []
        }
    }

    async getUserNonFundingLedgerUpdates(address: string, startTime?: number, endTime?: number): Promise<any[]> {
        try {
            const params: any = { user: address as `0x${string}` }
            if (startTime !== undefined) params.startTime = startTime
            if (endTime !== undefined) params.endTime = endTime
            return await this.infoClient.userNonFundingLedgerUpdates(params)
        } catch (error) {
            console.error(error)
            return []
        }
    }

    isConnected(): boolean {
        return this.exchangeClient !== null
    }
}
