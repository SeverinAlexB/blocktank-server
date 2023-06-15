
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
        basePriceSat: number
    }
}