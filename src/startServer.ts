import { BlocktankDatabase, waitOnSigint } from "@synonymdev/blocktank-worker2";
import { createApp } from "./3_api/createApp";
import { AppConfig } from "./0_config/AppConfig";
import dbConfig from './mikro-orm.config';

const config = AppConfig.get()
async function main() {
    const app = await createApp()
    const server = app.listen(config.http.port, config.http.host, () => {
        console.log(`Server started on http://${config.http.host}:${config.http.port}`)
    });
    try {
        await BlocktankDatabase.connect(dbConfig)
        console.log('Stop with Ctrl+C')
        await waitOnSigint()
    } finally {
        await BlocktankDatabase.close()
        server.close()
    }

    console.log('Stopping')
    
}


main()