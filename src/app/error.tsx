'use client'

import PageWrapper from '@/components/shared/Wrappers/PageWrapper'
import { useEffect } from 'react'
import { extractErrorMessage } from '@/utils'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        console.error(error)

        // auto-reload for chunk loading errors
        if (error.message?.includes('Loading chunk') || error.message?.includes('Failed to fetch dynamically imported module')) {
            const lastReload = sessionStorage.getItem('lastChunkErrorReload')
            const now = Date.now()

            // only reload if we haven't tried recently
            if (!lastReload || now - parseInt(lastReload) > 10000) {
                sessionStorage.setItem('lastChunkErrorReload', now.toString())
                setTimeout(() => window.location.reload(), 1500)
            }
        }
    }, [error])

    return (
        <PageWrapper>
            <div className="mx-auto mt-10 flex w-full max-w-lg flex-col items-center gap-4">
                <p className="text-lg font-semibold">
                    Sorry, something went <span className="text-primary">wrong</span>
                </p>
                <div className="flex w-full flex-col items-center gap-2 rounded-xl">
                    <pre className="border-primary/20 text-primary max-h-96 w-full overflow-y-auto text-wrap rounded-xl border border-dashed px-8 py-10 text-center">
                        {extractErrorMessage(error)}
                    </pre>
                </div>
                <div className="flex w-full flex-col items-center gap-3">
                    <button
                        onClick={() => reset()}
                        className="dark: flex w-full items-center justify-center gap-2.5 rounded-xl border font-semibold sm:py-2">
                        <p className="px-4 py-1 text-base font-semibold">Reload page</p>
                    </button>

                    <p>Reload the page or contact support if the issue persists</p>
                </div>
            </div>
        </PageWrapper>
    )
}
