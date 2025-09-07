import { Metadata } from 'next'
import TradeClient from '@/components/templates/TradeClient/TradeClient'

// generate metadata for the page
export async function generateMetadata(): Promise<Metadata> {
    return {
        title: 'Trade',
        description: 'Trade',
    }
}

export default function TradePage() {
    return <TradeClient />
}
