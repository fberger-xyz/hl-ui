import { NextRequest, NextResponse } from 'next/server'

// hyperliquid api proxy to handle cors
const HL_REST_URL = 'https://api.hyperliquid.xyz/info'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()

        // forward request to hyperliquid api
        const response = await fetch(HL_REST_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        })

        if (!response.ok) return NextResponse.json({ error: `Hyperliquid API error: ${response.status}` }, { status: response.status })
        const data = await response.json()

        // return with proper cors headers
        return NextResponse.json(data, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        })
    } catch (error) {
        console.error('Proxy error:', error)
        return NextResponse.json({ error: 'Failed to proxy request' }, { status: 500 })
    }
}

// handle preflight requests
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    })
}
