import { memo, ComponentType } from 'react'
import { env } from '@/env/t3-env'

// conditional memo wrapper - disabled when NEXT_PUBLIC_DISABLE_MEMO is set
export function withMemo<P extends object>(Component: ComponentType<P>): ComponentType<P> {
    if (env.NEXT_PUBLIC_DISABLE_MEMO === 'true') return Component
    return memo(Component)
}
