import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
    // server-side env vars schema

    server: {},

    // specify your client-side environment variables schema here
    // for them to be exposed to the client, prefix them with next_public_

    client: {
        NEXT_PUBLIC_APP_URL: z.string().min(1),
        NEXT_PUBLIC_COMMIT_TIMESTAMP: z.string().optional(),
        NEXT_PUBLIC_PRIVY_APP_ID: z.string().optional(),
        NEXT_PUBLIC_USE_SHARED_WORKER: z.string().optional(), // switch between shared worker and direct websocket
    },

    // destructure all variables from process.env to make sure they aren't tree-shaken away

    runtimeEnv: {
        // server
        // none

        // client
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        NEXT_PUBLIC_COMMIT_TIMESTAMP: process.env.NEXT_PUBLIC_COMMIT_TIMESTAMP,
        NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
        NEXT_PUBLIC_USE_SHARED_WORKER: process.env.NEXT_PUBLIC_USE_SHARED_WORKER,
    },

    emptyStringAsUndefined: true,
})
