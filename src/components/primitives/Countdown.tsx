'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn, getDurationBetween } from '@/utils'

type CountdownTarget = 'nextHour' | 'nextDay' | 'nextWeek' | 'nextMonth' | Date | string | number

interface CountdownProps {
    target: CountdownTarget
    format?: 'hh:mm:ss' | 'verbose'
    onComplete?: () => void
    className?: string
    showLabel?: boolean
    label?: string
}

function getTargetDate(target: CountdownTarget): Date {
    const now = new Date()

    switch (target) {
        case 'nextHour': {
            const nextHour = new Date(now)
            nextHour.setHours(now.getHours() + 1, 0, 0, 0)
            return nextHour
        }
        case 'nextDay': {
            const nextDay = new Date(now)
            nextDay.setDate(now.getDate() + 1)
            nextDay.setHours(0, 0, 0, 0)
            return nextDay
        }
        case 'nextWeek': {
            const nextWeek = new Date(now)
            const daysUntilMonday = (8 - now.getDay()) % 7 || 7
            nextWeek.setDate(now.getDate() + daysUntilMonday)
            nextWeek.setHours(0, 0, 0, 0)
            return nextWeek
        }
        case 'nextMonth': {
            const nextMonth = new Date(now)
            nextMonth.setMonth(now.getMonth() + 1, 1)
            nextMonth.setHours(0, 0, 0, 0)
            return nextMonth
        }
        default:
            return new Date(target)
    }
}

export function Countdown({ target, format = 'hh:mm:ss', onComplete, className, showLabel = false, label }: CountdownProps) {
    const [formattedTime, setFormattedTime] = useState('00:00:00')
    const [isComplete, setIsComplete] = useState(false)

    const calculateTimeLeft = useCallback(() => {
        const targetDate = getTargetDate(target)
        const now = new Date()
        const nowTime = now.getTime()
        const targetTime = targetDate.getTime()

        if (targetTime <= nowTime) {
            setIsComplete(true)
            if (onComplete) onComplete()
            return '00:00:00'
        }

        const duration = getDurationBetween({
            startTs: nowTime,
            endTs: targetTime,
            showYears: false,
            showMonths: false,
            showWeeks: false,
            showDays: false,
            shortFormat: format === 'verbose',
            ago: false,
        })

        if (format === 'verbose') return duration.oneLiner

        // hh:mm:ss format
        const totalHours = Math.floor((targetTime - nowTime) / (1000 * 60 * 60))
        const pad = (n: number) => n.toString().padStart(2, '0')
        return `${pad(totalHours)}:${pad(duration.inMinutes)}:${pad(duration.inSeconds)}`
    }, [target, onComplete, format])

    useEffect(() => {
        // calculate immediately
        setFormattedTime(calculateTimeLeft())

        // update every second
        const interval = setInterval(() => {
            setFormattedTime(calculateTimeLeft())
        }, 1000)

        return () => clearInterval(interval)
    }, [calculateTimeLeft])

    // reset complete state when target changes
    useEffect(() => {
        setIsComplete(false)
    }, [target])

    const displayLabel = label || (typeof target === 'string' && ['nextHour', 'nextDay', 'nextWeek', 'nextMonth'].includes(target) ? target : '')

    return (
        <div className={cn('inline-flex items-center gap-2', className)}>
            {showLabel && displayLabel && <span className="text-xs text-hlt-17">{displayLabel}:</span>}
            <span className={cn('font-mono', isComplete && 'text-hlt-12')}>{formattedTime}</span>
        </div>
    )
}
