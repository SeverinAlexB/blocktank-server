import { LspLnClient } from "@synonymdev/blocktank-lsp-ln2-client";
import { AppConfig } from "../0_config/AppConfig";
import { BlocktankDatabase } from "@synonymdev/blocktank-worker2";
import { Order } from "../1_database/entities/Order.entity";
import { OrderStateEnum } from "../1_database/entities/OrderStateEnum";
import { RedisLock } from "./RedisLock";
import { ExecutionError } from "redlock";


const config = AppConfig.get()

export class OrderExpiredWatcher {
    

    async updateOrderStates() {
        const em = BlocktankDatabase.createEntityManager()
        const repo = em.getRepository(Order)
        const orders = await repo.findToBeExpired()
        for (const order of orders) {
            await this.expireOrder(order)
        }
    }

    async expireOrder(order: Order) {
            await order.lock(async (_) => {
                const em = BlocktankDatabase.createEntityManager()
                const lockedOrder = await em.findOneOrFail(Order, {
                    id: order.id
                })
                const isExipiringStates = lockedOrder.state === OrderStateEnum.CREATED || lockedOrder.state === OrderStateEnum.PAID
                if (!isExipiringStates) {
                    // Not in a state where it should be expired.
                    return;
                }
                if (lockedOrder.payment.paidSat === 0) {
                    lockedOrder.state = OrderStateEnum.EXPIRED; // Client never paid.
                } else if (lockedOrder.payment.paidLnSat > 0) {
                    await lockedOrder.payment.refund() // Refund LN
                    lockedOrder.state === OrderStateEnum.REFUNDED
                } else if (lockedOrder.payment.paidOnchainSat > 0) {
                    lockedOrder.state = OrderStateEnum.MANUAL_REFUND
                }

                await em.persistAndFlush(lockedOrder)                
            }, 10*1000)
    }
    
}