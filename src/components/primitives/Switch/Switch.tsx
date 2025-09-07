'use client'

import { cn } from '@/utils'

interface SwitchProps {
    leftLabel: string
    rightLabel: string
    value: string
    onChange: (value: string) => void
    leftBgColor?: string
    rightBgColor?: string
    leftTextColor?: string
    rightTextColor?: string
    className?: string
}

export default function Switch({
    leftLabel,
    rightLabel,
    value,
    onChange,
    leftBgColor = 'bg-hlb-1',
    rightBgColor = 'bg-hlb-4',
    leftTextColor = 'text-hlt-21',
    rightTextColor = 'text-hlt-1',
    className = 'h-[28px] text-xs',
}: SwitchProps) {
    const isLeft = value === leftLabel

    return (
        <div className={cn('relative flex rounded-lg bg-hlb-16 p-0.5', className)}>
            {/* Sliding background */}
            <div
                className={cn('absolute inset-y-[2px] rounded-md transition-all duration-300 ease-out', isLeft ? leftBgColor : rightBgColor)}
                style={{
                    left: isLeft ? '2px' : '50%',
                    width: 'calc(50% - 2px)',
                }}
            />

            {/* Left button */}
            <button
                className={cn(
                    'relative z-10 flex flex-1 items-center justify-center rounded-md px-2 transition-colors',
                    isLeft ? leftTextColor : 'text-hlt-17 hover:text-hlt-1',
                )}
                onClick={() => onChange(leftLabel)}>
                <p className="truncate">{leftLabel}</p>
            </button>

            {/* Right button */}
            <button
                className={cn(
                    'relative z-10 flex flex-1 items-center justify-center rounded-md px-2 transition-colors',
                    !isLeft ? rightTextColor : 'text-hlt-17 hover:text-hlt-1',
                )}
                onClick={() => onChange(rightLabel)}>
                <p className="truncate">{rightLabel}</p>
            </button>
        </div>
    )
}
