import { Property, Embeddable } from "@mikro-orm/core";
import { IWatchedAddress, LspBtcClient, SuspiciousZeroConfReason } from "@synonymdev/blocktank-lsp-btc-client";
import { Bolt11InvoiceState, IBolt11Invoice, LspLnClient } from "@synonymdev/blocktank-lsp-ln2-client";
import * as short from 'short-uuid'
import { AppConfig } from "../../0_config/AppConfig";


const config = AppConfig.get()

@Embeddable()
export class Payment {
    /**
     * Id which is referenced in the ln description.
     */
    id: string = short.generate();

    @Property()
    btcAddress: IWatchedAddress

    @Property()
    btcAddressId: string

    @Property()
    bolt11Invoice: IBolt11Invoice

    @Property()
    bolt11InvoiceId: string

    /**
     * Onchain sat that we consider confirmed.
     */
    get paidOnchainSat(): number {
        if (this.btcAddress.isBlacklisted) {
            return 0
        }
        const validPayments = this.btcAddress.payments.filter(payment => payment.blockConfirmationCount >= 1 || payment.suspicious0ConfReason === SuspiciousZeroConfReason.NONE)
        return validPayments.map(payment => payment.amountSat).reduce((a,b) => a + b, 0)
    }

    /**
     * LN sat that is either HOLD or is paid.
     */
    get paidLnSat(): number {
        if (this.bolt11Invoice.state === Bolt11InvoiceState.HOLDING || this.bolt11Invoice.state === Bolt11InvoiceState.PAID) {
            return this.bolt11Invoice.amountSat
        }
        return 0
    }

    get paidSat(): number {
        return this.paidLnSat + this.paidOnchainSat
    }

    /**
     * Settles the LN HOLD invoice
     */
    async settle() {
        if (this.bolt11Invoice.state === Bolt11InvoiceState.HOLDING) {
            const lnClient = new LspLnClient({
                grapeUrl: config.grapeUrl
            })
            await lnClient.settleHodlInvoice(this.bolt11Invoice.id)
        }
    }

    /**
     * Refunds LN HOLD Invoice
     */
    async refund() {
        if (this.bolt11Invoice.state === Bolt11InvoiceState.HOLDING) {
            const lnClient = new LspLnClient({
                grapeUrl: config.grapeUrl
            })
            await lnClient.cancelHodlInvoice(this.bolt11Invoice.id)
        }
    }

    /**
     * Create new Payment object.
     * @param amountSat 
     * @returns 
     */
    static async create(amountSat: number): Promise<Payment> {
        const payment = new Payment()
        const btcClient = new LspBtcClient({
            grapeUrl: config.grapeUrl
        })
        payment.btcAddress = await btcClient.createAddress()
        payment.btcAddressId = payment.btcAddress.id
        const lnClient = new LspLnClient({
            grapeUrl: config.grapeUrl
        })
        payment.bolt11Invoice = await lnClient.createHodlInvoice(amountSat, `Blocktank Channel #${payment.id}`)
        payment.bolt11InvoiceId = payment.bolt11Invoice.id
        return payment
    }
}