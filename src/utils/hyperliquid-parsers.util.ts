// shared parsing utilities for hyperliquid data transformations

// convert side notation to buy/sell
export const parseSide = (side: string): 'buy' | 'sell' => {
    return side === 'B' ? 'buy' : 'sell'
}

// calculate value from size and price
export const calculateValue = (size: string | number, price: string | number): string => {
    const sizeNum = typeof size === 'string' ? parseFloat(size) : size
    const priceNum = typeof price === 'string' ? parseFloat(price) : price
    return (sizeNum * priceNum).toString()
}

// parse position side from size
export const parsePositionSide = (size: string | number): 'long' | 'short' => {
    const sizeNum = typeof size === 'string' ? parseFloat(size) : size
    return sizeNum > 0 ? 'long' : 'short'
}

// safely get nested property with fallback
export const getNestedValue = <T>(obj: unknown, paths: string[], defaultValue: T): T => {
    for (const path of paths) {
        const keys = path.split('.')
        let value = obj as Record<string, unknown>
        for (const key of keys) {
            value = value?.[key] as Record<string, unknown>
            if (value === undefined) break
        }
        if (value !== undefined) return value as T
    }
    return defaultValue
}

// safely parse number with fallback
export const safeParseFloat = (value: unknown, defaultValue: number = 0): number => {
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
        const parsed = parseFloat(value)
        return isNaN(parsed) ? defaultValue : parsed
    }
    return defaultValue
}
