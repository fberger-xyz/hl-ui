export interface BaseProps {
    className?: string
    children?: React.ReactNode
}

export type SizeVariant = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface LoadingStateProps {
    isLoading?: boolean
    loadingText?: string
}

export interface ErrorStateProps {
    error?: string | null
    onRetry?: () => void
}
