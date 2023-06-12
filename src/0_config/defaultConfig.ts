import { IConfig } from "./IConfig";

export const defaultConfig: IConfig = {
    workerName: 'blocktank-lsp-btc',
    grapeUrl: 'http://127.0.0.1:30001',
    dbUrl: 'mongodb://localhost:27017/blocktank-lsp-http',
    rabbitMqUrl: 'amqp://localhost:5672',
    slackChannelName: undefined
}