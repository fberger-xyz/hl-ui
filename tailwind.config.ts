// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
    darkMode: 'class',
    content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
    theme: {
        extend: {
            fontFamily: {
                inter: ['var(--font-inter)', 'sans-serif'],
                'inter-tight': ['var(--font-inter-tight)', 'sans-serif'],
            },
            colors: {
                // background colors
                hlb: {
                    '0': 'hsl(var(--hl-background-0) / <alpha-value>)', // #97FBE4
                    '1': 'hsl(var(--hl-background-1) / <alpha-value>)', // #50d2c1
                    '2': 'hsl(var(--hl-background-2) / <alpha-value>)', // #949e9c
                    '3': 'hsl(var(--hl-background-3) / <alpha-value>)', // #22ab94
                    '4': 'hsl(var(--hl-background-4) / <alpha-value>)', // #ed7088
                    '5': 'hsl(var(--hl-background-5) / <alpha-value>)', // #1fa67d
                    '6': 'hsl(var(--hl-background-6))', // #0a998133
                    '7': 'hsl(var(--hl-background-7) / <alpha-value>)', // #575e62
                    '8': 'hsl(var(--hl-background-8) / <alpha-value>)', // #1e5d52
                    '9': 'hsl(var(--hl-background-9) / <alpha-value>)', // #434651
                    '10': 'hsl(var(--hl-background-10) / <alpha-value>)', // #732a36
                    '11': 'hsl(var(--hl-background-11) / <alpha-value>)', // #17453f
                    '12': 'hsl(var(--hl-background-12) / <alpha-value>)', // #363a45
                    '13': 'hsl(var(--hl-background-13) / <alpha-value>)', // #2e313c
                    '14': 'hsl(var(--hl-background-14) / <alpha-value>)', // #142e61
                    '15': 'hsl(var(--hl-background-15) / <alpha-value>)', // #303030
                    '16': 'hsl(var(--hl-background-16) / <alpha-value>)', // #273035
                    '17': 'hsl(var(--hl-background-17) / <alpha-value>)', // #2a2e39
                    '18': 'hsl(var(--hl-background-18) / <alpha-value>)', // #0f3333
                    '19': 'hsl(var(--hl-background-19) / <alpha-value>)', // #1b2429
                    '20': 'hsl(var(--hl-background-20) / <alpha-value>)', // #072723
                    '21': 'hsl(var(--hl-background-21) / <alpha-value>)', // #0f1a1f
                    '22': 'hsl(var(--hl-background-22))', // #0f1a1f80
                    '23': 'hsl(var(--hl-background-23))', // #0f1a1fcc
                    '24': 'hsl(var(--hl-background-24) / <alpha-value>)', // #0f1a1e
                    '25': 'hsl(var(--hl-background-25) / <alpha-value>)', // #131722
                    '26': 'hsl(var(--hl-background-26))', // #0000004d
                },

                // text colors
                hlt: {
                    '1': 'hsl(var(--hl-text-1) / <alpha-value>)', // #ffffff
                    '2': 'hsl(var(--hl-text-2) / <alpha-value>)', // #f6fefd
                    '3': 'hsl(var(--hl-text-3) / <alpha-value>)', // #f0f3fa
                    '4': 'hsl(var(--hl-text-4) / <alpha-value>)', // #97fce4
                    '5': 'hsl(var(--hl-text-5) / <alpha-value>)', // #d2dad7
                    '6': 'hsl(var(--hl-text-6) / <alpha-value>)', // #bbd9fb
                    '7': 'hsl(var(--hl-text-7) / <alpha-value>)', // #d1d4dc
                    '8': 'hsl(var(--hl-text-8) / <alpha-value>)', // #50d2c1
                    '9': 'hsl(var(--hl-text-9) / <alpha-value>)', // #ff9800
                    '10': 'hsl(var(--hl-text-10) / <alpha-value>)', // #9db2bd
                    '11': 'hsl(var(--hl-text-11) / <alpha-value>)', // #949e9c
                    '12': 'hsl(var(--hl-text-12) / <alpha-value>)', // #ed7088
                    '13': 'hsl(var(--hl-text-13) / <alpha-value>)', // #1fa67d
                    '14': 'hsl(var(--hl-text-14) / <alpha-value>)', // #25a48f
                    '15': 'hsl(var(--hl-text-15) / <alpha-value>)', // #f7525f
                    '16': 'hsl(var(--hl-text-16) / <alpha-value>)', // #ef5350
                    '17': 'hsl(var(--hl-text-17) / <alpha-value>)', // #868993
                    '18': 'hsl(var(--hl-text-18) / <alpha-value>)', // #089981
                    '19': 'hsl(var(--hl-text-19) / <alpha-value>)', // #808080
                    '20': 'hsl(var(--hl-text-20) / <alpha-value>)', // #787b86
                    '21': 'hsl(var(--hl-text-21) / <alpha-value>)', // #02231e
                    '22': 'hsl(var(--hl-text-22))', // #0f1a1f80
                    '23': 'hsl(var(--hl-text-23))', // #0f1a1fcc
                    '24': 'hsl(var(--hl-text-24) / <alpha-value>)', // #04060c
                },

                // fill colors
                hlf: {
                    '1': 'hsl(var(--hl-fill-1) / <alpha-value>)', // #ffffff
                    '2': 'hsl(var(--hl-fill-2) / <alpha-value>)', // #f6fefd
                    '3': 'hsl(var(--hl-fill-3) / <alpha-value>)', // #d1d4dc
                    '4': 'hsl(var(--hl-fill-4) / <alpha-value>)', // #ffb648
                    '5': 'hsl(var(--hl-fill-5) / <alpha-value>)', // #50d2c1
                    '6': 'hsl(var(--hl-fill-6) / <alpha-value>)', // #868993
                    '7': 'hsl(var(--hl-fill-7) / <alpha-value>)', // #089981
                    '8': 'hsl(var(--hl-fill-8) / <alpha-value>)', // #0f1a1f
                    '9': 'hsl(var(--hl-fill-9) / <alpha-value>)', // #000000
                },

                // border colors
                hlr: {
                    '1': 'hsl(var(--hl-border-1))', // #ffffff1a
                    '2': 'hsl(var(--hl-border-2) / <alpha-value>)', // #50d2c1
                    '3': 'hsl(var(--hl-border-3) / <alpha-value>)', // #ff9800
                    '4': 'hsl(var(--hl-border-4) / <alpha-value>)', // #868993
                    '5': 'hsl(var(--hl-border-5) / <alpha-value>)', // #434651
                    '6': 'hsl(var(--hl-border-6) / <alpha-value>)', // #3e3e3e
                    '7': 'hsl(var(--hl-border-7) / <alpha-value>)', // #363a45
                    '8': 'hsl(var(--hl-border-8) / <alpha-value>)', // #142e61
                    '9': 'hsl(var(--hl-border-9) / <alpha-value>)', // #303030
                    '10': 'hsl(var(--hl-border-10) / <alpha-value>)', // #273035
                    '11': 'hsl(var(--hl-border-11) / <alpha-value>)', // #0f1a1f
                    '12': 'hsl(var(--hl-border-12) / <alpha-value>)', // #000000
                },

                // misc.
                star: '#FFB647',
            },

            // animations (unchanged)
            animation: {
                'skeleton-move': 'skeleton-move 2s infinite',
                flash: 'flash 0.8s ease-in-out',
                'gradient-shift': 'gradient-shift 3s ease-in-out infinite',
            },
            keyframes: {
                'skeleton-move': {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' },
                },
                'gradient-shift': {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                },
            },
        },
    },
    plugins: [],
    safelist: [
        // background colors
        'bg-hlb-0',
        'bg-hlb-1',
        'bg-hlb-2',
        'bg-hlb-3',
        'bg-hlb-4',
        'bg-hlb-5',
        'bg-hlb-6',
        'bg-hlb-7',
        'bg-hlb-8',
        'bg-hlb-9',
        'bg-hlb-10',
        'bg-hlb-11',
        'bg-hlb-12',
        'bg-hlb-13',
        'bg-hlb-14',
        'bg-hlb-15',
        'bg-hlb-16',
        'bg-hlb-17',
        'bg-hlb-18',
        'bg-hlb-19',
        'bg-hlb-20',
        'bg-hlb-21',
        'bg-hlb-22',
        'bg-hlb-23',
        'bg-hlb-24',
        'bg-hlb-25',
        'bg-hlb-26',
        // background with opacity
        'bg-hlb-1/80',
        'bg-hlb-9/10',
        'bg-hlb-21/80',
        // text colors
        'text-hlt-1',
        'text-hlt-2',
        'text-hlt-3',
        'text-hlt-4',
        'text-hlt-5',
        'text-hlt-6',
        'text-hlt-7',
        'text-hlt-8',
        'text-hlt-9',
        'text-hlt-10',
        'text-hlt-11',
        'text-hlt-12',
        'text-hlt-13',
        'text-hlt-14',
        'text-hlt-15',
        'text-hlt-16',
        'text-hlt-17',
        'text-hlt-18',
        'text-hlt-19',
        'text-hlt-20',
        'text-hlt-21',
        'text-hlt-22',
        'text-hlt-23',
        'text-hlt-24',
        // fill colors (using bg- prefix)
        'bg-hlf-1',
        'bg-hlf-2',
        'bg-hlf-3',
        'bg-hlf-4',
        'bg-hlf-5',
        'bg-hlf-6',
        'bg-hlf-7',
        'bg-hlf-8',
        'bg-hlf-9',
        // border colors
        'border-hlr-1',
        'border-hlr-2',
        'border-hlr-3',
        'border-hlr-4',
        'border-hlr-5',
        'border-hlr-6',
        'border-hlr-7',
        'border-hlr-8',
        'border-hlr-9',
        'border-hlr-10',
        'border-hlr-11',
        'border-hlr-12',
    ],
}

export default config
