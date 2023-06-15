export enum ConnectionStringValidationFailure {
    INVALID_HOST = 'invalidHost',
    INVALID_IPV6 = 'invalidIpv6',
    INVALID_PORT = 'invalidPort',
    INVALID_PUBKEY = 'invalidPubkey',
    INVALID_ATS = 'invalidAts',
}

export class ConnectionStringValidationError extends Error {
    constructor(message: string, public code: ConnectionStringValidationFailure) {
        super(message)
        this.name = 'ConnectionStringValidationError'
    }
}