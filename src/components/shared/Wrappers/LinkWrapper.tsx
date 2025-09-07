import Link from 'next/link'

export default function LinkWrapper({
    children,
    href,
    disabled,
    passHref,
    style,
    onClick,
    ...props
}: {
    href?: string
    disabled?: boolean
    children?: React.ReactNode
    passHref?: boolean
    className?: string
    rel?: string
    target?: string
    style?: React.CSSProperties
    onClick?: () => void
}) {
    if (!href || disabled)
        return (
            <button aria-label="link button" disabled={disabled} {...props}>
                {children}
            </button>
        )

    return (
        <Link href={href} passHref={passHref} style={style} onClick={onClick} {...props}>
            {children}
        </Link>
    )
}
