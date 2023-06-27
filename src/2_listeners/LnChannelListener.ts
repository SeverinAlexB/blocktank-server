import { AppConfig } from "../0_config/AppConfig";
import { BlocktankDatabase } from "@synonymdev/blocktank-worker2";
import { Order } from "../1_database/entities/Order.entity";
import { ILn2EventListenerOptions, LspLnClient, LspLnEventListener, OpenChannelOrderState } from "@synonymdev/blocktank-lsp-ln2-client";
import { getAppLogger } from "../1_logger/logger";
import { OrderStateEnum } from "../1_database/entities/OrderStateEnum";


const logger = getAppLogger()
const config = AppConfig.get()

export class LnChannelListener {
    public listener: LspLnEventListener;
    constructor(public options: Partial<ILn2EventListenerOptions> = {}) {
        this.listener = new LspLnEventListener(config.workerName, options)
    }


    async start() {
        await this.listener.init()
        await this.listener.listenToOpenChannelChanged(async message => {
            await this.onOrderUpdate(message.content.orderId)
        })
    }

    private async onOrderUpdate(channelOrderId: string) {
        const em = BlocktankDatabase.createEntityManager()
        const repo = em.getRepository(Order)
        const order = await repo.findByLnChannelOrderId(channelOrderId)
        if (!order) {
            // No order associated with this id.
            return
        }
        const client = new LspLnClient({
            grapeUrl: config.grapeUrl
        })

        order.channel = await client.getOrderedChannel(channelOrderId)
        const channelState = order.channel.state
        if (channelState === OpenChannelOrderState.CLOSED) {
            order.state = OrderStateEnum.CLOSED
        }
        await em.persistAndFlush(order)
        logger.info(`Updated channelOrder for order ${order.id}. New channel state: ${order.channel.state}.`)  
    }

    async stop() {
        await this.listener.stop()
    }

}