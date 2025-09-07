'use client'

import { IconIds } from '@/enums'
import { Icon } from '@iconify/react'

export default function IconWrapper(props: { id: IconIds; className?: string; style?: React.CSSProperties }) {
    return <Icon icon={props.id} className={props.className} style={props.style} />
}
