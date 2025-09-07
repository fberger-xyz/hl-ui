/* eslint-disable @typescript-eslint/no-explicit-any */

// throttle function calls to limit update frequency
export function throttle<T extends (...args: any[]) => void>(fn: T, delay: number): (...args: Parameters<T>) => void {
    let lastCall = 0
    let timeout: NodeJS.Timeout | null = null
    let lastArgs: Parameters<T> | null = null

    return (...args: Parameters<T>) => {
        const now = Date.now()
        lastArgs = args

        if (now - lastCall >= delay) {
            // enough time passed, execute immediately
            lastCall = now
            fn(...args)
            // clear any pending timeout
            if (timeout) {
                clearTimeout(timeout)
                timeout = null
            }
        } else if (!timeout) {
            // schedule update at next allowed time
            timeout = setTimeout(
                () => {
                    if (lastArgs) {
                        lastCall = Date.now()
                        fn(...lastArgs)
                        lastArgs = null
                    }
                    timeout = null
                },
                delay - (now - lastCall),
            )
        }
        // if timeout exists, we skip this call but keep the latest args
    }
}

// throttle with requestAnimationFrame for smooth ui updates
export function throttleRaf<T extends (...args: any[]) => void>(fn: T): (...args: Parameters<T>) => void {
    let rafId: number | null = null
    let lastArgs: Parameters<T> | null = null

    return (...args: Parameters<T>) => {
        lastArgs = args

        if (!rafId) {
            rafId = requestAnimationFrame(() => {
                if (lastArgs) {
                    fn(...lastArgs)
                    lastArgs = null
                }
                rafId = null
            })
        }
    }
}
