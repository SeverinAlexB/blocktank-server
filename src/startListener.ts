import { BlocktankDatabase, RabbitConnection, waitOnSigint } from "@synonymdev/blocktank-worker2";
import { AppConfig } from "./0_config/AppConfig";
import { BtcListener } from "./2_listeners/BtcListener";
import { LnListener } from "./2_listeners/LnListener";
import dbConfig from './mikro-orm.config'

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

    

    try {
        await BlocktankDatabase.connect(dbConfig)
        await rabbitConnection.connect()
        await btcListener.start()
        await lnListener.start()
        console.log('Start listening for BTC and LN events.')
        console.log('Stop with Ctrl+C')
        await waitOnSigint()
    } catch (e) {
        console.error(e)
    } finally {
        console.log('Stopping')
        await lnListener.stop()
        await btcListener.stop()
        await rabbitConnection.disconnect()
        await BlocktankDatabase.close()
    }
}


main()