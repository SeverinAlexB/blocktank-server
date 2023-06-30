import {sleep} from '@synonymdev/blocktank-worker2/dist/utils';
import {Payment} from './Payment.embeddable'
import {Order} from './Order.entity'
import { BlocktankDatabase } from '@synonymdev/blocktank-worker2';
import dbConfig from '../../mikro-orm.config'
jest.setTimeout(60*1000)

beforeAll(async () => {
    await BlocktankDatabase.connect(dbConfig)
})

afterEach(async () => {
    // await BlocktankDatabase.cleanDatabase()
})

afterAll(async () => {
    await BlocktankDatabase.close()
})


describe('Payment.embaddable', () => {

    test('Create', async () => {
        const payment = await Payment.create(10, true)
        expect(payment.bolt11Invoice).toBeDefined()
        const order = new Order()
        order.payment = payment
        order.channelExiresAt = new Date()
        order.channelExpiryWeeks = 1
        order.clientBalanceSat = 0
        order.couponCode = ""
        order.feeSat = 0
        order.lspBalanceSat = 0;
        order.orderExpiresAt = new Date()
        
        const em = BlocktankDatabase.createEntityManager()
        await em.persistAndFlush(order)
        console.log(order)
    });


});


