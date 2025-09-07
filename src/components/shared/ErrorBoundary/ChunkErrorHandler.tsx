/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect } from 'react'

export function ChunkErrorHandler() {
    useEffect(() => {
        const handleChunkError = (event: ErrorEvent) => {
            const chunkFailurePattern = /Loading chunk [\d]+ failed/
            const cssChunkFailurePattern = /Loading CSS chunk/

            if (!chunkFailurePattern.test(event.message) && !cssChunkFailurePattern.test(event.message)) return
            console.error('Chunk loading error detected:', event.message)

            // check if we've already tried reloading recently
            const lastReload = sessionStorage.getItem('lastChunkErrorReload')
            const now = Date.now()

            if (!lastReload || now - parseInt(lastReload) > 10000) {
                sessionStorage.setItem('lastChunkErrorReload', now.toString())
                window.location.reload()
            }
        }

        window.addEventListener('error', handleChunkError)

        // handle dynamic import failures for webpack 5
        if (typeof window === 'undefined' || !(window as any).__webpack_require__) return
        const originalImport = (window as any).__webpack_require__.e
        if (!originalImport) return
        ;(window as any).__webpack_require__.e = function (...args: any[]) {
            return originalImport.apply(this, args).catch((error: Error) => {
                console.error('Dynamic import failed:', error)

                const lastReload = sessionStorage.getItem('lastChunkErrorReload')
                const now = Date.now()

                if (!lastReload || now - parseInt(lastReload) > 10000) {
                    sessionStorage.setItem('lastChunkErrorReload', now.toString())
                    window.location.reload()
                }

                throw error
            })
        }

        return () => {
            window.removeEventListener('error', handleChunkError)
        }
    }, [])

    return null
}
