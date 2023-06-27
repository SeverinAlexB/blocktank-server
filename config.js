module.exports = {
    workerName: 'blocktank-lsp-http',
    grapeUrl: 'http://127.0.0.1:30001',
    dbUrl: 'mongodb://localhost:27017/blocktank-lsp-http',
    rabbitMqUrl: 'amqp://localhost:5672',
    slackChannelName: undefined,
    http: {
        port: 9000,
        host: '127.0.0.1'
    },
    redisPath: 'localhost:6379',
    channels: {
        orderExpiryS: 30*60,
        basePriceSat: 0,
        minExpiryWeeks: 0,
        maxExpiryWeeks: 12,
        minSizeSat: 20000,
        maxSizeSat: 20*1000*1000,
        maxSizeUsd: 999
    }
}