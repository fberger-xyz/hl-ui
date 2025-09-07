import { AppUrls } from '@/enums/app.enum'
import { env } from '@/env/t3-env'

const SITE_NAME = 'Hyperliquid MVP UI'
const SITE_DOMAIN = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const SITE_URL = SITE_DOMAIN.replace('www.', '')

export const APP_METADATA = {
    SITE_NAME,
    SHORT_NAME: 'Hyperliquid MVP UI',
    SITE_DOMAIN,
    SITE_DESCRIPTION: 'Next.js 15 w/ TypeScript, Tailwind CSS, Zustand',
    SITE_URL: SITE_URL,
    AUTHOR: {
        name: 'fberger',
        twitter: '@fberger_xyz',
        url: 'https://x.com/fberger_xyz',
    },
    STRUCTURED_DATA: {
        applicationCategory: 'WebApplication',
        operatingSystem: 'Any',
        price: '0',
        priceCurrency: 'USD',
        about: {
            name: SITE_NAME,
            description: 'Next.js 15 w/ TypeScript, Tailwind CSS, Zustand',
        },
    },
}

export const APP_PAGES: {
    name: string
    path: string
}[] = [
    {
        path: AppUrls.TRADE,
        name: 'Trade',
    },
] as const
