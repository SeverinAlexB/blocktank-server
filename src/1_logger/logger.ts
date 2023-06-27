import pino from 'pino'
import pretty from 'pino-pretty'
import * as fs from 'fs'
import { AppConfig } from '../0_config/AppConfig';


const isJestRunning = process.env.JEST_WORKER_ID !== undefined;

const config = AppConfig.get()

function fileStream(file: string) {
    return {
        stream: fs.createWriteStream(file, {flags:'a'})
    } 
}

function prettyConsole() {
    return {
        stream: pretty({
        colorize: true,
        sync: true,
      })
    }
}

// function console() {
//     return {
//         stream: pretty({
//         colorize: false,
//         sync: true,
//       })
//     }
// }

const streams: any[] = []

if (!isJestRunning) {
    // Only log to console when not running tests
    streams.push(prettyConsole())
}

if (config.logging.file) {
    streams.push(fileStream(config.logging.file))
}

const globalLogger = pino({
    level: config.logging.level,
}, pino.multistream(streams))

export default globalLogger;


export function getAppLogger(className?: string): pino.Logger {
    return globalLogger.child({class: className})
}