'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiConfig } from '@/config/wagmi.config'
import { ReactNode, useState, useEffect } from 'react'
import { env } from '@/env/t3-env'
import { hyperliquidWS } from '@/services/hyperliquid-websocket-client'

export default function WalletProviders({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 5 * 1000,
                        refetchInterval: 10 * 1000,
                    },
                },
            }),
    )

    // initialize websocket connection on mount
    useEffect(() => {
        hyperliquidWS.connect().catch(console.error)
    }, [])

    return (
        <PrivyProvider
            appId={env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
            config={{
                appearance: {
                    theme: 'dark',
                    accentColor: '#676FFF',
                    logo: '/favicon.png',
                },
                loginMethods: ['wallet', 'email', 'google'],
                embeddedWallets: {
                    createOnLogin: 'users-without-wallets',
                },
            }}>
            <QueryClientProvider client={queryClient}>
                <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
            </QueryClientProvider>
        </PrivyProvider>
    )
}
