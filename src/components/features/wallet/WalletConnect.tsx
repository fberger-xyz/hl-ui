'use client'

import { usePrivy, useConnectWallet, useWallets } from '@privy-io/react-auth'
import { useSetActiveWallet } from '@privy-io/wagmi'
import { useAccount } from 'wagmi'
import { cn } from '@/utils'
import toast from 'react-hot-toast'
import IconWrapper from '@/components/shared/Wrappers/IconWrapper'
import { IconIds } from '@/enums/icons.enum'
import Dropdown from '@/components/primitives/Dropdown'
import StyledTooltip from '@/components/primitives/Tooltip/StyledTooltip'

export function WalletConnect({ className }: { className?: string }) {
    const { login, authenticated, logout } = usePrivy()
    const { connectWallet } = useConnectWallet()
    const { wallets } = useWallets() // ready
    const { setActiveWallet } = useSetActiveWallet()
    const { address } = useAccount()

    // use privy wallets to determine connection state
    const activeWallet = wallets[0]

    const formatAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`
    }

    const copyAddress = async () => {
        const addr = activeWallet?.address || address
        if (!addr) return
        await navigator.clipboard.writeText(addr)
        toast.success('Address copied!')
    }

    if (!authenticated) {
        return (
            <button
                type="button"
                onClick={login}
                className="rounded-lg bg-hlb-1 px-4 py-2 text-hlt-24 transition-colors duration-200 ease-in-out hover:bg-hlb-0">
                Connect
            </button>
        )
    }

    if (authenticated && activeWallet?.address) {
        return (
            <Dropdown
                className={className}
                align="right"
                triggerOn="click"
                closeOnClick={true}
                dropdownClassName="w-56"
                trigger={(isOpen) => (
                    <button
                        type="button"
                        className="flex items-center gap-2 rounded-lg border border-hlr-5 p-2 px-3 transition-all duration-300 ease-in-out">
                        <span className="">{formatAddress(activeWallet.address)}</span>
                        <IconWrapper id={IconIds.CHEVRON_DOWN} className={cn('size-4 transition-transform', isOpen && 'rotate-180')} />
                    </button>
                )}>
                <div className="overflow-hidden">
                    {/* Current wallet section */}
                    <div className="border-b border-hlr-5 px-3 py-2">
                        <div className="flex items-center gap-2">
                            <StyledTooltip content={<p>{activeWallet.address}</p>}>
                                <p className="">{formatAddress(activeWallet.address)}</p>
                            </StyledTooltip>
                            <button
                                type="button"
                                onClick={() => copyAddress()}
                                className="rounded-lg p-2 transition-colors duration-200 ease-in-out"
                                title="Copy address"
                                data-no-close>
                                <IconWrapper id={IconIds.COPY} className="size-4 text-hlt-8 hover:text-hlt-4" />
                            </button>
                        </div>
                    </div>

                    {/* Switch wallet section if multiple wallets */}
                    {wallets.length > 1 && (
                        <div className="border-b border-hlr-5">
                            <p className="px-3 pb-2 pt-3 text-xs text-hlt-2">Switch Wallet</p>
                            <div className="max-h-32 overflow-y-auto">
                                {wallets
                                    .filter((w) => w.address !== activeWallet.address)
                                    .map((wallet) => (
                                        <button
                                            type="button"
                                            key={wallet.address}
                                            onClick={() => setActiveWallet(wallet)}
                                            className="w-full px-3 py-2 text-left transition-colors duration-200 ease-in-out hover:bg-hlb-21">
                                            <span className="text-hlt-3">{formatAddress(wallet.address)}</span>
                                        </button>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* Disconnect button */}
                    <button
                        type="button"
                        onClick={() => logout()}
                        className="w-full px-3 py-3 text-left text-hlt-8 transition-colors duration-200 ease-in-out hover:text-hlt-4">
                        Disconnect
                    </button>
                </div>
            </Dropdown>
        )
    }

    return (
        // <div className={cn('flex items-center gap-2', className)}>
        //     <button onClick={() => connectWallet()} className="bg-hlg-1 hover:bg-hlg-2 rounded-lg px-4 py-2 font-medium text-white transition-colors">
        //         {ready ? 'Connect' : 'Loading...'}
        //     </button>
        //     <button onClick={logout} className="rounded-lg px-3 py-2 font-medium text-hlr-1 transition-colors hover:bg-hlb-9/10">
        //         Logout
        //     </button>
        // </div>
        <button
            type="button"
            onClick={() => connectWallet()}
            className="w-full rounded-lg bg-hlb-1 px-4 py-2 font-medium text-hlt-21 transition-colors hover:bg-hlb-0">
            Connect
        </button>
    )
}
