import { IBtcEventListenerOptions, LspBtcClient, LspBtcEventListener } from "@synonymdev/blocktank-lsp-btc-client";
import { AppConfig } from "../0_config/AppConfig";
import { BlocktankDatabase } from "@synonymdev/blocktank-worker2";
import { Order } from "../1_database/entities/Order.entity";
import { ILn2EventListenerOptions, LspLnClient, LspLnEventListener } from "@synonymdev/blocktank-lsp-ln2-client";
import { OrderStateEnum } from "../1_database/entities/OrderStateEnum";
import { getAppLogger } from "../1_logger/logger";


const logger = getAppLogger()
const config = AppConfig.get()

export class LnInvoiceListener {
    public listener: LspLnEventListener;
    constructor(public options: Partial<ILn2EventListenerOptions> = {}) {
        this.listener = new LspLnEventListener(config.workerName, options)
    }


    async start() {
        await this.listener.init()
        await this.listener.listenToInvoicesChanged(async message => {
            await this.onInvoiceUpdate(message.content.invoiceId)
        })
    }

    private async onInvoiceUpdate(invoiceId: string) {
        const em = BlocktankDatabase.createEntityManager()
        const repo = em.getRepository(Order)
        const order = await repo.findByLnInvoiceId(invoiceId)
        if (!order) {
            // No order associated with this id.
            return
        }
        await order.lock(async (_) => {
            const lockedOrder = await repo.findOneOrFail({
                id: order.id
            })
            const client = new LspLnClient({
                grapeUrl: config.grapeUrl
            })
    
            lockedOrder.payment.bolt11Invoice = await client.getInvoice(invoiceId)
            if (lockedOrder.state === OrderStateEnum.CREATED && lockedOrder.feeSat >= lockedOrder.payment.paidSat) {
                lockedOrder.state = OrderStateEnum.PAID
            }
            await em.persistAndFlush(lockedOrder)
            logger.info(`Updated bolt11Invoice for order ${lockedOrder.id}. New paid: ${lockedOrder.payment.paidSat}sat.`)  
        }, 5*1000)

    }

    async stop() {
        await this.listener.stop()
    }

}