'use client'

import { useEffect, useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useWalletClient, useAccount } from 'wagmi'
import { HyperliquidSDKService } from '@/services/hyperliquid-sdk.service'
import { BrowserProvider } from 'ethers'

export function useHyperliquidSDK() {
    const [sdk, setSdk] = useState<HyperliquidSDKService | null>(null)
    const [isInitialized, setIsInitialized] = useState(false)
    const [hasWalletConnected, setHasWalletConnected] = useState(false) // wallet connection status
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const { authenticated, user } = usePrivy()
    const { wallets: privyWallets } = useWallets()
    const { data: walletClient, isLoading: isWalletLoading } = useWalletClient()

    // also check wagmi account status
    const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount()

    // get address from privy wallets
    const privyAddress = privyWallets[0]?.address

    useEffect(() => {
        // skip if wallet is still loading
        if (isWalletLoading) return

        const initializeSDK = async () => {
            setIsLoading(true)
            setError(null)

            try {
                // Always initialize SDK instance for read-only operations
                const sdkInstance = HyperliquidSDKService.getInstance()

                // initialize with signer if wallet available
                if (authenticated && walletClient) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const provider = new BrowserProvider(walletClient as any)
                    const signer = await provider.getSigner()
                    await sdkInstance.initializeWithEthersSigner(signer)
                    setHasWalletConnected(true)
                } else {
                    setHasWalletConnected(false)
                }

                setSdk(sdkInstance)
                setIsInitialized(true) // sdk ready
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
    }, [authenticated, walletClient, user, isWalletLoading, wagmiAddress, wagmiConnected])

    // only return address when authenticated and has privy wallets
    // this ensures sync with WalletConnect component
    const finalAddress = authenticated && privyWallets.length > 0 ? privyAddress : null

    return {
        sdk,
        isInitialized,
        hasWalletConnected,
        isLoading,
        error,
        address: finalAddress, // only when authenticated with wallets
    }
}
