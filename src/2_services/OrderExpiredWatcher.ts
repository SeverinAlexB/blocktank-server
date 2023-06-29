
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
        }, 10 * 1000)
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
        const pendingOnchainTx = order.payment.btcAddress.transactions.filter(tx => {
            if (tx.blockConfirmationCount > 0) {
                return false
            }
            const isTxAfterOrderExpiry = order.orderExpiresAt.getTime() < tx.createdAt.getTime()
            if (isTxAfterOrderExpiry) {
                return false
            }
            const txSeenSinceS = (Date.now() - tx.createdAt.getTime()) / 1000
            const _1hr = 60 * 60;
            return txSeenSinceS < +_1hr
        })

        if (pendingOnchainTx.length > 0) {
            // Order still has a pending tx attached. Don't expire order for 1 hour max afer expiry date.
            return
        }
        await order.lock(async (_) => {
            const em = BlocktankDatabase.createEntityManager()
            const lockedOrder = await em.findOneOrFail(Order, {
                id: order.id
            })

            // Check again because it might have changed in the meantime.
            const isInExipiringState = lockedOrder.state === OrderStateEnum.CREATED
            if (!isInExipiringState) {
                // Not in a state where it should be expired.
                return;
            }

            await lockedOrder.payment.refund()
            lockedOrder.state = OrderStateEnum.EXPIRED

            await em.persistAndFlush(lockedOrder)
            logger.info(`Expired order ${order.id}.`)
        }, 30 * 1000)
    }

}