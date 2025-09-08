import type { Metadata } from 'next'
import './globals.css'
import { APP_METADATA } from '@/config/app.config'
import { Inter, Inter_Tight } from 'next/font/google'
import { cn } from '@/utils'

// font configurations
const INTER_FONT = Inter({
    weight: ['400', '700', '900'],
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
})

const INTER_TIGHT_FONT = Inter_Tight({
    weight: ['400', '500', '600', '700'],
    subsets: ['latin'],
    variable: '--font-inter-tight',
    display: 'swap',
})

import { Suspense } from 'react'
import { Toaster } from 'react-hot-toast'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorBoundaryFallback } from '@/components/shared/ErrorBoundary/ErrorBoundaryFallback'
import { HeaderDesktop, HeaderMobile } from '@/components/features/layout/Header'
import Footer from '@/components/features/layout/Footer'
import DefaultFallback from '@/components/features/layout/DefaultFallback'
import { ThemeProvider } from 'next-themes'
import { AppThemes } from '@/enums'
import PWAProvider from '@/providers/pwa.provider'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { Analytics } from '@vercel/analytics/next'
import { ChunkErrorHandler } from '@/components/shared/ErrorBoundary/ChunkErrorHandler'
import WalletProviders from './providers'
import { WebSocketDebugger } from '@/components/features/debug/WebSocketDebugger'

// note: 1500x500 dimensions work well for twitter's 3:1 aspect ratio
// standard opengraph recommends 1200x630, but twitter handles this size well
const image = {
    url: '/1500x500.jpeg',
    width: 1500,
    height: 500,
    alt: `${APP_METADATA.SITE_NAME} - ${APP_METADATA.SITE_DESCRIPTION}`,
    type: 'image/jpeg',
}

export const metadata: Metadata = {
    // basic metadata
    title: {
        default: APP_METADATA.SITE_NAME,
        template: `%s | ${APP_METADATA.SITE_NAME}`,
    },
    description: APP_METADATA.SITE_DESCRIPTION,
    metadataBase: new URL(APP_METADATA.SITE_URL),

    // icons
    icons: {
        icon: [
            { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
            { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
            { url: '/favicon.png', type: 'image/png' },
        ],
        shortcut: '/favicon.png',
        apple: '/apple-touch-icon.png',
    },

    // pwa & mobile
    appleWebApp: {
        title: APP_METADATA.SHORT_NAME,
        capable: true,
        statusBarStyle: 'black-translucent',
        startupImage: '/apple-touch-icon.png',
    },

    // opengraph
    openGraph: {
        type: 'website',
        title: APP_METADATA.SITE_NAME,
        siteName: APP_METADATA.SITE_NAME,
        description: APP_METADATA.SITE_DESCRIPTION,
        url: APP_METADATA.SITE_URL,
        images: [image],
        locale: 'en_US',
    },

    // twitter/x
    twitter: {
        card: 'summary_large_image',
        site: APP_METADATA.AUTHOR.twitter,
        creator: APP_METADATA.AUTHOR.twitter,
        title: APP_METADATA.SITE_NAME,
        description: APP_METADATA.SITE_DESCRIPTION,
        images: [image],
    },

    // additional metadata
    keywords: [],
    authors: [{ name: APP_METADATA.AUTHOR.name, url: APP_METADATA.AUTHOR.url }],
    category: 'finance',
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
}

const Providers = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider attribute="class" defaultTheme={AppThemes.LIGHT} disableTransitionOnChange themes={Object.values(AppThemes)}>
        <WalletProviders>
            <NuqsAdapter>{children}</NuqsAdapter>
        </WalletProviders>
    </ThemeProvider>
)

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: APP_METADATA.SITE_NAME,
        description: APP_METADATA.SITE_DESCRIPTION,
        url: APP_METADATA.SITE_URL,
        applicationCategory: APP_METADATA.STRUCTURED_DATA.applicationCategory,
        operatingSystem: APP_METADATA.STRUCTURED_DATA.operatingSystem,
        author: {
            '@type': 'Person',
            name: APP_METADATA.AUTHOR.name,
            url: APP_METADATA.AUTHOR.url,
        },
    }

    return (
        <html lang="en" suppressHydrationWarning className="bg-hlb-19 text-hlt-2">
            <head>
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
            </head>
            <body className={cn(INTER_FONT.className, INTER_FONT.variable, INTER_TIGHT_FONT.variable, 'relative min-h-screen w-full text-xs')}>
                <PWAProvider>
                    <Providers>
                        <main className="flex min-h-screen flex-col">
                            <Suspense fallback={null}>
                                <HeaderDesktop />
                                <HeaderMobile />
                            </Suspense>
                            <Suspense fallback={<DefaultFallback />}>
                                <ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>{children}</ErrorBoundary>
                            </Suspense>
                            <Suspense fallback={null}>
                                <Footer />
                            </Suspense>
                            <Toaster
                                position="bottom-right"
                                reverseOrder={true}
                                toastOptions={{
                                    style: {
                                        background: 'transparent',
                                        boxShadow: 'none',
                                        padding: 0,
                                    },
                                }}
                            />
                        </main>
                    </Providers>
                </PWAProvider>
                <Analytics />
                <ChunkErrorHandler />
                {process.env.NODE_ENV === 'development' && <WebSocketDebugger />}
            </body>
        </html>
    )
}
