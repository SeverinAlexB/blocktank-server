import { ConnectionStringValidationError, ConnectionStringValidationFailure } from "./ConnectionStringValidationError"

// Fragments do not have ^$ so they can not be used independently. They can be concatenated this way though.
export const pubkeyRegex = /^(?<pubkey>0[23][\dabcdef]{64})$/
export const ipv4Regex = /^(?<ipv4>((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4})$/
export const ipv6Regex = /^(?<ipv6>(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])))$/
export const torv3Regex = /^(?<torv3>[\w\d]{56,56}\.onion)$/
export const portRegex = /^(?<port>([1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5]))$/
export const squareBracketsAddressRegex = /^([\[](?<content>.*)[\]])(:(?<port>\d{1,5}))?$/


export type HostType = 'ipv6' | 'ipv4' | 'torv3';

export function splitHostAndPort(addressString: string): {
    notValidatedHost?: string,
    notValidatedPort?: string
} {
    // Easy, host is in square brackets [] and port is optionally behind a colon.
    const squareBracketMatch = squareBracketsAddressRegex.exec(addressString)
    const squareBracketContent = squareBracketMatch?.groups?.content
    const squareBracketPort = squareBracketMatch?.groups?.port
    if (squareBracketMatch) {
        return {
            notValidatedHost: squareBracketContent,
            notValidatedPort: squareBracketPort
        }
    }

    // No square brackets.
    const colonCount = (addressString.split(":").length - 1)
    if (colonCount <= 1) {
        // Either tor or ipv4
        const splitted = addressString.split(":")
        return {
            notValidatedHost: splitted[0],
            notValidatedPort: splitted[1]
        }
    }

    // Ipv6. Here the guessing begins.
    const isCompressed = addressString.includes('::')
    if (!isCompressed) {
        // Ipv6 consists of 8 groups plus an optional port.
        const groups = addressString.split(":")
        if (groups.length > 9 || groups.length < 8) {
            // Invalid ipv6
            throw new ConnectionStringValidationError('Invalid host. Invalid ipv6?', ConnectionStringValidationFailure.INVALID_HOST)
        }
        const host = groups.slice(0, 8).join(':')
        const port = groups[8]
        return {
            notValidatedHost: host,
            notValidatedPort: port
        }
    }

    // Ipv6 compressed
    // We can't determin the port here. We just assume everything is the ip.
    throw new ConnectionStringValidationError('Compressed ipv6 host without square brackets []', ConnectionStringValidationFailure.INVALID_IPV6)
}

export function validateHost(hostString: string): { host: string, hostType: HostType } {

    const validatedIpv4 = ipv4Regex.exec(hostString)?.groups?.ipv4
    if (validatedIpv4) {
        return {
            host: validatedIpv4,
            hostType: 'ipv4'
        }
    }

    const validatedIpv6 = ipv6Regex.exec(hostString)?.groups?.ipv6
    if (validatedIpv6) {
        return {
            host: validatedIpv6,
            hostType: 'ipv6'
        }
    }

    const validatedTorv3 = torv3Regex.exec(hostString)?.groups?.torv3
    if (validatedTorv3) {
        return {
            host: validatedTorv3,
            hostType: 'torv3'
        }
    }

    throw new ConnectionStringValidationError('Invalid host.', ConnectionStringValidationFailure.INVALID_HOST)
}

export function validateAddress(addressString: string): { host: string, port?: number, hostType: HostType } {
    const { notValidatedHost, notValidatedPort } = splitHostAndPort(addressString)
    const { host, hostType } = validateHost(notValidatedHost)

    const port = validatePort(notValidatedPort)

    return {
        port: port,
        host: host,
        hostType: hostType
    }
}

export function validatePort(portString?: string): number | undefined {
    if (!portString) {
        return undefined
    }
    const validatedPort = portRegex.exec(portString)?.groups?.port
    if (!validatedPort) {
        throw new ConnectionStringValidationError('Invalid port.', ConnectionStringValidationFailure.INVALID_PORT)
    }
    return Number.parseInt(validatedPort)
}

export function validatePubkey(pubkeyString: string): string {
    const nodeIdMatch = pubkeyRegex.exec(pubkeyString)
    const validatedPubkey = nodeIdMatch?.groups?.pubkey;
    if (!validatedPubkey) {
        throw new ConnectionStringValidationError('Invalid pubkey.', ConnectionStringValidationFailure.INVALID_PUBKEY)
    }
    return validatedPubkey
}


/**
 * Simple connection string validator. Could be more fancy but it's good for now.
 * @param connectionString 
 * @returns 
 */
export function validateConnectionString(connectionString: string): { host: string, port?: number, pubkey: string, hostType: HostType } {
    const split = connectionString.split('@')
    if (split.length !== 2) {
        throw new ConnectionStringValidationError('@ does not split the string in two parts.', ConnectionStringValidationFailure.INVALID_ATS)
    }
    const pubkeyString = split[0]

    const pubkey = validatePubkey(pubkeyString)

    const addressString = split[1]
    const address = validateAddress(addressString)

    return {
        pubkey: pubkey,
        hostType: address.hostType,
        host: address.host,
        port: address.port
    }
}