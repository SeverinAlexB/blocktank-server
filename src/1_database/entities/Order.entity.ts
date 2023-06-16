import { Entity, PrimaryKey, Property, Index, Embedded, EntityRepositoryType } from "@mikro-orm/core";
import crypto from "crypto";
import { Payment } from "./Payment.embeddable";
import { OrderRepository } from "../repositories/OrderRepository";
import { OrderStateEnum } from "./OrderStateEnum";
import { IOpenChannelOrder } from "@synonymdev/blocktank-lsp-ln2-client";
import { RedisLock } from "../../2_services/RedisLock";
import { RedlockAbortSignal } from "redlock";


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

    get isChannelExpired(): boolean {
        return this.channelExiresAt.getTime() < Date.now()
    }

    /**
     * When this order expires.
     */
    @Property()
    orderExpiresAt: Date;

    get isOrderExpired(): boolean {
        return this.orderExpiresAt.getTime() < Date.now()
    }

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

    /**
     * Locks the order exclusively for sensitive operations. Will throw an error if another process locked it.
     * Use it for sensitive operations that should run exclusively on the order.
     * @param run 
     * @returns Returns the return value of the run method.
     */
    async lock(run: (signal: RedlockAbortSignal) => any, maxLockDurationMs: number = 60*1000) {
        return await RedisLock.run(`blocktank-lsp-http-order-${this.id}`, maxLockDurationMs, async (signal) => {
            return await run(signal)
        })
    }

}