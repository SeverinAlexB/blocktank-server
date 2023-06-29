import { BlocktankDatabase } from "@synonymdev/blocktank-worker2";
import {Order} from '../1_database/entities/Order.entity'
import {OrderExpiredWatcher} from './OrderExpiredWatcher'
import { OrderStateEnum } from "../1_database/entities/OrderStateEnum";
import { Bolt11InvoiceState, LspLnClient } from "@synonymdev/blocktank-lsp-ln2-client";
import { SuspiciousZeroConfReason } from "@synonymdev/blocktank-lsp-btc-client";
import { PaymentStateEnum } from "../1_database/entities/PaymentStateEnum";

jest.setTimeout(60*1000)



describe('OrderExpiredWatcher', () => {

    test('expire nothing paid', async () => {
        const em = BlocktankDatabase.createEntityManager()
        const repo = em.getRepository(Order)
        const order = await repo.createByBalance(10, 10, 4)

        order.orderExpiresAt = new Date()
        await em.persistAndFlush(order)

        const watcher = new OrderExpiredWatcher()
        await watcher.expireOrder(order)

        const expired = await repo.findOneOrFail({
            id: order.id
        })

        expect(expired.state).toEqual(OrderStateEnum.EXPIRED)
    });

    test('expire wrong state', async () => {
        const em = BlocktankDatabase.createEntityManager()
        const repo = em.getRepository(Order)
        const order = await repo.createByBalance(10, 10, 4)
        order.state = OrderStateEnum.OPEN
        order.orderExpiresAt = new Date()
        await em.persistAndFlush(order)

        const watcher = new OrderExpiredWatcher()
        await watcher.expireOrder(order)

        const expired = await repo.findOneOrFail({
            id: order.id
        })

        expect(expired.state).toEqual(OrderStateEnum.OPEN)
    });

    test('expire paid ln', async () => {
        const em = BlocktankDatabase.createEntityManager()
        const repo = em.getRepository(Order)
        const order = await repo.createByBalance(10, 10, 4)
        order.payment.bolt11Invoice = {
            amountSat: 1000,
            state: Bolt11InvoiceState.HOLDING,
        } as any;
        order.orderExpiresAt = new Date()
        await em.persistAndFlush(order)

        const watcher = new OrderExpiredWatcher()

        jest.spyOn(LspLnClient.prototype, 'cancelHodlInvoice').mockReturnThis();
        await watcher.expireOrder(order)

        const expired = await repo.findOneOrFail({
            id: order.id
        })

        expect(expired.payment.state).toEqual(PaymentStateEnum.REFUNDED)
    });

    test('expire paid onchain', async () => {
        const em = BlocktankDatabase.createEntityManager()
        const repo = em.getRepository(Order)
        const order = await repo.createByBalance(10, 10, 4)
        order.payment.btcAddress = {
            transactions: [{
                amountSat: 1000,
                isBlacklisted: false,
                txId: '123',
                blockConfirmationCount: 1,
                suspicious0ConfReason: SuspiciousZeroConfReason.NONE,
                createdAt: new Date()
            }] 
        } as any
        order.orderExpiresAt = new Date()
        await em.persistAndFlush(order)

        const watcher = new OrderExpiredWatcher()
        await watcher.expireOrder(order)

        const expired = await repo.findOneOrFail({
            id: order.id
        })

        expect(expired.payment.state).toEqual(PaymentStateEnum.REFUND_AVAILABLE)
    });

    test('dont expire paid onchain for 1 hr', async () => {
        const em = BlocktankDatabase.createEntityManager()
        const repo = em.getRepository(Order)
        const order = await repo.createByBalance(10, 10, 4)
        order.orderExpiresAt = new Date()
        order.payment.btcAddress = {
            transactions: [{
                amountSat: 1000,
                isBlacklisted: false,
                txId: '123',
                blockConfirmationCount: 0,
                suspicious0ConfReason: SuspiciousZeroConfReason.NONE,
                createdAt: new Date(order.orderExpiresAt.getTime() -1)
            }] 
        } as any
        await em.persistAndFlush(order)

        const watcher = new OrderExpiredWatcher()
        await watcher.expireOrder(order)

        const expired = await repo.findOneOrFail({
            id: order.id
        })

        expect(expired.state).toEqual(OrderStateEnum.CREATED)
    });
});


