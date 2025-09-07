'use client'

import { cn } from '@/utils'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import relativeTime from 'dayjs/plugin/relativeTime'
import LinkWrapper from '@/components/shared/Wrappers/LinkWrapper'
import { AppUrls } from '@/enums'
import { useWsStore } from '@/stores/ws.store'
import { StyledTooltip } from '@/components/primitives/Tooltip'
dayjs.extend(utc)
dayjs.extend(relativeTime)

export default function Footer(props: { className?: string }) {
    const wsStatus = useWsStore((state) => state.status)

    return (
        <footer
            className={cn(
                'fixed bottom-0 left-0 right-0 z-50 flex w-full items-center justify-between gap-2 border-t border-hlr-10 bg-hlb-19 pb-1.5 pl-2 pr-4 pt-1',
                props.className,
            )}>
            {/* left */}
            <LinkWrapper href={AppUrls.TEST_SHARED_WORKER} target="_blank" className="flex items-center gap-2">
                {/* websocket status */}
                <StyledTooltip content={process.env.NEXT_PUBLIC_HL_WS_URL || 'wss://api-ui.hyperliquid.xyz/ws'}>
                    <div
                        className={cn(
                            'flex items-center gap-1.5 rounded px-2.5 py-1 transition-colors',
                            wsStatus === 'connected' && 'border border-hlr-2 bg-hlb-6',
                            wsStatus === 'connecting' && 'border border-hlr-3',
                            wsStatus === 'disconnected' && 'border border-hlr-1 opacity-50',
                        )}>
                        {wsStatus === 'connecting' ? (
                            <div className="size-3 animate-spin rounded-full border-2 border-hlt-9 border-t-transparent" />
                        ) : (
                            <div
                                className={cn(
                                    'size-2 rounded-full transition-colors',
                                    wsStatus === 'connected' && 'bg-hlf-5',
                                    wsStatus === 'disconnected' && 'bg-hlt-11',
                                )}
                            />
                        )}
                        <p
                            className={cn(
                                'truncate text-xs font-medium transition-colors',
                                wsStatus === 'connected' && 'text-hlt-5',
                                wsStatus === 'connecting' && 'text-hlt-9',
                                wsStatus === 'disconnected' && 'text-hlt-11',
                            )}>
                            HL websocket: {wsStatus === 'connected' && 'connected'}
                            {wsStatus === 'connecting' && 'connecting...'}
                            {wsStatus === 'disconnected' && 'disconnected'}
                        </p>
                    </div>
                </StyledTooltip>
            </LinkWrapper>

            {/* right */}
            <nav className="flex flex-wrap items-center justify-center gap-4">
                {[
                    {
                        label: 'Docs',
                        href: AppUrls.DOCS,
                    },
                    {
                        label: 'Support',
                        href: AppUrls.SUPPORT,
                    },
                    {
                        label: 'Terms',
                        href: AppUrls.TERMS,
                    },
                    {
                        label: 'Privacy Policy',
                        href: AppUrls.PRIVACY_POLICY,
                    },
                ].map((item) => (
                    <LinkWrapper key={item.label} href={item.href} target="_blank">
                        <p className="cursor-alias truncate text-hlt-2 hover:text-hlt-4">{item.label}</p>
                    </LinkWrapper>
                ))}
            </nav>
        </footer>
    )
}
