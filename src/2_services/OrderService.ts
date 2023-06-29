import { LspLnClient } from "@synonymdev/blocktank-lsp-ln2-client";
import { AppConfig } from "../0_config/AppConfig";
import { BlocktankDatabase } from "@synonymdev/blocktank-worker2";
import { Order } from "../1_database/entities/Order.entity";
import { OrderStateEnum } from "../1_database/entities/OrderStateEnum";
import { ExecutionError } from "redlock";
import { getAppLogger } from "../1_logger/logger";
import { PaymentStateEnum } from "../1_database/entities/PaymentStateEnum";

const logger = getAppLogger()

const config = AppConfig.get()

export class OrderService {
    

    static async openChannel(order: Order, connectionString: string, announceChannel: boolean) {
        if (order.state !== OrderStateEnum.CREATED || order.payment.state !== PaymentStateEnum.PAID) {
            throw new Error('Order is not in the right state. Can not open channel')
        }
        const em = BlocktankDatabase.createEntityManager()

        const client = new LspLnClient({
            grapeUrl: config.grapeUrl
        })

        try {
            const isAvailable = await client.isNodeForChannelOpenAvailable(order.lspBalanceSat + order.clientBalanceSat)
            if (!isAvailable) {
                throw new Error('Service unavailable')
            }
        } catch (e) {
            throw new Error('Service unavailable')
        }


        // Lock order so we don't open channel twice.
        try {
            await order.lock(async (_) => {
                const channelOrder = await client.orderChannel(connectionString, !announceChannel, order.lspBalanceSat, order.clientBalanceSat)
                order.channel = channelOrder
                order.channelOrderId = channelOrder.id
                order.state = OrderStateEnum.OPEN
                await em.persistAndFlush(order) // Save so if the settlement failes, we don't open the channel twice at least.

                // Settle payment
                await order.payment.settle()
                await em.persistAndFlush(order)
            })
            logger.info({
                orderId: order.id,
                connectionString,
                announceChannel
              }, `Opened channel successfully. FundingTx: ${order.channel.txId}`)

        } catch (e) {
            if (e instanceof ExecutionError) {
                // Lock not possible. Maybe we are already opening the channel in a second thread?
                throw new Error('Already opening channel.')
            }

            logger.info({
                error: e,
                orderId: order.id,
                connectionString,
                announceChannel
              }, `Failed to open channel of order ${order.id}.`)
            throw e
        }
    }
    
}