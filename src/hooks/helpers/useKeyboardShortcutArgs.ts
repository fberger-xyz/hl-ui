import { useEffect } from 'react'

type KeyboardShortcutArgs = {
    key: string
    shiftKey?: boolean
    ctrlKey?: boolean
    metaKey?: boolean
    altKey?: boolean
    callback: () => void
    enabled?: boolean
}

export function useKeyboardShortcut({
    key,
    shiftKey = false,
    ctrlKey = false,
    metaKey = false,
    altKey = false,
    callback,
    enabled = true,
}: KeyboardShortcutArgs) {
    useEffect(() => {
        if (!enabled) return

        const handler = (event: KeyboardEvent) => {
            if (
                event.key.toLowerCase() === key.toLowerCase() &&
                event.shiftKey === shiftKey &&
                event.ctrlKey === ctrlKey &&
                event.metaKey === metaKey &&
                event.altKey === altKey
            ) {
                event.preventDefault()
                callback()
            }
        }

        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [key, shiftKey, ctrlKey, metaKey, altKey, callback, enabled])
}
