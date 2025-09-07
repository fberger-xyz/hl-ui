'use client'

import { useState } from 'react'
import { cn } from '@/utils'
import StyledSlider from '@/components/primitives/StyledSlider'

interface SizeInputProps {
    maxSize?: number
    unit?: string
    className?: string
    onSizeChange?: (size: number, percentage: number) => void
}

export default function SizeInput({ maxSize = 10000, unit = 'USD', className, onSizeChange }: SizeInputProps) {
    const [sizeValue, setSizeValue] = useState('')
    const [percentage, setPercentage] = useState(0)

    const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSizeValue(value)
        const numValue = parseFloat(value) || 0
        const newPercentage = Math.min(100, Math.max(0, (numValue / maxSize) * 100))
        setPercentage(Math.round(newPercentage))
        onSizeChange?.(numValue, newPercentage)
    }

    const handlePercentageSliderChange = (value: number | number[]) => {
        const newPercentage = Array.isArray(value) ? value[0] : value
        setPercentage(newPercentage)
        const newSize = (maxSize * newPercentage) / 100
        setSizeValue(newSize ? newSize.toFixed(2) : '')
        onSizeChange?.(newSize, newPercentage)
    }

    const handlePercentageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value) || 0
        const clampedValue = Math.min(100, Math.max(0, value))
        setPercentage(clampedValue)
        const newSize = (maxSize * clampedValue) / 100
        setSizeValue(newSize ? newSize.toFixed(2) : '')
        onSizeChange?.(newSize, clampedValue)
    }

    return (
        <div className={cn('flex flex-col gap-3', className)}>
            {/* Row 1: Size input with unit */}
            <div className="flex items-center justify-between">
                <label className="text-xs text-hlt-17">Size</label>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={sizeValue}
                        onChange={handleSizeChange}
                        placeholder="0.00"
                        className="w-24 rounded border border-hlr-7 bg-hlb-19 px-2 py-1 text-right text-xs text-hlt-2 placeholder-hlt-17 focus:border-hlr-2 focus:outline-none"
                    />
                    <span className="min-w-[30px] text-xs text-hlt-17">{unit}</span>
                </div>
            </div>

            {/* Row 2: Percentage slider with input */}
            <div className="flex items-center gap-3">
                <div className="flex-1">
                    <StyledSlider value={percentage} onChange={handlePercentageSliderChange} showPercentage={false} aria-label="Size percentage" />
                </div>
                <div className="flex items-center gap-1">
                    <input
                        type="number"
                        value={percentage}
                        onChange={handlePercentageInputChange}
                        min="0"
                        max="100"
                        className="w-12 rounded border border-hlr-7 bg-hlb-19 px-1 py-0.5 text-right text-xs text-hlt-2 placeholder-hlt-17 focus:border-hlr-2 focus:outline-none"
                    />
                    <span className="text-xs text-hlt-17">%</span>
                </div>
            </div>

            {/* Quick percentage buttons */}
            <div className="flex justify-between">
                {[0, 25, 50, 75, 100].map((percent) => (
                    <button
                        key={percent}
                        onClick={() => {
                            setPercentage(percent)
                            const newSize = (maxSize * percent) / 100
                            setSizeValue(newSize ? newSize.toFixed(2) : '')
                            onSizeChange?.(newSize, percent)
                        }}
                        className="px-1 text-xs text-hlt-17 transition-colors hover:text-hlt-1">
                        {percent}%
                    </button>
                ))}
            </div>
        </div>
    )
}
