import { useState, useEffect } from 'react'

function useMediaQuery(query: string): boolean {
    // default to false for ssr
    const [matches, setMatches] = useState(false)

    useEffect(() => {
        const media = window.matchMedia(query)

        // set initial value
        setMatches(media.matches)

        // setup listener
        const listener = (e: MediaQueryListEvent) => setMatches(e.matches)

        // modern browsers
        if (media.addEventListener) {
            media.addEventListener('change', listener)
            return () => media.removeEventListener('change', listener)
        }

        // legacy browsers
        media.addListener(listener)
        return () => media.removeListener(listener)
    }, [query])

    return matches
}

// convenient hook for desktop detection
export function useIsDesktop(): boolean {
    return useMediaQuery('(min-width: 768px)')
}
