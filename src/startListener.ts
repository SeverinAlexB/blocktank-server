import { BlocktankDatabase, RabbitConnection, waitOnSigint } from "@synonymdev/blocktank-worker2";
import { AppConfig } from "./0_config/AppConfig";
import { BtcListener } from "./2_listeners/BtcListener";
import { LnInvoiceListener } from "./2_listeners/LnInvoiceListener";
import dbConfig from './mikro-orm.config'
import { OrderExpiredWatcher } from "./2_services/OrderExpiredWatcher";
import { getAppLogger } from "./1_logger/logger";
import { LnChannelListener } from "./2_listeners/LnChannelListener";


const logger = getAppLogger()
const config = AppConfig.get()
async function main() {
    const rabbitConnection = new RabbitConnection({
        amqpUrl: config.rabbitMqUrl
    })
    const btcListener = new BtcListener({
        connection: rabbitConnection
    })
    const lnInvoiceListener = new LnInvoiceListener({
        connection: rabbitConnection
    })
    const lnChannelListener = new LnChannelListener({
        connection: rabbitConnection
    })

    const expiredWatcher = new OrderExpiredWatcher()

    

    try {
        await BlocktankDatabase.connect(dbConfig)
        await rabbitConnection.connect()
        await btcListener.start()
        await lnInvoiceListener.start()
        await lnChannelListener.start()
        expiredWatcher.start()
        logger.info('Start listening for BTC and LN events.')
        logger.info('Stop with Ctrl+C')
        await waitOnSigint()
    } catch (e) {
        console.error(e)
    } finally {
        logger.info('Stopping')
        await expiredWatcher.stop()
        await lnInvoiceListener.stop()
        await btcListener.stop()
        await lnChannelListener.stop()
        await rabbitConnection.disconnect()
        await BlocktankDatabase.close()
    }
}


main()