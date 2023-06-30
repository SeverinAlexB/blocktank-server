import { IIncomingTransaction, SuspiciousZeroConfReason } from "@synonymdev/blocktank-lsp-btc-client";
import { AppConfig } from "../0_config/AppConfig";

const config = AppConfig.get()

/**
 * Do we see this tx as confirmed?
 * @param tx 
 * @param accept0Conf
 * @returns 
 */
export function isTxConfirmed(tx: IIncomingTransaction, accept0Conf: boolean): boolean {
    if (tx.isBlacklisted) {
        return false
    }
    if (tx.replacedByTxId) {
        return false
    }
    const isValid0Conf = tx.suspicious0ConfReason === SuspiciousZeroConfReason.NONE
    let requiredConfirmations = config.channels.minPaymentConfirmations;
    if (!accept0Conf) {
        requiredConfirmations = config.channels.minPaymentConfirmationsClientBalance
    }
    if (requiredConfirmations === 0) {
        return isValid0Conf
    } else {
        return tx.blockConfirmationCount >= requiredConfirmations
    }
}