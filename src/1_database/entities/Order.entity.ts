import { Entity, PrimaryKey, Property, Index, Embedded, EntityRepositoryType } from "@mikro-orm/core";
import crypto from "crypto";
import { Payment } from "./Payment.embeddable";




@Entity({
    // repository: () => WatchedAddressRepository
})
export class Order {
    // [EntityRepositoryType]?: WatchedAddressRepository;

    @PrimaryKey({name: "_id"})
    id: string = crypto.randomUUID();

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

    @Embedded(() => Payment, {object: true})
    payment: Payment

    @Property({ onUpdate: () => new Date() })
    updatedAt: Date = new Date();

    @Property()
    createdAt: Date = new Date();
}