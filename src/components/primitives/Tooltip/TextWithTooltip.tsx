'use client'

import React, { ReactNode } from 'react'
import StyledTooltip from '@/components/primitives/Tooltip/StyledTooltip'
import { cn } from '@/utils'

export default function TextWithTooltip({ tooltip, text }: { tooltip: { text: ReactNode; className?: string }; text: string }) {
    return (
        <StyledTooltip content={<p>{tooltip.text}</p>} className={cn('max-w-[380px] cursor-help', tooltip.className)}>
            <p className="cursor-help truncate text-hlt-17 underline decoration-dashed underline-offset-2">{text}</p>
        </StyledTooltip>
    )
}
