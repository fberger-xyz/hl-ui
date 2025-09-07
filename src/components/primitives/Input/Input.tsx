'use client'

import { useState } from 'react'
import { cn } from '@/utils'
import IconWrapper from '@/components/shared/Wrappers/IconWrapper'
import { IconIds } from '@/enums/icons.enum'

interface SearchInputProps {
    placeholder?: string
    value?: string
    onChange?: (value: string) => void
    onSearch?: (value: string) => void
}

export function SearchInput({ placeholder = 'Search', value: controlledValue, onChange, onSearch }: SearchInputProps = {}) {
    const [internalValue, setInternalValue] = useState('')
    const value = controlledValue !== undefined ? controlledValue : internalValue

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
        if (controlledValue === undefined) setInternalValue(newValue)
        onChange?.(newValue)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') onSearch?.(value)
    }

    return (
        <div
            className="flex w-full items-center gap-2 rounded-lg border border-hlr-7 pl-3 text-hlt-2 transition-colors duration-200 ease-in-out hover:border-hlr-4"
            data-no-close>
            <IconWrapper id={IconIds.SEARCH} className="pointer-events-none size-4 text-hlt-17 opacity-50" />
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                className={cn(
                    'h-[31px] grow rounded-r-xl bg-transparent placeholder-hlt-17',
                    'border-none border-hlr-7',
                    'outline-none',
                    'transition-all duration-200',
                    'hover:border-hlr-5',
                    'focus:outline-none',
                )}
            />
        </div>
    )
}
