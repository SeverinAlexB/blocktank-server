import { IBtcEventListenerOptions, LspBtcClient, LspBtcEventListener } from "@synonymdev/blocktank-lsp-btc-client";
import { AppConfig } from "../0_config/AppConfig";
import { BlocktankDatabase } from "@synonymdev/blocktank-worker2";
import { Order } from "../1_database/entities/Order.entity";
import { OrderStateEnum } from "../1_database/entities/OrderStateEnum";
import { getAppLogger } from "../1_logger/logger";


const logger = getAppLogger()
const config = AppConfig.get()

export class BtcListener {
    public listener: LspBtcEventListener;
    constructor(public options: Partial<IBtcEventListenerOptions> = {}) {
        this.listener = new LspBtcEventListener(config.workerName, options)
    }


    async start() {
        await this.listener.init()
        await this.listener.listenToAddressUpdates(async message => {
            await this.onAddressUpdate(message.content.id)
        })
    }

    private async onAddressUpdate(addressId: string) {
        const em = BlocktankDatabase.createEntityManager()
        const repo = em.getRepository(Order)
        const order = await repo.findByBtcAddressId(addressId)
        if (!order) {
            // No order associated with this id.
            return
        }
        await order.lock(async (_) => {
            const lockedOrder = await repo.findOneOrFail({
                id: order.id
            })
            const client = new LspBtcClient({
                grapeUrl: config.grapeUrl
            })
    
            lockedOrder.payment.btcAddress = await client.getAddress(addressId)
    
            await em.persistAndFlush(lockedOrder)
            logger.info( `Updated btcAddress for order ${lockedOrder.id}. New paid: ${lockedOrder.payment.paidSat}sat.`)   
        }, 5*1000)

    }

    async stop() {
        await this.listener.stop()
    }

}