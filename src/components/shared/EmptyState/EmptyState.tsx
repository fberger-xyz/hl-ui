import type { BaseProps } from '@/types/ui.types'

interface EmptyStateProps extends BaseProps {
    title: string
    description?: string
}

// reusable empty state component
export default function EmptyState({ title, description, className = '' }: EmptyStateProps) {
    return (
        <div className={`flex flex-1 items-center justify-center p-8 ${className}`}>
            <div className="text-center">
                <p className="text-lg">{title}</p>
                {description && <p className="mt-2">{description}</p>}
            </div>
        </div>
    )
}
