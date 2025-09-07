import toast from 'react-hot-toast'

export const showNotImplementedToast = (message?: string) => {
    toast(message || 'Feature not yet implemented', {
        duration: 2000,
        position: 'bottom-center',
        id: 'not-implemented',
        style: {
            background: '#2e313c',
            color: '#ffffff',
            borderRadius: '0.25rem',
            padding: '0.3rem 0.5rem',
            zIndex: 9999,
        },
    })
}

// might be useful for later, with a command+k palette, to visually confirm shortcuts made by user
export const showKeyboardToast = (keyName: string) => {
    toast(keyName, {
        duration: 800,
        position: 'bottom-center',
        id: 'keyboard-key',
        style: {
            background: '#2e313c',
            color: '#ffffff',
            borderRadius: '0.5rem',
            padding: '0.5rem 1rem',
            fontFamily: 'monospace',
            fontWeight: 500,
            border: '1px solid rgba(67, 70, 81, 0.5)',
            zIndex: 9999,
        },
    })
}
