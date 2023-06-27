
import { BlocktankDatabase } from "@synonymdev/blocktank-worker2";
import { Order } from "../1_database/entities/Order.entity";
import { OrderStateEnum } from "../1_database/entities/OrderStateEnum";
import { setIntervalAsync, clearIntervalAsync, SetIntervalAsyncTimer } from 'set-interval-async/fixed';
import { getAppLogger } from "../1_logger/logger";

const logger = getAppLogger()

export class OrderExpiredWatcher {
    private interval: SetIntervalAsyncTimer<any> | null = null

    start() {
        if (this.isRunning) {
            throw new Error('Already running.')
        }
        this.interval = setIntervalAsync(async () => {
            await this.updateOrderStates()
        }, 10*1000)
    }

    async stop() {
        if (this.interval) {
            await clearIntervalAsync(this.interval)
        }
    }

    get isRunning() {
        return this.interval !== null
    }
    

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

                // Check again because it might have changed in the meantime.
                const isInExipiringState = lockedOrder.state === OrderStateEnum.CREATED || lockedOrder.state === OrderStateEnum.PAID
                if (!isInExipiringState) {
                    // Not in a state where it should be expired.
                    return;
                }
                if (lockedOrder.payment.paidSat === 0) {
                    lockedOrder.state = OrderStateEnum.EXPIRED; // Client never paid.
                } else if (lockedOrder.payment.paidLnSat > 0) {
                    await lockedOrder.payment.refund() // Refund LN
                    lockedOrder.state = OrderStateEnum.REFUNDED
                } else if (lockedOrder.payment.paidOnchainSat > 0) {
                    lockedOrder.state = OrderStateEnum.MANUAL_REFUND
                }

                await em.persistAndFlush(lockedOrder)
                logger.info(`Expired order ${order.id}.`)                
            }, 30*1000)
    }
    
}