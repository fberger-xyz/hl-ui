'use client'

import { APP_PAGES } from '@/config/app.config'
import { redirect } from 'next/navigation'

export function ErrorBoundaryFallback({ error }: { error: Error }) {
    redirect(APP_PAGES[0].path)
    return (
        <div className="flex flex-col items-center p-4">
            <p>Something went wrong...</p>
            <p className="bg-background/10 text-error rounded-md p-1">Error: {error.message}</p>
        </div>
    )
}
