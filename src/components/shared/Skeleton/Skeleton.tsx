import { cn } from '@/utils'
import type { BaseProps } from '@/types/ui.types'

interface SkeletonProps extends BaseProps {
    variant?: 'text' | 'debanAumChart' | 'metric' | 'button'
}

export default function Skeleton({ className, variant = 'text' }: SkeletonProps) {
    const variantClasses = {
        text: 'w-2/3 h-[22px] rounded',
        debanAumChart: 'w-full h-14 rounded-lg',
        metric: 'w-20 h-6 rounded',
        button: 'w-20 h-10 rounded-lg',
    }

    return <div className={cn('skeleton-loading', variantClasses[variant], className)} />
}
