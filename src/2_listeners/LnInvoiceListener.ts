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
        const client = new LspLnClient({
            grapeUrl: config.grapeUrl
        })

        order.payment.bolt11Invoice = await client.getInvoice(invoiceId)
        if (order.state === OrderStateEnum.CREATED && order.feeSat >= order.payment.paidSat) {
            order.state = OrderStateEnum.PAID
        }
        await em.persistAndFlush(order)
        logger.info(`Updated bolt11Invoice for order ${order.id}. New paid: ${order.payment.paidSat}sat.`)  
    }

    async stop() {
        await this.listener.stop()
    }

}