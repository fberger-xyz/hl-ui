// rate limiting utilities

export class RateLimiter {
    private requests: number[] = []
    private readonly maxRequests: number
    private readonly windowMs: number

    constructor(maxRequests: number, windowMs: number) {
        this.maxRequests = maxRequests
        this.windowMs = windowMs
    }

    canMakeRequest(): boolean {
        const now = Date.now()
        // remove old requests outside window
        this.requests = this.requests.filter((time) => now - time < this.windowMs)

        if (this.requests.length < this.maxRequests) {
            this.requests.push(now)
            return true
        }
        return false
    }

    reset(): void {
        this.requests = []
    }
}
