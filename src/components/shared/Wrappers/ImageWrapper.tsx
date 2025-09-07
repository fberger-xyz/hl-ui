'use client'

import { cn } from '@/utils'
import Image from 'next/image'
import { useState } from 'react'

export function ImageWrapper({
    src,
    alt = 'missing alt',
    width = 20,
    height = 20,
    className = 'rounded-none',
    priority = false,
    scaleByHeight = false,
}: {
    src?: string
    alt?: string
    width?: number
    height?: number
    priority?: boolean
    className?: string
    scaleByHeight?: boolean
}) {
    const [imgError, setImgError] = useState(false)
    if (!src || imgError) return <div className={cn('skeleton-loading', className)} style={{ width, height }} />

    // use proper aspect ratio preserving styles
    const imageStyle = scaleByHeight ? { height: height, width: 'auto' } : { width: width, height: 'auto' }

    return (
        <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className={cn('object-contain', className)}
            style={imageStyle}
            onError={() => setImgError(true)}
            priority={priority}
        />
    )
}
