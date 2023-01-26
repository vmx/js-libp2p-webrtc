/**
 * @packageDocumentation
 *
 * An implementation of a Multiaddr in JavaScript
 *
 * @example
 *
 * ```js
 * import { multiaddr } from '@multiformats/multiaddr'
 *
 * const ma = multiaddr('/ip4/127.0.0.1/tcp/1234')
 * ```
 */
import { getProtocol } from './protocols-table.js';
/**
 * Protocols are present in the protocol table
 */
export interface Protocol {
    code: number;
    size: number;
    name: string;
    resolvable?: boolean | undefined;
    path?: boolean | undefined;
}
/**
 * A plain JavaScript object representation of a {@link Multiaddr}
 */
export interface MultiaddrObject {
    family: 4 | 6;
    host: string;
    transport: string;
    port: number;
}
/**
 * A NodeAddress is an IPv4/IPv6 address/TCP port combination
 */
export interface NodeAddress {
    family: 4 | 6;
    address: string;
    port: number;
}
/**
 * These types can be parsed into a {@link Multiaddr} object
 */
export type MultiaddrInput = string | Multiaddr | Uint8Array | null;
/**
 * A Resolver is a function that takes a {@link Multiaddr} and resolves it into one
 * or more string representations of that {@link Multiaddr}.
 */
export interface Resolver {
    (addr: Multiaddr, options?: AbortOptions): Promise<string[]>;
}
/**
 * A code/value pair
 */
export type Tuple = [number, Uint8Array?];
/**
 * A code/value pair with the value as a string
 */
export type StringTuple = [number, string?];
/**
 * Allows aborting long-lived operations
 */
export interface AbortOptions {
    signal?: AbortSignal;
}
/**
 * All configured {@link Resolver}s
 */
export declare const resolvers: Map<string, Resolver>;
export interface Multiaddr {
    bytes: Uint8Array;
    /**
     * Returns Multiaddr as a String
     *
     * @example
     * ```js
     * import { multiaddr } from '@multiformats/multiaddr'
     *
     * multiaddr('/ip4/127.0.0.1/tcp/4001').toString()
     * // '/ip4/127.0.0.1/tcp/4001'
     * ```
     */
    toString: () => string;
    /**
     * Returns Multiaddr as a JSON encoded object
     *
     * @example
     * ```js
     * import { multiaddr } from '@multiformats/multiaddr'
     *
     * JSON.stringify(multiaddr('/ip4/127.0.0.1/tcp/4001'))
     * // '/ip4/127.0.0.1/tcp/4001'
     * ```
     */
    toJSON: () => string;
    /**
     * Returns Multiaddr as a convinient options object to be used with net.createConnection
     *
     * @example
     * ```js
     * import { multiaddr } from '@multiformats/multiaddr'
     *
     * multiaddr('/ip4/127.0.0.1/tcp/4001').toOptions()
     * // { family: 4, host: '127.0.0.1', transport: 'tcp', port: 4001 }
     * ```
     */
    toOptions: () => MultiaddrObject;
    /**
     * Returns the protocols the Multiaddr is defined with, as an array of objects, in
     * left-to-right order. Each object contains the protocol code, protocol name,
     * and the size of its address space in bits.
     * [See list of protocols](https://github.com/multiformats/multiaddr/blob/master/protocols.csv)
     *
     * @example
     * ```js
     * import { multiaddr } from '@multiformats/multiaddr'
     *
     * multiaddr('/ip4/127.0.0.1/tcp/4001').protos()
     * // [ { code: 4, size: 32, name: 'ip4' },
     * //   { code: 6, size: 16, name: 'tcp' } ]
     * ```
     */
    protos: () => Protocol[];
    /**
     * Returns the codes of the protocols in left-to-right order.
     * [See list of protocols](https://github.com/multiformats/multiaddr/blob/master/protocols.csv)
     *
     * @example
     * ```js
     * import { multiaddr } from '@multiformats/multiaddr'
     *
     * multiaddr('/ip4/127.0.0.1/tcp/4001').protoCodes()
     * // [ 4, 6 ]
     * ```
     */
    protoCodes: () => number[];
    /**
     * Returns the names of the protocols in left-to-right order.
     * [See list of protocols](https://github.com/multiformats/multiaddr/blob/master/protocols.csv)
     *
     * @example
     * ```js
     * import { multiaddr } from '@multiformats/multiaddr'
     *
     * multiaddr('/ip4/127.0.0.1/tcp/4001').protoNames()
     * // [ 'ip4', 'tcp' ]
     * ```
     */
    protoNames: () => string[];
    /**
     * Returns a tuple of parts
     *
     * @example
     * ```js
     * import { multiaddr } from '@multiformats/multiaddr'
     *
     * multiaddr('/ip4/127.0.0.1/tcp/4001').tuples()
     * // [ [ 4, <Buffer 7f 00 00 01> ], [ 6, <Buffer 0f a1> ] ]
     * ```
     */
    tuples: () => Tuple[];
    /**
     * Returns a tuple of string/number parts
     * - tuples[][0] = code of protocol
     * - tuples[][1] = contents of address
     *
     * @example
     * ```js
     * import { multiaddr } from '@multiformats/multiaddr'
     *
     * multiaddr('/ip4/127.0.0.1/tcp/4001').stringTuples()
     * // [ [ 4, '127.0.0.1' ], [ 6, '4001' ] ]
     * ```
     */
    stringTuples: () => StringTuple[];
    /**
     * Encapsulates a Multiaddr in another Multiaddr
     *
     * @example
     * ```js
     * import { multiaddr } from '@multiformats/multiaddr'
     *
     * const mh1 = multiaddr('/ip4/8.8.8.8/tcp/1080')
     * // Multiaddr(/ip4/8.8.8.8/tcp/1080)
     *
     * const mh2 = multiaddr('/ip4/127.0.0.1/tcp/4001')
     * // Multiaddr(/ip4/127.0.0.1/tcp/4001)
     *
     * const mh3 = mh1.encapsulate(mh2)
     * // Multiaddr(/ip4/8.8.8.8/tcp/1080/ip4/127.0.0.1/tcp/4001)
     *
     * mh3.toString()
     * // '/ip4/8.8.8.8/tcp/1080/ip4/127.0.0.1/tcp/4001'
     * ```
     *
     * @param {MultiaddrInput} addr - Multiaddr to add into this Multiaddr
     */
    encapsulate: (addr: MultiaddrInput) => Multiaddr;
    /**
     * Decapsulates a Multiaddr from another Multiaddr
     *
     * @example
     * ```js
     * import { multiaddr } from '@multiformats/multiaddr'
     *
     * const mh1 = multiaddr('/ip4/8.8.8.8/tcp/1080')
     * // Multiaddr(/ip4/8.8.8.8/tcp/1080)
     *
     * const mh2 = multiaddr('/ip4/127.0.0.1/tcp/4001')
     * // Multiaddr(/ip4/127.0.0.1/tcp/4001)
     *
     * const mh3 = mh1.encapsulate(mh2)
     * // Multiaddr(/ip4/8.8.8.8/tcp/1080/ip4/127.0.0.1/tcp/4001)
     *
     * mh3.decapsulate(mh2).toString()
     * // '/ip4/8.8.8.8/tcp/1080'
     * ```
     *
     * @param {Multiaddr | string} addr - Multiaddr to remove from this Multiaddr
     */
    decapsulate: (addr: Multiaddr | string) => Multiaddr;
    /**
     * A more reliable version of `decapsulate` if you are targeting a
     * specific code, such as 421 (the `p2p` protocol code). The last index of the code
     * will be removed from the `Multiaddr`, and a new instance will be returned.
     * If the code is not present, the original `Multiaddr` is returned.
     *
     * @example
     * ```js
     * import { multiaddr } from '@multiformats/multiaddr'
     *
     * const addr = multiaddr('/ip4/0.0.0.0/tcp/8080/p2p/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSupNKC')
     * // Multiaddr(/ip4/0.0.0.0/tcp/8080/p2p/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSupNKC)
     *
     * addr.decapsulateCode(421).toString()
     * // '/ip4/0.0.0.0/tcp/8080'
     *
     * multiaddr('/ip4/127.0.0.1/tcp/8080').decapsulateCode(421).toString()
     * // '/ip4/127.0.0.1/tcp/8080'
     * ```
     */
    decapsulateCode: (code: number) => Multiaddr;
    /**
     * Extract the peerId if the multiaddr contains one
     *
     * @example
     * ```js
     * import { multiaddr } from '@multiformats/multiaddr'
     *
     * const mh1 = multiaddr('/ip4/8.8.8.8/tcp/1080/ipfs/QmValidBase58string')
     * // Multiaddr(/ip4/8.8.8.8/tcp/1080/ipfs/QmValidBase58string)
     *
     * // should return QmValidBase58string or null if the id is missing or invalid
     * const peerId = mh1.getPeerId()
     * ```
     */
    getPeerId: () => string | null;
    /**
     * Extract the path if the multiaddr contains one
     *
     * @example
     * ```js
     * import { multiaddr } from '@multiformats/multiaddr'
     *
     * const mh1 = multiaddr('/ip4/8.8.8.8/tcp/1080/unix/tmp/p2p.sock')
     * // Multiaddr(/ip4/8.8.8.8/tcp/1080/unix/tmp/p2p.sock)
     *
     * // should return utf8 string or null if the id is missing or invalid
     * const path = mh1.getPath()
     * ```
     */
    getPath: () => string | null;
    /**
     * Checks if two Multiaddrs are the same
     *
     * @example
     * ```js
     * import { multiaddr } from '@multiformats/multiaddr'
     *
     * const mh1 = multiaddr('/ip4/8.8.8.8/tcp/1080')
     * // Multiaddr(/ip4/8.8.8.8/tcp/1080)
     *
     * const mh2 = multiaddr('/ip4/127.0.0.1/tcp/4001')
     * // Multiaddr(/ip4/127.0.0.1/tcp/4001)
     *
     * mh1.equals(mh1)
     * // true
     *
     * mh1.equals(mh2)
     * // false
     * ```
     */
    equals: (addr: {
        bytes: Uint8Array;
    }) => boolean;
    /**
     * Resolve multiaddr if containing resolvable hostname.
     *
     * @example
     * ```js
     * import { multiaddr, resolvers } from '@multiformats/multiaddr'
     *
     * resolvers.set('dnsaddr', resolverFunction)
     * const mh1 = multiaddr('/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb')
     * const resolvedMultiaddrs = await mh1.resolve()
     * // [
     * //   Multiaddr(/ip4/147.75.83.83/tcp/4001/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb),
     * //   Multiaddr(/ip4/147.75.83.83/tcp/443/wss/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb),
     * //   Multiaddr(/ip4/147.75.83.83/udp/4001/quic/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb)
     * // ]
     * ```
     */
    resolve: (options?: AbortOptions) => Promise<Multiaddr[]>;
    /**
     * Gets a Multiaddrs node-friendly address object. Note that protocol information
     * is left out: in Node (and most network systems) the protocol is unknowable
     * given only the address.
     *
     * Has to be a ThinWaist Address, otherwise throws error
     *
     * @example
     * ```js
     * import { multiaddr } from '@multiformats/multiaddr'
     *
     * multiaddr('/ip4/127.0.0.1/tcp/4001').nodeAddress()
     * // {family: 4, address: '127.0.0.1', port: 4001}
     * ```
     */
    nodeAddress: () => NodeAddress;
    /**
     * Returns if a Multiaddr is a Thin Waist address or not.
     *
     * Thin Waist is if a Multiaddr adheres to the standard combination of:
     *
     * `{IPv4, IPv6}/{TCP, UDP}`
     *
     * @example
     * ```js
     * import { multiaddr } from '@multiformats/multiaddr'
     *
     * const mh1 = multiaddr('/ip4/127.0.0.1/tcp/4001')
     * // Multiaddr(/ip4/127.0.0.1/tcp/4001)
     * const mh2 = multiaddr('/ip4/192.168.2.1/tcp/5001')
     * // Multiaddr(/ip4/192.168.2.1/tcp/5001)
     * const mh3 = mh1.encapsulate(mh2)
     * // Multiaddr(/ip4/127.0.0.1/tcp/4001/ip4/192.168.2.1/tcp/5001)
     * const mh4 = multiaddr('/ip4/127.0.0.1/tcp/2000/wss/p2p-webrtc-star/p2p/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo2a')
     * // Multiaddr(/ip4/127.0.0.1/tcp/2000/wss/p2p-webrtc-star/p2p/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo2a)
     * mh1.isThinWaistAddress()
     * // true
     * mh2.isThinWaistAddress()
     * // true
     * mh3.isThinWaistAddress()
     * // false
     * mh4.isThinWaistAddress()
     * // false
     * ```
     */
    isThinWaistAddress: (addr?: Multiaddr) => boolean;
}
/**
 * Creates a Multiaddr from a node-friendly address object
 *
 * @example
 * ```js
 * import { fromNodeAddress } from '@multiformats/multiaddr'
 *
 * fromNodeAddress({address: '127.0.0.1', port: '4001'}, 'tcp')
 * // Multiaddr(/ip4/127.0.0.1/tcp/4001)
 * ```
 */
export declare function fromNodeAddress(addr: NodeAddress, transport: string): Multiaddr;
/**
 * Returns if something is a {@link Multiaddr} that is a resolvable name
 *
 * @example
 *
 * ```js
 * import { isName, multiaddr } from '@multiformats/multiaddr'
 *
 * isName(multiaddr('/ip4/127.0.0.1'))
 * // false
 * isName(multiaddr('/dns/ipfs.io'))
 * // true
 * ```
 */
export declare function isName(addr: Multiaddr): boolean;
/**
 * Check if object is a {@link Multiaddr} instance
 *
 * @example
 *
 * ```js
 * import { isMultiaddr, multiaddr } from '@multiformats/multiaddr'
 *
 * isMultiaddr(5)
 * // false
 * isMultiaddr(multiaddr('/ip4/127.0.0.1'))
 * // true
 * ```
 */
export declare function isMultiaddr(value: any): value is Multiaddr;
/**
 * A function that takes a {@link MultiaddrInput} and returns a {@link Multiaddr}
 *
 * @example
 * ```js
 * import { multiaddr } from '@libp2p/multiaddr'
 *
 * multiaddr('/ip4/127.0.0.1/tcp/4001')
 * // Multiaddr(/ip4/127.0.0.1/tcp/4001)
 * ```
 *
 * @param {MultiaddrInput} [addr] - If String or Uint8Array, needs to adhere to the address format of a [multiaddr](https://github.com/multiformats/multiaddr#string-format)
 */
export declare function multiaddr(addr?: MultiaddrInput): Multiaddr;
export { getProtocol as protocols };
//# sourceMappingURL=index.d.ts.map