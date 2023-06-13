import { EntityRepository } from '@mikro-orm/mongodb'; // or any other driver package
import { Order } from '../entities/Order.entity';





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
}