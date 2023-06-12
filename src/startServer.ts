import { waitOnSigint } from "@synonymdev/blocktank-worker2";
import { createApp } from "./2_api/createApp";


async function main() {
    const port = 9000;
    const app = await createApp()
    const server = app.listen(port, () => {
        console.log(`Server started on http://127.0.0.1:${port}`)
    });
    console.log('Stop with Ctrl+C')
    await waitOnSigint()
    console.log('Stopping')
    server.close()
}


main()