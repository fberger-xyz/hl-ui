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
