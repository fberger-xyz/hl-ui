'use client'

// todo: finish implementing this component
import { Slider, SliderProps } from '@heroui/slider'
import { cn } from '@/utils'

interface StyledSliderProps extends Omit<SliderProps, 'classNames'> {
    className?: string
    showPercentage?: boolean
}

export default function StyledSlider({
    className,
    showPercentage = true,
    step = 1,
    maxValue = 100,
    minValue = 0,
    defaultValue = 0,
    value,
    ...props
}: StyledSliderProps) {
    const displayValue = value !== undefined ? value : defaultValue

    return (
        <div className="flex items-center gap-3">
            <Slider
                {...props}
                step={step}
                maxValue={maxValue}
                minValue={minValue}
                defaultValue={defaultValue}
                value={value}
                showSteps={true}
                classNames={{
                    base: cn('flex-1', className),
                    track: 'bg-hlb-17 border-none h-1 rounded-full',
                    filler: 'bg-transparent',
                    thumb: [
                        'w-4 h-4',
                        'bg-hlb-1',
                        'border-2 border-hlb-1',
                        'shadow-lg shadow-hlb-1/20',
                        'hover:scale-110',
                        'focus:scale-110',
                        'transition-transform',
                        'after:hidden',
                    ],
                    step: ['w-1.5 h-1.5', 'bg-hlb-17', 'rounded-full', 'data-[in-range=false]:bg-hlb-17', 'data-[in-range=true]:bg-hlb-17'],
                    mark: 'hidden',
                    value: 'hidden',
                    label: 'hidden',
                }}
            />
            {showPercentage && (
                <div className="min-w-[3rem] text-right">
                    <span className="font-medium text-hlt-1">{Math.round(Number(displayValue))}</span>
                    <span className="ml-1 text-hlt-17">%</span>
                </div>
            )}
        </div>
    )
}
