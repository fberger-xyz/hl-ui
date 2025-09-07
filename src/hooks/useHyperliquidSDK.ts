'use client'

import { useEffect, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useWalletClient } from 'wagmi'
import { HyperliquidSDKService } from '@/services/hyperliquid-sdk.service'
import { BrowserProvider } from 'ethers'

export function useHyperliquidSDK() {
    const [sdk, setSdk] = useState<HyperliquidSDKService | null>(null)
    const [isInitialized, setIsInitialized] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const { authenticated, user } = usePrivy()
    const { data: walletClient } = useWalletClient()

    useEffect(() => {
        const initializeSDK = async () => {
            setIsLoading(true)
            setError(null)

            try {
                // Always initialize SDK instance for read-only operations
                const sdkInstance = HyperliquidSDKService.getInstance()

                // If we have wallet client, initialize with signer for write operations
                if (authenticated && walletClient) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const provider = new BrowserProvider(walletClient as any)
                    const signer = await provider.getSigner()
                    await sdkInstance.initializeWithEthersSigner(signer)
                } else {
                }

                setSdk(sdkInstance)
                setIsInitialized(true)
            } catch (err) {
                console.error('Failed to initialize Hyperliquid SDK:', err)
                setError(err instanceof Error ? err.message : 'Failed to initialize SDK')
                setIsInitialized(false)
                setSdk(null)
            } finally {
                setIsLoading(false)
            }
        }

        initializeSDK()
    }, [authenticated, walletClient, user])

    return {
        sdk,
        isInitialized,
        isLoading,
        error,
    }
}

export function useHyperliquidUserData(address?: string) {
    const { sdk, isInitialized } = useHyperliquidSDK()
    const [userState, setUserState] = useState<unknown | null>(null)
    const [openOrders, setOpenOrders] = useState<unknown[]>([])
    const [fills, setFills] = useState<unknown[]>([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        // guard: missing deps
        if (!sdk || !isInitialized || !address) return

        const fetchUserData = async () => {
            setIsLoading(true)
            try {
                const [state, orders, userFills] = await Promise.all([
                    sdk.getUserState(address),
                    sdk.getOpenOrders(address),
                    sdk.getUserFills(address),
                ])

                setUserState(state)
                setOpenOrders(orders)
                setFills(userFills)
            } catch (error) {
                console.error('Failed to fetch user data:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchUserData()

        // refresh every 5 seconds
        const interval = setInterval(fetchUserData, 5000)
        return () => clearInterval(interval)
    }, [sdk, isInitialized, address])

    return {
        userState,
        openOrders,
        fills,
        isLoading,
    }
}
