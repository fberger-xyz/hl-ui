'use client'

import IconWrapper from '@/components/shared/Wrappers/IconWrapper'
import { IconIds } from '@/enums/icons.enum'
import Dropdown from '@/components/primitives/Dropdown'
import { PublicFiles } from '@/enums/files.enum'
import { ImageWrapper } from '@/components/shared/Wrappers/ImageWrapper'
import LinkWrapper from '@/components/shared/Wrappers/LinkWrapper'
import { AppUrls } from '@/enums/app.enum'
import { cn } from '@/utils'
import { WalletConnect } from '@/components/features/wallet/WalletConnect'
import { showNotImplementedToast } from '@/utils/toast'

export default function HeaderDesktop() {
    return (
        <header className="sticky top-0 z-40 hidden h-[56px] w-full items-center gap-[22px] border-b border-hlr-11 bg-hlb-21 py-2.5 pl-4 pr-2 md:flex">
            <LinkWrapper href={AppUrls.TRADE}>
                <ImageWrapper src={PublicFiles.HL_LOGO_WHITE} priority alt="Logo" width={115} height={32} className="h-8" />
            </LinkWrapper>
            <nav className="flex items-center gap-2">
                {[
                    {
                        path: AppUrls.TRADE,
                        name: 'Trade',
                    },
                ].map((page) => (
                    <LinkWrapper key={page.path} href={page.path} className="px-2.5 py-2">
                        <p className={cn('', page.path === AppUrls.TRADE ? 'text-hlt-4' : 'text-hlt-2')}>{page.name}</p>
                    </LinkWrapper>
                ))}
            </nav>

            <aside className="ml-auto flex items-start gap-2">
                <WalletConnect />

                <Dropdown
                    align="right"
                    trigger={
                        <button
                            type="button"
                            className="h-8 rounded-lg border border-hlr-5 p-1.5 transition-all duration-300 ease-in-out hover:bg-hlb-19"
                            aria-label="Languages">
                            <IconWrapper id={IconIds.WEB} className="size-5" />
                        </button>
                    }>
                    <div className="h-full overflow-y-auto">
                        <div className="space-y-0.5 py-2">
                            <button
                                type="button"
                                onClick={() => showNotImplementedToast('Language settings not yet implemented')}
                                className="flex w-full items-center justify-between px-4 py-2 text-xs transition-colors hover:bg-hlb-21">
                                <span className="text-hlt-17">Todo</span>
                            </button>
                        </div>
                    </div>
                </Dropdown>

                <Dropdown
                    align="right"
                    trigger={
                        <button
                            type="button"
                            className="h-8 rounded-lg border border-hlr-5 p-1.5 transition-all duration-300 ease-in-out hover:bg-hlb-19"
                            aria-label="Settings">
                            <IconWrapper id={IconIds.SETTINGS} className="size-5" />
                        </button>
                    }>
                    <div className="h-full overflow-y-auto">
                        <div className="space-y-0.5 py-2">
                            <button
                                type="button"
                                onClick={() => showNotImplementedToast('Settings not yet implemented')}
                                className="flex w-full items-center justify-between px-4 py-2 text-xs transition-colors hover:bg-hlb-21">
                                <span className="text-hlt-17">Todo</span>
                            </button>
                        </div>
                    </div>
                </Dropdown>
            </aside>
        </header>
    )
}
