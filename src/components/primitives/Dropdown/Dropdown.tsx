'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/utils'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

interface DropdownProps {
    trigger: React.ReactNode | ((isOpen: boolean) => React.ReactNode)
    children: React.ReactNode
    className?: string
    dropdownClassName?: string
    align?: 'left' | 'center' | 'right'
    delay?: number
    closeOnClick?: boolean
    triggerOn?: 'hover' | 'click' | 'both'
}

const KeyToast = ({ keyName }: { keyName: string }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="flex items-center justify-center rounded-lg border border-hlr-5 bg-hlb-21 px-4 py-2 shadow-lg">
        <span className="font-mono font-medium text-hlt-1">{keyName}</span>
    </motion.div>
)

export default function Dropdown({
    trigger,
    children,
    className,
    dropdownClassName,
    align = 'right',
    delay = 200,
    closeOnClick = false,
    triggerOn = 'click',
}: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const handleMouseEnter = () => {
        if (triggerOn === 'click') return
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        setIsOpen(true)
    }

    const handleMouseLeave = () => {
        if (triggerOn === 'click') return
        timeoutRef.current = setTimeout(() => {
            setIsOpen(false)
        }, delay)
    }

    const handleClick = (e: React.MouseEvent) => {
        if (triggerOn === 'hover') return
        e.stopPropagation()
        setIsOpen(!isOpen)
    }

    // close dropdown when clicking outside or pressing esc
    useEffect(() => {
        if (triggerOn !== 'click' && triggerOn !== 'both') return

        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false)
        }

        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false)
                // show toast when esc is pressed to close dropdown
                toast.custom(<KeyToast keyName="ESC" />, {
                    duration: 800,
                    position: 'bottom-center',
                    id: 'esc-key-toast',
                })
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
            document.addEventListener('keydown', handleEscKey)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEscKey)
        }
    }, [isOpen, triggerOn])

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
        }
    }, [])

    const alignmentClasses = {
        left: 'left-0',
        center: 'left-1/2 -translate-x-1/2',
        right: 'right-0',
    }

    // handle dropdown item clicks if closeonclick is true
    const handleDropdownClick = (e: React.MouseEvent) => {
        // don't close if clicking on input elements or their containers
        const target = e.target as HTMLElement
        const isInputOrChild = target.closest('input, textarea, select, [data-no-close]')

        if (closeOnClick && !isInputOrChild) setIsOpen(false)
    }

    // render trigger - support function or node
    const renderTrigger = () => {
        if (typeof trigger === 'function') return trigger(isOpen)
        return trigger
    }

    const triggerProps = {
        ...(triggerOn !== 'click' && {
            onMouseEnter: handleMouseEnter,
            onMouseLeave: handleMouseLeave,
        }),
        ...(triggerOn !== 'hover' && {
            onClick: handleClick,
        }),
    }

    return (
        <div ref={containerRef} className={cn('relative', className)} {...triggerProps}>
            {renderTrigger()}

            {isOpen && (
                <div
                    ref={dropdownRef}
                    className={cn(
                        'absolute top-full z-50 mt-2',
                        'w-fit rounded-xl',
                        'border border-hlr-9 bg-hlb-19',
                        alignmentClasses[align],
                        dropdownClassName,
                    )}
                    onClick={handleDropdownClick}>
                    {children}
                </div>
            )}
        </div>
    )
}
