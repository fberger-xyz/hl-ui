'use client'

import { cn } from '@/utils'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import IconWrapper from '@/components/shared/Wrappers/IconWrapper'
import { IconIds } from '@/enums/icons.enum'
import { AppThemes } from '@/enums/app.enum'

// note: working but not used in this app
export default function ThemeSwitcher({ buttonClassName = '' }: { containerClassName?: string; buttonClassName?: string }) {
    const [mounted, setMounted] = useState(false)
    const { theme, setTheme } = useTheme()

    useEffect(() => setMounted(true), [])

    if (!mounted) return <div className={cn('bg-text-muted/20 dark:bg-text-muted/30 h-8 w-20 animate-pulse rounded-xl', buttonClassName)} />

    return (
        <button
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === AppThemes.DARK ? AppThemes.LIGHT : AppThemes.DARK)}
            className="border-slate/20 hover:bg-background-slate/10 rounded-lg border p-1.5 transition-all duration-300 ease-in-out">
            <IconWrapper id={theme === AppThemes.DARK ? IconIds.THEME_LIGHT : IconIds.THEME_DARK} className="size-5" />
        </button>
    )
}
