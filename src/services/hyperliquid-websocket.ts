// single entry point for websocket implementation
// switches between shared worker and direct based on env variable

import { env } from '@/env/t3-env'
import { logger } from '@/utils/logger.util'

// switch implementations with one variable
const USE_SHARED_WORKER = env.NEXT_PUBLIC_USE_SHARED_WORKER === 'true'

// import both implementations
import { hyperliquidWS as directClient } from './hyperliquid-websocket-client'
import { hyperliquidSharedWS as sharedClient } from './hyperliquid-websocket-sharedworker'

// export the chosen implementation
export const hyperliquidWS = USE_SHARED_WORKER ? sharedClient : directClient

// log which implementation is being used
if (typeof window !== 'undefined') {
    logger.info(`Using ${USE_SHARED_WORKER ? 'SharedWorker' : 'Direct'} WebSocket implementation`)
}
