import { BlocktankDatabase } from "@synonymdev/blocktank-worker2";
import {Order} from '../entities/Order.entity'
jest.setTimeout(60*1000)



describe('OrderRepository', () => {

    test('createByBalance', async () => {
        const em = BlocktankDatabase.createEntityManager()
        const repo = em.getRepository(Order)
        const order = await repo.createByBalance(10, 10, 4)

        expect(order.feeSat).toBeGreaterThan(0)
    });
});


