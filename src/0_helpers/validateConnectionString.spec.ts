import { ConnectionStringValidationError, ConnectionStringValidationFailure } from './ConnectionStringValidationError';
import {validateConnectionString, splitHostAndPort, validateHost, validateAddress, validatePort, validatePubkey} from './validateConnectionString';

jest.setTimeout(60*1000)





describe('validateConnectionString', () => {

    test('splitHostAndPort without []', async () => {
        const {notValidatedHost: host1, notValidatedPort: port1} = splitHostAndPort('127.0.0.1:300')
        expect(host1).toEqual('127.0.0.1')
        expect(port1).toEqual('300')

        const {notValidatedHost: host2, notValidatedPort: port2} = splitHostAndPort('gwdllz5g7vky2q4gr45zguvoajzf33czreca3a3exosftx72ekppkuqd.onion:300')
        expect(host2).toEqual('gwdllz5g7vky2q4gr45zguvoajzf33czreca3a3exosftx72ekppkuqd.onion')
        expect(port2).toEqual('300')
    });

    test('splitHostAndPort with []', async () => {
        const {notValidatedHost: host1, notValidatedPort: port1} = splitHostAndPort('[127.0.0.1]:300')
        expect(host1).toEqual('127.0.0.1')
        expect(port1).toEqual('300')

        const {notValidatedHost: host2, notValidatedPort: port2} = splitHostAndPort('[2001:db8:3333:4444:5555:6666:7777:8888]:300')
        expect(host2).toEqual('2001:db8:3333:4444:5555:6666:7777:8888:9029')
        expect(port2).toEqual('300')

        const {notValidatedHost: host3, notValidatedPort: port3} = splitHostAndPort('[gwdllz5g7vky2q4gr45zguvoajzf33czreca3a3exosftx72ekppkuqd.onion]:300')
        expect(host3).toEqual('gwdllz5g7vky2q4gr45zguvoajzf33czreca3a3exosftx72ekppkuqd.onion')
        expect(port3).toEqual('300')
    });

    test('splitHostAndPort ipv6 without []', async () => {
        const {notValidatedHost: host1, notValidatedPort: port1} = splitHostAndPort('2001:db8:3333:4444:5555:6666:7777:8888:300')
        expect(host1).toEqual('2001:db8:3333:4444:5555:6666:7777:8888')
        expect(port1).toEqual('300')

        const {notValidatedHost: host2, notValidatedPort: port2} = splitHostAndPort('2001:db8:3333:4444:5555:6666:7777:8888')
        expect(host2).toEqual('2001:db8:3333:4444:5555:6666:7777:8888')
        expect(port2).toBeUndefined()

        try {
            splitHostAndPort('2001:db8:3333:4444:5555::8888')
            expect(true).toEqual(false)
        } catch (e) {
            expect(e.code).toEqual(ConnectionStringValidationFailure.INVALID_IPV6)
        }
    });

    test('validateHost', async () => {
        const {host: host1, hostType: type1} = validateHost('127.0.0.1')
        expect(host1).toEqual('127.0.0.1')
        expect(type1).toEqual('ipv4')

        const {host: host2, hostType: type2} = validateHost('2001:db8:3333:4444:5555:6666:7777:8888')
        expect(host2).toEqual('2001:db8:3333:4444:5555:6666:7777:8888')
        expect(type2).toEqual('ipv6')

        const {host: host3, hostType: type3} = validateHost('gwdllz5g7vky2q4gr45zguvoajzf33czreca3a3exosftx72ekppkuqd.onion')
        expect(host3).toEqual('gwdllz5g7vky2q4gr45zguvoajzf33czreca3a3exosftx72ekppkuqd.onion')
        expect(type3).toEqual('torv3')

        try {
            validateHost('127.0.0.1:')
            expect(true).toEqual(false)
        } catch (e) {
            expect(e.code).toEqual(ConnectionStringValidationFailure.INVALID_HOST)
        }
        try {
            validateHost('127.0.0.1:-1')
            expect(true).toEqual(false)
        } catch (e) {
            expect(e.code).toEqual(ConnectionStringValidationFailure.INVALID_HOST)
        }

        try {
            validateHost(undefined as any)
            expect(true).toEqual(false)
        } catch (e) {
            expect(e.code).toEqual(ConnectionStringValidationFailure.INVALID_HOST)
        }
    });

    test('validateAddress', async () => {
        const {host: host1, hostType: type1, port: port1} = validateAddress('127.0.0.1:300')
        expect(host1).toEqual('127.0.0.1')
        expect(type1).toEqual('ipv4')
        expect(port1).toEqual(300)

        const {host: host2, hostType: type2, port: port2} = validateAddress('2001:db8:3333:4444:5555:6666:7777:8888:300')
        expect(host2).toEqual('2001:db8:3333:4444:5555:6666:7777:8888')
        expect(type2).toEqual('ipv6')
        expect(port2).toEqual(300)
    });

    test('validatePort', async () => {
        expect(validatePort('300')).toEqual(300)
        expect(validatePort(undefined)).toEqual(undefined)
        expect(validatePort('65535')).toEqual(65535)

        try {
            validatePort('0')
            expect(true).toEqual(false)
        } catch (e) {
            expect(e.code).toEqual(ConnectionStringValidationFailure.INVALID_PORT)
        }

        try {
            validatePort('65536')
            expect(true).toEqual(false)
        } catch (e) {
            expect(e.code).toEqual(ConnectionStringValidationFailure.INVALID_PORT)
        }

        try {
            validatePort('-1')
            expect(true).toEqual(false)
        } catch (e) {
            expect(e.code).toEqual(ConnectionStringValidationFailure.INVALID_PORT)
        }
    });

    test('validatePubkey', async () => {
        expect(validatePubkey('0200000000a3eff613189ca6c4070c89206ad658e286751eca1f29262948247a5f')).toEqual('0200000000a3eff613189ca6c4070c89206ad658e286751eca1f29262948247a5f')
        expect(validatePubkey('0300000000a3eff613189ca6c4070c89206ad658e286751eca1f29262948247a5f')).toEqual('0300000000a3eff613189ca6c4070c89206ad658e286751eca1f29262948247a5f')

        try {
            validatePubkey('0300000000a3eff613189ca6c4070c89206ad658e286751eca1f29262948247a5')
            expect(true).toEqual(false)
        } catch (e) {
            expect(e.code).toEqual(ConnectionStringValidationFailure.INVALID_PUBKEY)
        }

        try {
            validatePubkey('0300000000a3eff613189ca6c4070c89206ad658e286751eca1f29262948247a5fa')
            expect(true).toEqual(false)
        } catch (e) {
            expect(e.code).toEqual(ConnectionStringValidationFailure.INVALID_PUBKEY)
        }

        try {
            validatePubkey('0100000000a3eff613189ca6c4070c89206ad658e286751eca1f29262948247a5a')
            expect(true).toEqual(false)
        } catch (e) {
            expect(e.code).toEqual(ConnectionStringValidationFailure.INVALID_PUBKEY)
        }
    });

    test('validateConnectionString', async () => {
        const {host: host1, pubkey: pubkey1, port: port1} = validateConnectionString('0200000000a3eff613189ca6c4070c89206ad658e286751eca1f29262948247a5f@127.0.0.1:9000')
        expect(host1).toEqual('127.0.0.1')
        expect(pubkey1).toEqual('0200000000a3eff613189ca6c4070c89206ad658e286751eca1f29262948247a5f')
        expect(port1).toEqual(9000)

        try {
            validateConnectionString('0200000000a3eff613189ca6c4070c89206ad658e286751eca1f29262948247a5f127.0.0.1:9000')
            expect(true).toEqual(false)
        } catch (e) {
            expect(e.code).toEqual(ConnectionStringValidationFailure.INVALID_ATS)
        }

        try {
            validateConnectionString('0200000000a3e@ff613189ca6c4070c89206ad658e286751eca1f29262948247a5f@127.0.0.1:9000')
            expect(true).toEqual(false)
        } catch (e) {
            expect(e.code).toEqual(ConnectionStringValidationFailure.INVALID_ATS)
        }

        expect(() => validateConnectionString('@')).toThrow(ConnectionStringValidationError)
        expect(() => validateConnectionString('0200000000a3eff613189ca6c4070c89206ad658e286751eca1f29262948247a5f@')).toThrow(ConnectionStringValidationError)

    });

});


