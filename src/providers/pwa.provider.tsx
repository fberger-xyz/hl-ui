'use client'

import { useEffect } from 'react'

export default function PWAProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // only register service worker in production
        // service workers can interfere with hot module replacement in development
        if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js', {
                scope: '/',
                updateViaCache: 'none',
            })
        }

        // in development, unregister any existing service workers to prevent caching issues
        if (process.env.NODE_ENV === 'development' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then((registrations) => {
                registrations.forEach((registration) => {
                    registration.unregister()
                })
            })
        }
    }, [])

    return <>{children}</>
}
