import { IConfig } from "./IConfig";

export const defaultConfig: IConfig = {
    workerName: 'blocktank-lsp-http',
    grapeUrl: 'http://127.0.0.1:30001',
    dbUrl: 'mongodb://localhost:27017/blocktank-lsp-http',
    rabbitMqUrl: 'amqp://localhost:5672',
    slackChannelName: undefined,
    http: {
        port: 9000,
        host: '127.0.0.1'
    },
    redisPath: 'localhost:6379'
}