import { LevelWithSilent } from 'pino'


export interface IConfig {
    workerName: string,
    grapeUrl: string,
    dbUrl: string,
    rabbitMqUrl: string,
    slackChannelName?: string,
    http: {
        port: number,
        host: string
    },
    redisPath: string,
    channels: {
        orderExpiryS: number,
        basePriceSat: number,
        minExpiryWeeks: number,
        maxExpiryWeeks: number,
        minSizeSat: number,
        maxSizeSat: number,
        maxSizeUsd: number
    },
    logging: {
        file?: string,
        level: LevelWithSilent
    },
}