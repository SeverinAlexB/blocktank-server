
export enum PaymentStateEnum {
    CREATED='created',
    PARTIALLY_PAID='partiallyPaid', // Onchain partially paid.
    PAID='paid',
    REFUNDED='refunded',
    REFUND_AVAILABLE='refundAvailable' // Onchain refund available
}