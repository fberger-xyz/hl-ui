import { createConfig, http } from 'wagmi'
import { arbitrum } from 'wagmi/chains'

export const wagmiConfig = createConfig({
    chains: [arbitrum],
    transports: {
        [arbitrum.id]: http(),
    },
})
