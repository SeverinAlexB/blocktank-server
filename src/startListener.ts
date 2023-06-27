import { BlocktankDatabase, RabbitConnection, waitOnSigint } from "@synonymdev/blocktank-worker2";
import { AppConfig } from "./0_config/AppConfig";
import { BtcListener } from "./2_listeners/BtcListener";
import { LnListener } from "./2_listeners/LnListener";
import dbConfig from './mikro-orm.config'
import { OrderExpiredWatcher } from "./2_services/OrderExpiredWatcher";
import { getAppLogger } from "./1_logger/logger";


const logger = getAppLogger()
const config = AppConfig.get()
async function main() {
    const rabbitConnection = new RabbitConnection({
        amqpUrl: config.rabbitMqUrl
    })
    const btcListener = new BtcListener({
        connection: rabbitConnection
    })
    const lnListener = new LnListener({
        connection: rabbitConnection
    })

    const expiredWatcher = new OrderExpiredWatcher()

    

    try {
        await BlocktankDatabase.connect(dbConfig)
        await rabbitConnection.connect()
        await btcListener.start()
        await lnListener.start()
        expiredWatcher.start()
        logger.info('Start listening for BTC and LN events.')
        logger.info('Stop with Ctrl+C')
        await waitOnSigint()
    } catch (e) {
        console.error(e)
    } finally {
        logger.info('Stopping')
        await lnListener.stop()
        await btcListener.stop()
        await expiredWatcher.stop()
        await rabbitConnection.disconnect()
        await BlocktankDatabase.close()
    }
}


main()