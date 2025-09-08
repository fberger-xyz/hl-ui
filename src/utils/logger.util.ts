// custom logger with configurable levels
// allows selective logging for debugging without cluttering console

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'render'

interface LoggerConfig {
    debug: boolean
    info: boolean
    warn: boolean
    error: boolean
    render: boolean // special level for component render logs
}

// configure which levels are active
const config: LoggerConfig = {
    debug: false,
    info: true,
    warn: true,
    error: true,
    render: true, // toggle to see render logs like "render: TradingChart"
}

class Logger {
    private config: LoggerConfig

    constructor(config: LoggerConfig) {
        this.config = config
    }

    // enable/disable log levels
    setLevel(level: LogLevel, enabled: boolean) {
        this.config[level] = enabled
    }

    // toggle render logs specifically
    toggleRenderLogs(enabled?: boolean) {
        this.config.render = enabled ?? !this.config.render
    }

    debug(...args: unknown[]) {
        if (this.config.debug) console.log(...args)
    }

    info(...args: unknown[]) {
        if (this.config.info) console.log(...args)
    }

    warn(...args: unknown[]) {
        if (this.config.warn) console.warn(...args)
    }

    error(...args: unknown[]) {
        if (this.config.error) console.error(...args)
    }

    // special method for render logs
    render(component: string, ...args: unknown[]) {
        if (this.config.render) {
            console.log(`render: ${component}`, new Date(), ...args)
        }
    }

    // log with specific level
    log(level: LogLevel, ...args: unknown[]) {
        if (this.config[level]) {
            switch (level) {
                case 'debug':
                case 'info':
                    console.log(...args)
                    break
                case 'warn':
                    console.warn(...args)
                    break
                case 'error':
                    console.error(...args)
                    break
                case 'render':
                    console.log(`render:`, ...args)
                    break
            }
        }
    }
}

// singleton instance
export const logger = new Logger(config)

// expose config for runtime changes
export const setLogLevel = (level: LogLevel, enabled: boolean) => {
    logger.setLevel(level, enabled)
}

// convenient toggle for render logs
export const toggleRenderLogs = (enabled?: boolean) => {
    logger.toggleRenderLogs(enabled)
}
