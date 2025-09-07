'use client'

import { APP_PAGES } from '@/config/app.config'
import { useUiStore } from '@/stores/ui.store'
import { useEffect } from 'react'
import { useKeyboardShortcut } from '@/hooks/helpers/useKeyboardShortcutArgs'
import { AppUrls, PublicFiles, IconIds } from '@/enums'
import IconWrapper from '@/components/shared/Wrappers/IconWrapper'
import LinkWrapper from '@/components/shared/Wrappers/LinkWrapper'
import { ImageWrapper } from '@/components/shared/Wrappers/ImageWrapper'
import { WalletConnect } from '@/components/features/wallet/WalletConnect'
import Dropdown from '@/components/primitives/Dropdown'

export default function HeaderMobile() {
    const { showMobileMenu, setShowMobileMenu } = useUiStore()

    useKeyboardShortcut({ key: 'Escape', callback: () => setShowMobileMenu(false) })

    // lock body scroll when menu is open
    useEffect(() => {
        if (showMobileMenu) {
            const scrollY = window.scrollY
            document.body.style.position = 'fixed'
            document.body.style.top = `-${scrollY}px`
            document.body.style.width = '100%'
            return
        }
        const scrollY = document.body.style.top
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        window.scrollTo(0, parseInt(scrollY || '0') * -1)

        return () => {
            document.body.style.position = ''
            document.body.style.top = ''
            document.body.style.width = ''
        }
    }, [showMobileMenu])

    return (
        <>
            <header className="sticky top-0 z-50 flex items-center justify-between bg-hlb-21/80 px-6 py-3 backdrop-blur-md md:hidden">
                <LinkWrapper href={AppUrls.TRADE}>
                    <ImageWrapper src={PublicFiles.HL_SYMBOL_WHITE} priority alt="Logo" width={21} height={20} className="h-5" />
                </LinkWrapper>
                <aside className="ml-auto flex items-start gap-2">
                    {/* wallet dropdown */}
                    <WalletConnect />

                    {/* languages dropdown */}
                    <Dropdown
                        align="right"
                        trigger={
                            <button
                                className="h-8 rounded-lg border border-hlr-5 p-1.5 transition-all duration-300 ease-in-out hover:bg-hlb-19"
                                aria-label="Languages">
                                <IconWrapper id={IconIds.WEB} className="size-5" />
                            </button>
                        }>
                        <div className="h-full overflow-y-auto">
                            <div className="space-y-0.5 py-2">
                                <button className="flex w-full items-center justify-between px-4 py-2 text-xs transition-colors hover:bg-hlb-21">
                                    <span className="text-hlt-17">Todo</span>
                                </button>
                            </div>
                        </div>
                    </Dropdown>

                    {/* settings dropdown */}
                    <Dropdown
                        align="right"
                        // dropdownClassName="w-[320px]"
                        trigger={
                            <button
                                className="h-8 rounded-lg border border-hlr-5 p-1.5 transition-all duration-300 ease-in-out hover:bg-hlb-19"
                                aria-label="Settings">
                                <IconWrapper id={IconIds.SETTINGS} className="size-5" />
                            </button>
                        }>
                        <div className="h-full overflow-y-auto">
                            <div className="space-y-0.5 py-2">
                                <button className="flex w-full items-center justify-between px-4 py-2 text-xs transition-colors hover:bg-hlb-21">
                                    <span className="text-hlt-17">Todo</span>
                                </button>
                            </div>
                        </div>
                    </Dropdown>
                </aside>
            </header>

            {showMobileMenu && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setShowMobileMenu(false)} />

                    {/* Mobile Menu */}
                    <aside className="fixed right-0 top-0 z-50 h-full w-full max-w-sm bg-hlb-21 p-6 shadow-xl md:hidden">
                        {/* Close Button */}
                        <button onClick={() => setShowMobileMenu(false)} className="absolute right-4 top-4 p-2" aria-label="Close menu">
                            <IconWrapper id={IconIds.X} className="h-6 w-6" />
                        </button>

                        {/* Menu Content */}
                        <nav className="mt-16 space-y-4">
                            {/* Wallet Connect */}
                            <div className="mb-4 border-b border-hlb-12 pb-4">
                                <WalletConnect className="w-full" />
                            </div>

                            {APP_PAGES.map((page) => (
                                <LinkWrapper
                                    key={page.path}
                                    href={page.path}
                                    className="dark: block rounded-lg px-4 py-3 text-lg font-medium transition-colors"
                                    onClick={() => setShowMobileMenu(false)}>
                                    {page.name}
                                </LinkWrapper>
                            ))}
                        </nav>
                    </aside>
                </>
            )}
        </>
    )
}
