
import { BlocktankDatabase } from "@synonymdev/blocktank-worker2";
import { Order } from "../1_database/entities/Order.entity";
import { OrderStateEnum } from "../1_database/entities/OrderStateEnum";
import { setIntervalAsync, clearIntervalAsync, SetIntervalAsyncTimer } from 'set-interval-async/fixed';
import { getAppLogger } from "../1_logger/logger";
import { TransactionChange } from "@synonymdev/blocktank-lsp-btc-client";

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

    /**
     * Checks if has pending onchain tx that is not stuck for more than 1hr.
     * @param order 
     * @returns 
     */
    private hasPendingTx(order: Order) {
        const transactions = order.payment.btcAddress.transactions;
        const pendingTxs = transactions.filter(tx => tx.blockConfirmationCount === 0)
        const sentBeforeOrderCreation = pendingTxs.filter(tx => order.orderExpiresAt.getTime() > tx.createdAt.getTime())
        const notStuckForMoreThan1hr = sentBeforeOrderCreation.filter(tx => {
            const txSeenSinceS = (Date.now() - tx.createdAt.getTime()) / 1000
            const _1hr = 60 * 60;
            return txSeenSinceS < +_1hr
        })

         // Order still has a pending tx attached. Don't expire order for 1 hour max afer expiry date.
        return notStuckForMoreThan1hr.length > 0
    }

    /**
     * Checks if a onchain tx has been confirmed within the last 5min.
     * @param order 
     * @returns 
     */
    private lastConfirmationWithinLast5min(order: Order) {
        const _5min = 60*60*1000
        const transactions = order.payment.btcAddress.transactions;
        const confirmedRecently = transactions.filter(tx => {
            const firstBlockConfUpdate = tx.updates.find(update => update.action === TransactionChange.CONFIRMATION_ADDED && update.newBlockConfirmationCount === 1)

            return firstBlockConfUpdate.createdAt.getTime() + _5min > Date.now()
        })
        return confirmedRecently.length > 0
    }

    async expireOrder(order: Order) {
        if (this.hasPendingTx(order)) {
            return
        }
        if (this.lastConfirmationWithinLast5min(order)) {
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