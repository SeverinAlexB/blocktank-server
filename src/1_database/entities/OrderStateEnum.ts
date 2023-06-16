export enum OrderStateEnum {
    CREATED='created',
    PAID='paid',
    OPEN='open',
    CLOSED='closed',
    EXPIRED='expired', // No payment made, order expired.
    REFUNDED='refunded', // Payment refunded with LN
    MANUAL_REFUND='manualRefund' // Onchain refund available manually
    // REFUND_AVAILABLE='refundAvailable' // Todo: Onchain refunds
}