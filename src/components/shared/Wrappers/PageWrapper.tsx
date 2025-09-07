import { cn } from '@/utils'
import { Suspense } from 'react'

export default function PageWrapper({
    children,
    className,
    paddingX = 'px-1',
    ...props
}: {
    children: React.ReactNode
    className?: string
    paddingX?: string
}) {
    return (
        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <section {...props} className={cn('mx-auto mt-1 flex w-full flex-col overflow-hidden pb-12', paddingX, className)}>
                {children}
            </section>
        </Suspense>
    )
}
