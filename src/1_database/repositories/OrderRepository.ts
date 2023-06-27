import { EntityRepository } from '@mikro-orm/mongodb'; // or any other driver package
import { Order } from '../entities/Order.entity';
import { Payment } from '../entities/Payment.embeddable';
import { getChannelFee } from '../../0_helpers/pricing';
import { AppConfig } from '../../0_config/AppConfig';
import { BlocktankDatabase } from '@synonymdev/blocktank-worker2';
import { OrderStateEnum } from '../entities/OrderStateEnum';

const config = AppConfig.get()



export class OrderRepository extends EntityRepository<Order> {

    /**
     * Find an order by it's btc onchain address id.
     * @returns Order or undefined.
     */
    async findByBtcAddressId(addressId: string): Promise<Order | null> {
        const order = await this.findOne({
            payment: {
                btcAddressId: addressId
            }
        })
        return order
    }

    /**
     * Find an order by it's ln invoice id.
     * @returns Order or undefined.
     */
    async findByLnInvoiceId(invoiceId: string): Promise<Order | null> {
        return await this.findOne({
            payment: {
                bolt11InvoiceId: invoiceId
            }
        })
    }

    async findToBeExpired(): Promise<Order[]> {
        return await this.find({
            orderExpiresAt: {
                $lte: new Date()
            },
            state: {
                $in: [OrderStateEnum.CREATED, OrderStateEnum.PAID]
            }
        })
    }

    async createByBalance(lspBalanceSat: number, clientBalanceSat: number, channelExpiryWeeks: number, couponCode: string = "", refundOnchainAddress?: string): Promise<Order> {
        const now = Date.now()
        const orderExpiryMs = config.channels.orderExpiryS * 1000
        const order = new Order()
        order.channelExpiryWeeks = channelExpiryWeeks
        order.channelExiresAt = new Date(now + channelExpiryWeeks * 7 * 24 * 60 * 60 * 1000 + orderExpiryMs)
        order.orderExpiresAt = new Date(now + orderExpiryMs)
        order.clientBalanceSat = clientBalanceSat
        order.lspBalanceSat = lspBalanceSat;
        order.couponCode = couponCode
        order.feeSat = clientBalanceSat + await getChannelFee(order.channelExpiryWeeks, lspBalanceSat)
        order.payment = await Payment.create(order.feeSat)
        order.payment.onchainRefundAddress = refundOnchainAddress
        return this.create(order)
    }
}