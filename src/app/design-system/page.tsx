'use client'

import PageWrapper from '@/components/shared/Wrappers/PageWrapper'
import { useState } from 'react'

export default function DesignSystemPage() {
    const [copiedClass, setCopiedClass] = useState<string | null>(null)

    const copyToClipboard = (className: string) => {
        navigator.clipboard.writeText(className)
        setCopiedClass(className)
        setTimeout(() => setCopiedClass(null), 2000)
    }

    const backgroundColors = [
        { name: 'hlb-0', value: '#97FBE4', class: 'bg-hlb-0', comment: 'Active hover' }, // hlt-4
        { name: 'hlb-1', value: '#50d2c1', class: 'bg-hlb-1', comment: 'Default green' },
        { name: 'hlb-2', value: '#949e9c', class: 'bg-hlb-2', comment: '' },
        { name: 'hlb-3', value: '#22ab94', class: 'bg-hlb-3', comment: '' },
        { name: 'hlb-4', value: '#ed7088', class: 'bg-hlb-4', comment: 'Negative' },
        { name: 'hlb-5', value: '#1fa67d', class: 'bg-hlb-5', comment: '' },
        { name: 'hlb-6', value: '#0a998133', class: 'bg-hlb-6', comment: 'Online' },
        { name: 'hlb-7', value: '#575e62', class: 'bg-hlb-7', comment: '' },
        { name: 'hlb-8', value: '#1e5d52', class: 'bg-hlb-8', comment: '' },
        { name: 'hlb-9', value: '#434651', class: 'bg-hlb-9', comment: '' },
        { name: 'hlb-10', value: '#732a36', class: 'bg-hlb-10', comment: '' },
        { name: 'hlb-11', value: '#17453f', class: 'bg-hlb-11', comment: '' },
        { name: 'hlb-12', value: '#363a45', class: 'bg-hlb-12', comment: '' },
        { name: 'hlb-13', value: '#2e313c', class: 'bg-hlb-13', comment: 'Tooltip' },
        { name: 'hlb-14', value: '#142e61', class: 'bg-hlb-14', comment: '' },
        { name: 'hlb-15', value: '#303030', class: 'bg-hlb-15', comment: 'Hover Selection' },
        { name: 'hlb-16', value: '#273035', class: 'bg-hlb-16', comment: '' },
        { name: 'hlb-17', value: '#2a2e39', class: 'bg-hlb-17', comment: '' },
        { name: 'hlb-18', value: '#0f3333', class: 'bg-hlb-18', comment: '' },
        { name: 'hlb-19', value: '#1b2429', class: 'bg-hlb-19', comment: 'BG and Footer' },
        { name: 'hlb-20', value: '#072723', class: 'bg-hlb-20', comment: '' },
        { name: 'hlb-21', value: '#0f1a1f', class: 'bg-hlb-21', comment: 'Card color for header etc' },
        { name: 'hlb-22', value: '#0f1a1f80', class: 'bg-hlb-22', comment: '' },
        { name: 'hlb-23', value: '#0f1a1fcc', class: 'bg-hlb-23', comment: '' },
        { name: 'hlb-24', value: '#0f1a1e', class: 'bg-hlb-24', comment: 'Real card background' },
        { name: 'hlb-25', value: '#131722', class: 'bg-hlb-25', comment: '' },
        { name: 'hlb-26', value: '#0000004d', class: 'bg-hlb-26', comment: '' },
    ]

    const textColors = [
        { name: 'hlt-1', value: '#ffffff', class: 'text-hlt-1', comment: '' },
        { name: 'hlt-2', value: '#f6fefd', class: 'text-hlt-2', comment: 'White' },
        { name: 'hlt-3', value: '#f0f3fa', class: 'text-hlt-3', comment: '' },
        { name: 'hlt-4', value: '#97fce4', class: 'text-hlt-4', comment: 'Active green' },
        { name: 'hlt-5', value: '#d2dad7', class: 'text-hlt-5', comment: '' },
        { name: 'hlt-6', value: '#bbd9fb', class: 'text-hlt-6', comment: '' },
        { name: 'hlt-7', value: '#d1d4dc', class: 'text-hlt-7', comment: '' },
        { name: 'hlt-8', value: '#50d2c1', class: 'text-hlt-8', comment: 'Online' },
        { name: 'hlt-9', value: '#ff9800', class: 'text-hlt-9', comment: '' },
        { name: 'hlt-10', value: '#9db2bd', class: 'text-hlt-10', comment: '' },
        { name: 'hlt-11', value: '#949e9c', class: 'text-hlt-11', comment: '' },
        { name: 'hlt-12', value: '#ed7088', class: 'text-hlt-12', comment: 'Negative' },
        { name: 'hlt-13', value: '#1fa67d', class: 'text-hlt-13', comment: 'Positive' },
        { name: 'hlt-14', value: '#25a48f', class: 'text-hlt-14', comment: '' },
        { name: 'hlt-15', value: '#f7525f', class: 'text-hlt-15', comment: '' },
        { name: 'hlt-16', value: '#ef5350', class: 'text-hlt-16', comment: '' },
        { name: 'hlt-17', value: '#868993', class: 'text-hlt-17', comment: '' },
        { name: 'hlt-18', value: '#089981', class: 'text-hlt-18', comment: '' },
        { name: 'hlt-19', value: '#808080', class: 'text-hlt-19', comment: '' },
        { name: 'hlt-20', value: '#787b86', class: 'text-hlt-20', comment: '' },
        { name: 'hlt-21', value: '#02231e', class: 'text-hlt-21', comment: '' },
        { name: 'hlt-22', value: '#0f1a1f80', class: 'text-hlt-22', comment: '' },
        { name: 'hlt-23', value: '#0f1a1fcc', class: 'text-hlt-23', comment: '' },
        { name: 'hlt-24', value: '#04060c', class: 'text-hlt-24', comment: '' },
    ]

    const fillColors = [
        { name: 'hlf-1', value: '#ffffff', class: 'bg-hlf-1', comment: '' },
        { name: 'hlf-2', value: '#f6fefd', class: 'bg-hlf-2', comment: '' },
        { name: 'hlf-3', value: '#d1d4dc', class: 'bg-hlf-3', comment: '' },
        { name: 'hlf-4', value: '#ffb648', class: 'bg-hlf-4', comment: '' },
        { name: 'hlf-5', value: '#50d2c1', class: 'bg-hlf-5', comment: 'Online dot' },
        { name: 'hlf-6', value: '#868993', class: 'bg-hlf-6', comment: '' },
        { name: 'hlf-7', value: '#089981', class: 'bg-hlf-7', comment: '' },
        { name: 'hlf-8', value: '#0f1a1f', class: 'bg-hlf-8', comment: '' },
        { name: 'hlf-9', value: '#000000', class: 'bg-hlf-9', comment: '' },
    ]

    const borderColors = [
        { name: 'hlr-1', value: '#ffffff1a', class: 'border-hlr-1', comment: '' },
        { name: 'hlr-2', value: '#50d2c1', class: 'border-hlr-2', comment: 'border-b selection' },
        { name: 'hlr-3', value: '#ff9800', class: 'border-hlr-3', comment: '' },
        { name: 'hlr-4', value: '#868993', class: 'border-hlr-4', comment: '' },
        { name: 'hlr-5', value: '#434651', class: 'border-hlr-5', comment: '' },
        { name: 'hlr-6', value: '#3e3e3e', class: 'border-hlr-6', comment: '' },
        { name: 'hlr-7', value: '#363a45', class: 'border-hlr-7', comment: 'Not the good one' },
        { name: 'hlr-8', value: '#142e61', class: 'border-hlr-8', comment: '' },
        { name: 'hlr-9', value: '#303030', class: 'border-hlr-9', comment: '' },
        { name: 'hlr-10', value: '#273035', class: 'border-hlr-10', comment: 'Footer' },
        { name: 'hlr-11', value: '#0f1a1f', class: 'border-hlr-11', comment: 'Header' },
        { name: 'hlr-12', value: '#000000', class: 'border-hlr-12', comment: '' },
    ]

    return (
        <PageWrapper>
            <div className="mx-auto max-w-7xl">
                <h1 className="text-3xl font-bold text-hlt-1">Design System Colors</h1>
                <p className="mb-8 text-hlt-17">
                    go on app.hyperliquid.xyz/trade {'>'} open console {'>'} cmd + shift + p {'>'} show CSS overview {'>'} capture and you get the
                    colors below
                </p>

                {/* Copied notification */}
                {copiedClass && (
                    <div className="fixed right-4 top-4 z-50 rounded-lg border border-hlr-2 bg-hlb-13 px-4 py-2 text-hlt-4 shadow-lg">
                        Copied: {copiedClass}
                    </div>
                )}

                {/* Background Colors */}
                <section className="mb-12">
                    <h2 className="mb-4 text-xl font-semibold text-hlt-7">Background Colors ({backgroundColors.length})</h2>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9">
                        {backgroundColors.map((color, index) => (
                            <div
                                key={color.name}
                                className="flex cursor-pointer flex-col items-center transition-opacity hover:opacity-80"
                                onClick={() => copyToClipboard(color.class)}>
                                {/* Use inline style for dynamic background color */}
                                <div
                                    className="relative mb-2 h-16 w-full overflow-hidden rounded border border-hlr-1"
                                    style={{ backgroundColor: color.value }}>
                                    {color.comment && (
                                        <span className="absolute left-1 top-1 rounded bg-black/30 p-1 font-medium text-white">{color.comment}</span>
                                    )}
                                </div>
                                <span className="text-center text-hlt-7">
                                    {index + 1}. {color.name}
                                </span>
                                <span className="text-center text-hlt-20">{color.value}</span>
                                <span className="mt-1 text-center text-hlt-4">{color.class}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Text Colors */}
                <section className="mb-12">
                    <h2 className="mb-4 text-xl font-semibold text-hlt-7">Text Colors ({textColors.length})</h2>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9">
                        {textColors.map((color, index) => (
                            <div
                                key={color.name}
                                className="flex cursor-pointer flex-col items-center transition-opacity hover:opacity-80"
                                onClick={() => copyToClipboard(color.class)}>
                                <div className="relative mb-2 flex h-16 w-full items-center justify-center rounded border border-hlr-1 bg-hlb-13">
                                    {color.comment && (
                                        <span className="absolute left-1 top-1 rounded bg-black/30 px-1 py-0.5 text-[10px] font-medium text-white">
                                            {color.comment}
                                        </span>
                                    )}
                                    <span className="text-2xl font-bold" style={{ color: color.value }}>
                                        Aa
                                    </span>
                                </div>
                                <span className="text-center text-hlt-7">
                                    {index + 1}. {color.name}
                                </span>
                                <span className="text-center text-hlt-20">{color.value}</span>
                                <span className="mt-1 text-center font-mono text-hlt-4">{color.class}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Fill Colors */}
                <section className="mb-12">
                    <h2 className="mb-4 text-xl font-semibold text-hlt-7">Fill Colors ({fillColors.length})</h2>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9">
                        {fillColors.map((color, index) => (
                            <div
                                key={color.name}
                                className="flex cursor-pointer flex-col items-center transition-opacity hover:opacity-80"
                                onClick={() => copyToClipboard(color.class)}>
                                <div
                                    className="relative mb-2 h-16 w-full overflow-hidden rounded border border-hlr-1"
                                    style={{ backgroundColor: color.value }}>
                                    {color.comment && (
                                        <span className="absolute left-1 top-1 rounded bg-black/30 px-1 py-0.5 text-[10px] font-medium text-white">
                                            {color.comment}
                                        </span>
                                    )}
                                </div>
                                <span className="text-center text-hlt-7">
                                    {index + 1}. {color.name}
                                </span>
                                <span className="text-center text-hlt-20">{color.value}</span>
                                <span className="mt-1 text-center font-mono text-hlt-4">{color.class}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Border Colors */}
                <section className="mb-12">
                    <h2 className="mb-4 text-xl font-semibold text-hlt-7">Border Colors ({borderColors.length})</h2>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9">
                        {borderColors.map((color, index) => (
                            <div
                                key={color.name}
                                className="flex cursor-pointer flex-col items-center transition-opacity hover:opacity-80"
                                onClick={() => copyToClipboard(color.class)}>
                                <div
                                    className="relative mb-2 h-16 w-full overflow-hidden rounded bg-hlb-13"
                                    style={{
                                        border: `4px solid ${color.value}`,
                                    }}>
                                    {color.comment && (
                                        <span className="absolute left-1 top-1 rounded bg-black/30 px-1 py-0.5 text-[10px] font-medium text-white">
                                            {color.comment}
                                        </span>
                                    )}
                                </div>
                                <span className="text-center text-hlt-7">
                                    {index + 1}. {color.name}
                                </span>
                                <span className="text-center text-hlt-20">{color.value}</span>
                                <span className="mt-1 text-center font-mono text-hlt-4">{color.class}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </PageWrapper>
    )
}
