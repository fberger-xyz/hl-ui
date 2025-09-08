'use client'

import { useEffect, useRef } from 'react'
import { subscriptionManager } from '@/services/subscription-manager'
import { HyperliquidWebSocketSubscriptionType } from '@/enums'

// subscribes to global webData2 with zero address (non-authenticated data)
export function useGlobalWebData() {
    const unsubscribeRef = useRef<(() => void) | null>(null)

    useEffect(() => {
        // cleanup previous subscription
        if (unsubscribeRef.current) {
            unsubscribeRef.current()
            unsubscribeRef.current = null
        }

        // subscribe to global webData2 with zero address
        // this provides general market data not specific to any user
        unsubscribeRef.current = subscriptionManager.subscribe(
            {
                type: HyperliquidWebSocketSubscriptionType.WEB_DATA2,
                user: '0x0000000000000000000000000000000000000000',
            },
            (data) => {
                // handle global web data updates
                console.log('Global webData2 update:', data)
            },
        )

        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current()
                unsubscribeRef.current = null
            }
        }
    }, [])
}
