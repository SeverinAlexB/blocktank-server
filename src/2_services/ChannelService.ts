import { LspLnClient } from "@synonymdev/blocktank-lsp-ln2-client";
import { AppConfig } from "../0_config/AppConfig";
import { BlocktankDatabase } from "@synonymdev/blocktank-worker2";
import { Order } from "../1_database/entities/Order.entity";
import { OrderStateEnum } from "../1_database/entities/OrderStateEnum";
import { RedisLock } from "./RedisLock";
import { ExecutionError } from "redlock";


const config = AppConfig.get()

export class ChannelService {
    

    static async open(order: Order, connectionString: string, announceChannel: boolean) {
        if (order.state !== OrderStateEnum.PAID) {
            throw new Error('Order is not in the PAID state. Can not open channel')
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
            await RedisLock.run(`channelOpen-${order.id}`, 5*60*1000, async (signal) => {
                const channelOrder = await client.orderChannel(connectionString, !announceChannel, order.lspBalanceSat, order.clientBalanceSat)
                order.channel = channelOrder
                order.state = OrderStateEnum.OPEN
                await em.persistAndFlush(order)
            })
        } catch (e) {
            if (e instanceof ExecutionError) {
                // Lock not possible. Maybe we are already opening the channel in a second thread?
                throw new Error('Already opening channel.')
            }
            console.log(`Failed to open the channel for order ${order.id}.`, e)
            throw e
        }



    }
    
}