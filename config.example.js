module.exports = {
    workerName: 'blocktank-lsp-http',       // Name of the worker on the Grape DHT. Do not change if you don't know what you are doing.
    grapeUrl: 'http://127.0.0.1:30001',     // Grape DHT URL. 
    dbUrl: 'mongodb://localhost:27017/blocktank-lsp-http',   // MongoDB URL.
    rabbitMqUrl: 'amqp://localhost:5672',   // RabbitMQ URL.
    slackChannelName: undefined,            // Name of the slack channel configured in https://github.com/synonymdev/blocktank-slack-bot. Falsy values will not send slack messages.
    http: {                                 // Http server config
        port: 9000,                         // Server port
        host: '127.0.0.1'                   // Server listening.
    },
    redisPath: 'localhost:6379',            // Redis connection string
    channels: {
        orderExpiryS: 30*60,                // Order expiry duration in seconds.
        basePriceSat: 0,                    // Base fee that is added to every order.
        minExpiryWeeks: 1,                  // Minimal number of weeks a channel needs to be leased for.
        maxExpiryWeeks: 52,                 // Maximal number of weeks a channel can be leased for.
        minSizeSat: 0,                      // Minimal channel size in satoshi.
        maxSizeSat: Number.MAX_SAFE_INTEGER,// Maximal channel size in satoshi.
        maxSizeUsd: Number.MAX_SAFE_INTEGER,// Maximal channel size in USD.
        minPaymentConfirmations: 0,         // Number of block confirmations a payment is seen as accepted. 0 means 0conf. Unsafe 0conf will be rejected.
        minPaymentConfirmationsClientBalance: 1,    // Number of block confirmations a payment is seen as accepted if it includes a client balance.
    },
    logging: {
        file: undefined,                    // File to log to. May be undefined.
        level: 'info'                       // Log level
    }
}
