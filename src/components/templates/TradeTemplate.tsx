'use client'

import { cn } from '@/utils'
import { ReactNode } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

export function ErrorBoundaryTemplate(props: { error: Error | string; resetErrorBoundary?: () => void; fallbackMessage?: string }) {
    const errorMessage =
        props.error instanceof Error
            ? props.error.message
            : typeof props.error === 'string'
              ? props.error
              : props.fallbackMessage || 'An error occurred'

    return (
        <div className="flex h-full w-full items-center justify-center bg-hlb-21/50 p-4">
            <div className="flex flex-col items-center gap-4 text-center">
                <p className="font-medium text-hlt-12">{errorMessage}</p>
                {props.resetErrorBoundary && (
                    <button
                        onClick={props.resetErrorBoundary}
                        // className="rounded border border-hlr-2 bg-hlb-21 px-4 py-2 text-hlt-13 transition-all hover:bg-hlb-1/10 hover:text-hlt-8">
                        className="rounded-lg bg-hlb-1 px-4 py-2 font-medium text-hlt-21 transition-colors hover:bg-hlb-0">
                        <p>Retry</p>
                    </button>
                )}
            </div>
        </div>
    )
}

// better to keep it simple. one template per usage
export function TradeTemplateMobile(props: {
    pairs: {
        favorites: ReactNode
        selector: ReactNode
        charts: ReactNode
    }
    orderbook: ReactNode
    tables: ReactNode
    panel: ReactNode
    className?: string
}) {
    return (
        <main className={cn('flex size-full flex-col gap-1 overflow-y-auto md:hidden', props.className)}>
            {/* pair selector + favorites */}
            <section className="flex flex-col gap-1">
                <div className="rounded bg-hlb-24">
                    <ErrorBoundary
                        fallbackRender={({ error, resetErrorBoundary }) => (
                            <ErrorBoundaryTemplate error={error} resetErrorBoundary={resetErrorBoundary} />
                        )}>
                        {props.pairs.favorites}
                    </ErrorBoundary>
                </div>
                <div className="rounded bg-hlb-21">
                    <ErrorBoundary
                        fallbackRender={({ error, resetErrorBoundary }) => (
                            <ErrorBoundaryTemplate error={error} resetErrorBoundary={resetErrorBoundary} />
                        )}>
                        {props.pairs.selector}
                    </ErrorBoundary>
                </div>
            </section>

            {/* chart */}
            <section className="relative h-[400px] overflow-hidden rounded bg-hlb-21">
                <ErrorBoundary
                    fallbackRender={({ error, resetErrorBoundary }) => (
                        <ErrorBoundaryTemplate error={error} resetErrorBoundary={resetErrorBoundary} fallbackMessage="Error loading chart data" />
                    )}>
                    {props.pairs.charts}
                </ErrorBoundary>
            </section>

            {/* orderbook/trades */}
            <section className="relative h-[400px] overflow-hidden rounded">
                <ErrorBoundary
                    fallbackRender={({ error, resetErrorBoundary }) => (
                        <ErrorBoundaryTemplate error={error} resetErrorBoundary={resetErrorBoundary} />
                    )}>
                    {props.orderbook}
                </ErrorBoundary>
            </section>

            {/* tables */}
            <section className="min-h-[300px] rounded">
                <ErrorBoundary
                    fallbackRender={({ error, resetErrorBoundary }) => (
                        <ErrorBoundaryTemplate error={error} resetErrorBoundary={resetErrorBoundary} />
                    )}>
                    {props.tables}
                </ErrorBoundary>
            </section>

            {/* trade panel */}
            <section className="sticky bottom-0 rounded bg-hlb-21">
                <ErrorBoundary
                    fallbackRender={({ error, resetErrorBoundary }) => (
                        <ErrorBoundaryTemplate error={error} resetErrorBoundary={resetErrorBoundary} />
                    )}>
                    {props.panel}
                </ErrorBoundary>
            </section>
        </main>
    )
}

// better to keep it simple. one template per usage
export function TradeTemplateDesktop(props: {
    pairs: {
        favorites: ReactNode
        selector: ReactNode
        charts: ReactNode
    }
    orderbook: ReactNode
    tables: ReactNode
    panel: ReactNode
    className?: string
}) {
    return (
        <main className={cn('hidden size-full gap-1 overflow-hidden md:flex', props.className)}>
            {/* pairs + chart + table + orderbook */}
            <section className="flex min-w-0 grow flex-col gap-1 overflow-hidden">
                <div className="flex min-w-0 gap-1">
                    {/* pairs + chart */}
                    <section className="flex min-w-0 grow flex-col gap-1">
                        <div className="rounded bg-hlb-24">
                            <ErrorBoundary
                                fallbackRender={({ error, resetErrorBoundary }) => (
                                    <ErrorBoundaryTemplate error={error} resetErrorBoundary={resetErrorBoundary} />
                                )}>
                                {props.pairs.favorites}
                            </ErrorBoundary>
                        </div>
                        <div className="rounded bg-hlb-21">
                            <ErrorBoundary
                                fallbackRender={({ error, resetErrorBoundary }) => (
                                    <ErrorBoundaryTemplate error={error} resetErrorBoundary={resetErrorBoundary} />
                                )}>
                                {props.pairs.selector}
                            </ErrorBoundary>
                        </div>
                        <div className="relative h-full max-h-[560px] overflow-hidden rounded bg-hlb-21">
                            <ErrorBoundary
                                fallbackRender={({ error, resetErrorBoundary }) => (
                                    <ErrorBoundaryTemplate error={error} resetErrorBoundary={resetErrorBoundary} />
                                )}>
                                {props.pairs.charts}
                            </ErrorBoundary>
                        </div>
                    </section>

                    {/* orderbook + trades. fixed size copy pasted from hl ui */}
                    <aside className="h-full max-h-[670px] w-[275px] rounded">
                        <ErrorBoundary
                            fallbackRender={({ error, resetErrorBoundary }) => (
                                <ErrorBoundaryTemplate error={error} resetErrorBoundary={resetErrorBoundary} />
                            )}>
                            {props.orderbook}
                        </ErrorBoundary>
                    </aside>
                </div>

                {/* tables */}
                <section className="h-full w-full overflow-hidden rounded">
                    <ErrorBoundary
                        fallbackRender={({ error, resetErrorBoundary }) => (
                            <ErrorBoundaryTemplate error={error} resetErrorBoundary={resetErrorBoundary} />
                        )}>
                        {props.tables}
                    </ErrorBoundary>
                </section>
            </section>

            {/* trade panel. fixed width copy pasted from hl ui */}
            <aside className="w-[275px] flex-shrink-0 rounded">
                <ErrorBoundary
                    fallbackRender={({ error, resetErrorBoundary }) => (
                        <ErrorBoundaryTemplate error={error} resetErrorBoundary={resetErrorBoundary} />
                    )}>
                    {props.panel}
                </ErrorBoundary>
            </aside>
        </main>
    )
}

// better to keep it simple. one template per usage
export function TradeTemplate(props: {
    pairs: {
        favorites: ReactNode
        selector: ReactNode
        charts: ReactNode
    }
    orderbook: ReactNode
    tables: ReactNode
    panel: ReactNode
    className?: string
}) {
    return (
        <>
            <TradeTemplateMobile {...props} />
            <TradeTemplateDesktop {...props} />
        </>
    )
}
