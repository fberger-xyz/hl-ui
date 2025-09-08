import numeral from 'numeral'

export const formatAmount = (amount: number | string | null | undefined, currency = '$') => {
    try {
        // guard: null/undefined
        if (amount === null || amount === undefined || amount === '') return currency === '$' ? '$0' : '0'
        const isNegative = Number(amount) < 0
        const absAmount = Math.abs(Number(amount))
        if (absAmount < 1.15)
            // stablecoin precision around 1$
            return numeral(absAmount)
                .multiply(isNegative ? -1 : 1)
                .format(`${currency}0,0.[00000]`)
        if (absAmount < 10)
            return numeral(absAmount)
                .multiply(isNegative ? -1 : 1)
                .format(`${currency}0,0.[0000]`)
        if (absAmount < 100)
            return numeral(absAmount)
                .multiply(isNegative ? -1 : 1)
                .format(`${currency}0,0.[000]`)
        if (absAmount < 10000)
            return numeral(absAmount)
                .multiply(isNegative ? -1 : 1)
                .format(`${currency}0,0.[0]`)
        if (absAmount < 1000000)
            return numeral(absAmount)
                .multiply(isNegative ? -1 : 1)
                .format(`${currency}0,0`)
        if (absAmount >= 1000000000)
            return numeral(absAmount)
                .multiply(isNegative ? -1 : 1)
                .format(`${currency}0,0.[0]a`)
        return `${numeral(absAmount)
            .divide(1000000)
            .multiply(isNegative ? -1 : 1)
            .format(`${currency}0,0`)}m`
    } catch (error) {
        console.error(error)
        return `error ${amount}`
    }
}

export const extractErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message
    if (typeof error === 'string') return error
    return 'An unknown error occurred'
}
