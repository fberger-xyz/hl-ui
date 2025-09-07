'use client'

import { useState, useCallback } from 'react'
import { useHyperliquidSDK } from '@/hooks/useHyperliquidSDK'
import { HyperliquidOrder } from '@/services/hyperliquid-sdk.service'
import toast from 'react-hot-toast'

export function useHyperliquidTrade() {
    const { sdk, isInitialized } = useHyperliquidSDK()
    const [isPlacingOrder, setIsPlacingOrder] = useState(false)
    const [isCancellingOrder, setIsCancellingOrder] = useState(false)

    const placeOrder = useCallback(
        async (order: HyperliquidOrder) => {
            if (!sdk || !isInitialized) return (toast.error('Please connect your wallet first'), null)

            setIsPlacingOrder(true)
            try {
                const result = await sdk.placeOrder(order)
                toast.success(`Order placed successfully`)
                return result
            } catch (error) {
                console.error('Failed to place order:', error)
                toast.error(error instanceof Error ? error.message : 'Failed to place order')
                return null
            } finally {
                setIsPlacingOrder(false)
            }
        },
        [sdk, isInitialized],
    )

    const cancelOrder = useCallback(
        async (orderId: string, asset: string) => {
            if (!sdk || !isInitialized) return (toast.error('Please connect your wallet first'), null)

            setIsCancellingOrder(true)
            try {
                const result = await sdk.cancelOrder(orderId, asset)
                toast.success('Order cancelled successfully')
                return result
            } catch (error) {
                console.error('Failed to cancel order:', error)
                toast.error('Failed to cancel order')
                return null
            } finally {
                setIsCancellingOrder(false)
            }
        },
        [sdk, isInitialized],
    )

    const cancelAllOrders = useCallback(
        async (asset?: string) => {
            if (!sdk || !isInitialized) return (toast.error('Please connect your wallet first'), null)

            setIsCancellingOrder(true)
            try {
                const result = await sdk.cancelAllOrders(asset)
                toast.success('All orders cancelled successfully')
                return result
            } catch (error) {
                console.error('Failed to cancel all orders:', error)
                toast.error('Failed to cancel all orders')
                return null
            } finally {
                setIsCancellingOrder(false)
            }
        },
        [sdk, isInitialized],
    )

    const placeMarketOrder = useCallback(
        async (asset: string, isBuy: boolean, size: string, reduceOnly: boolean = false) => {
            return placeOrder({
                asset,
                isBuy,
                size,
                isMarket: true,
                reduceOnly,
            })
        },
        [placeOrder],
    )

    const placeLimitOrder = useCallback(
        async (asset: string, isBuy: boolean, size: string, price: string, postOnly: boolean = false, reduceOnly: boolean = false) => {
            return placeOrder({
                asset,
                isBuy,
                size,
                price,
                postOnly,
                reduceOnly,
            })
        },
        [placeOrder],
    )

    return {
        placeOrder,
        placeMarketOrder,
        placeLimitOrder,
        cancelOrder,
        cancelAllOrders,
        isPlacingOrder,
        isCancellingOrder,
        isReady: isInitialized && sdk !== null,
    }
}
