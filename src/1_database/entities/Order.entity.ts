import { Entity, PrimaryKey, Property, Index, Embedded, EntityRepositoryType } from "@mikro-orm/core";
import crypto from "crypto";
import { Payment } from "./Payment.embeddable";
import { OrderRepository } from "../repositories/OrderRepository";
import { OrderStateEnum } from "./OrderStateEnum";
import { IOpenChannelOrder } from "@synonymdev/blocktank-lsp-ln2-client";
import { getChannelFee } from "../../0_helpers/pricing";




@Entity({
    repository: () => OrderRepository
})
export class Order {
    [EntityRepositoryType]: OrderRepository;

    @PrimaryKey({name: "_id"})
    id: string = crypto.randomUUID();

    @Property({
        type: () => OrderStateEnum
    })
    state: OrderStateEnum = OrderStateEnum.CREATED

    @Property()
    lspBalanceSat: number

    @Property()
    clientBalanceSat: number = 0

    @Property()
    channelExpiryWeeks: number

    /**
     * When the channel will expire. Derived from channelExpiryWeeks.
     */
    @Property()
    channelExiresAt: Date

    /**
     * When this order expires.
     */
    @Property()
    orderExpiresAt: Date;

    /**
     * Affiliate code basically
     */
    @Property()
    couponCode: string = "";

    /**
     * Fee to pay to get the channel opened. Includes clientBalanceSat.
     */
    @Property()
    feeSat: number

    @Property({nullable: true})
    channel: IOpenChannelOrder

    @Embedded(() => Payment, {object: true})
    payment: Payment

    @Property({ onUpdate: () => new Date() })
    updatedAt: Date = new Date();

    @Property()
    createdAt: Date = new Date();


    async calculateChannelFee() {
        const feeSat = await getChannelFee(this.channelExpiryWeeks, this.lspBalanceSat)
        this.feeSat = this.clientBalanceSat + feeSat
    }
}