import { IBolt11Invoice, IOpenChannelOrder } from "@synonymdev/blocktank-lsp-ln2-client";
import { Order } from "../1_database/entities/Order.entity";
import { Payment } from "../1_database/entities/Payment.embeddable";
import { SuspiciousZeroConfReason } from "@synonymdev/blocktank-lsp-btc-client";
import { isTxConfirmed } from "../0_helpers/isTxConfirmed";



export function serializeOrder(order: Order) {
    return {
        id: order.id,
        state: order.state,
        feeSat: order.feeSat,
        lspBalanceSat: order.lspBalanceSat,
        clientBalanceSat: order.clientBalanceSat,
        channelExpiryWeeks: order.channelExpiryWeeks,
        channelExpiresAt: order.channelExiresAt,
        orderExpiresAt: order.orderExpiresAt,
        channel: serializeChannel(order.channel),
        payment: serializePayment(order.payment),
        couponCode: order.couponCode,
        discountPercentage: order.discountPercentage,
        updatedAt: order.updatedAt,
        createdAt: order.createdAt,
    }
}

function serializeChannel(channel?: IOpenChannelOrder) {
    if (!channel) {
        return null
    }
    return {
        state: channel.state,
        lspNodePubkey: channel.ourPublicKey,
        clientNodePubkey: channel.peerPublicKey,
        announceChannel: !channel.isPrivate,
        fundingTx: {
            id: channel.txId,
            vout: channel.txVout,
        },
        closingTxId: channel.closingTxId,
        shortChannelId: channel.shortChannelId,
    }
}


function serializePayment(payment: Payment) {
    return {
        state: payment.state,
        paidSat: payment.paidSat,
        bolt11Invoice: serializeBolt11Invoice(payment.bolt11Invoice),
        onchain: serializeBtcAddress(payment),
    }
}

function serializeBolt11Invoice(invoice: IBolt11Invoice) {
    return {
        request: invoice.request,
        state: invoice.state,
        expiresAt: invoice.expiresAt,
        updatedAt: invoice.updatedAt,
    }
}

function serializeBtcAddress(payment: Payment) {
    const address = payment.btcAddress
    return {
        address: address.address,
        confirmedSat: payment.paidOnchainSat,
        transactions: address.transactions.map(tx => {
            return {
                amountSat: tx.amountSat,
                txId: tx.txId,
                vout: tx.txVout,
                blockHeight: tx.blockHeight,
                blockConfirmationCount: tx.blockConfirmationCount,
                feeRateSatPerVbyte: tx.feeRateSatPerVbyte,
                confirmed: isTxConfirmed(tx, payment.accept0Conf)
            }
        }),
    }
}