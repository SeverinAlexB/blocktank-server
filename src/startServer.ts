import { BlocktankDatabase, waitOnSigint } from "@synonymdev/blocktank-worker2";
import { createApp } from "./3_api/createApp";
import { AppConfig } from "./0_config/AppConfig";
import dbConfig from './mikro-orm.config';
import { getAppLogger } from "./1_logger/logger";
import exchangeRateApi from "./0_exchangeRate/exchangeRateApi";


const logger = getAppLogger()
const config = AppConfig.get()
async function main() {
    const app = await createApp()
    const server = app.listen(config.http.port, config.http.host, () => {
        logger.info(`Server started on http://${config.http.host}:${config.http.port}`)
    });
    try {
        await exchangeRateApi.init()
        await BlocktankDatabase.connect(dbConfig)
        logger.info('Stop with Ctrl+C')
        await waitOnSigint()
    } finally {
        await BlocktankDatabase.close()
        server.close()
        exchangeRateApi.stop()
    }

    logger.info('Stopping')
    
}


main()