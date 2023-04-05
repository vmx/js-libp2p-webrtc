import type { Connection } from '@libp2p/interface-connection'
import { CreateListenerOptions, DialOptions, Listener, symbol, Transport } from '@libp2p/interface-transport'
import type { TransportManager, Upgrader } from '@libp2p/interface-transport'
import { multiaddr, Multiaddr } from '@multiformats/multiaddr'
import type { Registrar } from '@libp2p/interface-registrar'
import type { PeerId } from '@libp2p/interface-peer-id'
import { WebRTCMultiaddrConnection } from '../maconn.js'
import type { Startable } from '@libp2p/interfaces/startable'
import { DataChannelMuxerFactory } from '../muxer.js'
import { WebRTCPeerListener } from './listener.js'
import type { PeerStore } from '@libp2p/interface-peer-store'
import type { ConnectionManager } from '@libp2p/interface-connection-manager'

import { base64url } from 'multiformats/bases/base64'
import * as digest from 'multiformats/hashes/digest'

export const TRANSPORT = '/webrtc-peer'
export const PROTOCOL = '/webrtc-peer/0.0.1'
export const CODE = 281

const SHA2_256 = 0x12
const CERTHASH = 466
// Multiaddress protocol used to transmit custom information.
const MEMORY = 777
const UFRAG = 'hard-coded-ufrag-to-make-munging-easier'

//// The number of possible peer connections, each creates two WebRTC
//// connections.
//const NUM_CONNECTIONS = 2

/**
 * Created by converting the hexadecimal protocol code to an integer.
 *
 * {@link https://github.com/multiformats/multiaddr/blob/master/protocols.csv}
 */
export const WEBRTC_CODE: number = 280

/**
 * Created by converting the hexadecimal protocol code to an integer.
 *
 * {@link https://github.com/multiformats/multiaddr/blob/master/protocols.csv}
 */
export const CERTHASH_CODE: number = 466

export interface WebRTCPeerTransportComponents {
  peerId: PeerId
  registrar: Registrar
  upgrader: Upgrader
  transportManager: TransportManager
  connectionManager: ConnectionManager
  peerStore: PeerStore
}

const createConnection = async (connectionType: 'initiator' | 'receiver', peerId: PeerId) => {
  const certificate = await RTCPeerConnection.generateCertificate({
    name: 'ECDSA',
    // @ts-ignore
    namedCurve: 'P-256',
    hash: 'SHA-256',
  })

  console.log('vmx: certificate:', certificate)
  const connection = new RTCPeerConnection({certificates: [certificate]})
  console.log('vmx: connection is set:', connection)

  connection.addEventListener('iceconnectionstatechange', (event) => {
    // @ts-ignore
    console.log('iceconnectionstatechange: gathering state:', event.target.iceGatheringState)
  })

  connection.addEventListener("icecandidate", (event) => {
    console.log('vmx: icecandidates event: candidate:', event.candidate)
  })

  const dataChannel = connection.createDataChannel("data-channel", {
    negotiated: true,
    id: 0
  })
  // Firefox defaults to `blob`, while Chromium doesn't support it.
  dataChannel.binaryType = 'arraybuffer'
  dataChannel.addEventListener("open", (event) => {
    console.log('vmx: data channel opened')
    //dataChannel.send("This message was sent as a data channel was opened")
  })
  dataChannel.addEventListener('message', (event) => {
    console.log(`vmx: data channel received:`, event.data)
  })

  const address = await createMultiaddr(connection, connectionType, peerId)

  return { connection, dataChannel, address }
}


// From https://stackoverflow.com/questions/38987784/how-to-convert-a-hexadecimal-string-to-uint8array-and-back-in-javascript/50868276#50868276
const uint8ArrayFromHex = (hex: string) => {
  return Uint8Array.from(
    hex.match(/.{1,2}/g)!.map((byte) => {
      return parseInt(byte, 16)
    })
  )
}

// From https://stackoverflow.com/questions/38987784/how-to-convert-a-hexadecimal-string-to-uint8array-and-back-in-javascript/50868276#50868276
const hexFromUint8Array = (bytes: Uint8Array) => {
  return bytes.reduce((str: string, byte: number) => {
    return str + byte.toString(16).padStart(2, '0')
  }, '')
}

const getFingerprintFromOffer = (offer: RTCSessionDescriptionInit) => {
  for (const line of offer.sdp!.split('\n')) {
    if (line.startsWith('a=fingerprint:')) {
      return line.substring('a=fingerprint:'.length).trim()
    }
  }
}

// Returns a Base64Url multibase encoded multihash certhash.
const getCerthashFromOffer = (offer: RTCSessionDescriptionInit) => {
  const fingerprint = getFingerprintFromOffer(offer)
  const hash = fingerprint!.split(' ')[1]
  const hex = hash.replaceAll(':', '')
  const bytes = uint8ArrayFromHex(hex.toLowerCase())
  const multihash = digest.create(SHA2_256, bytes)
  const multibase = base64url.encode(multihash.bytes)
  return multibase
}


// From https://github.com/little-bear-labs/js-libp2p-webrtc/blob/b2e4f60e50d68e79cba2d88b7dae88ef70ec6f5f/src/sdp.ts#L110-L120
const munge = (offer: RTCSessionDescriptionInit) => {
  offer.sdp = offer.sdp!
    .replace(/\na=ice-ufrag:[^\n]*\n/, '\na=ice-ufrag:' + UFRAG + '\n')
    .replace(/\na=ice-pwd:[^\n]*\n/, '\na=ice-pwd:' + UFRAG + '\n')
  return offer
}

const waitForIceCandidates = (connection: RTCPeerConnection): Promise<RTCIceCandidate[]> => {
  return new Promise((resolve, _reject) => {
    const candidates: RTCIceCandidate[] = []
    connection.addEventListener('icecandidate', (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate && event.candidate.candidate) {
        candidates.push(event.candidate)
      } else {
        resolve(candidates)
      }
    })
  })
}

const waitForDataChannelOpen = (dataChannel: RTCDataChannel): Promise<void> => {
  return new Promise((resolve, _reject) => {
    dataChannel.addEventListener('open', () => {
      console.log('vmx: wait for open')
      resolve()
    })
  })
}

// Returns a Multiaddr if the candidate can be used for inbound connections,
// else it returns `null`.
const candidateToHostPort = (candidate: RTCIceCandidate) => {
  const [
    _candidate,
    _componentId,
    _transport,
    _priority,
    connectionAddress,
    port,
    _typ,
    _candidateType,
    ...extensionsList
  ] = candidate.candidate.split(' ')

  const extensions: {[key: string] : string} = {}
  for (let ii = 0; ii < extensionsList.length; ii += 2) {
    extensions[extensionsList[ii]] = extensionsList[ii + 1]
  }

  // Active TCP connections cannot be used for incoming requests.
  if (extensions?.tcptype === 'active') {
    return null
  }

  return `${connectionAddress}_${port}`
}

const createMultiaddr = async (connection: RTCPeerConnection, connectionType: 'initiator' | 'receiver', peerId: PeerId) => {
  const offer = await connection.createOffer()
  const certhash = await getCerthashFromOffer(offer)
  const mungedOffer = munge(offer)
  console.log('vmx: munged offer:', mungedOffer)
  await connection.setLocalDescription(mungedOffer)
  const iceCandidates = await waitForIceCandidates(connection)
  // console.log('vmx: icecandidate:', iceCandidates.map((candidate) => candidate.toJSON()))
  console.log('vmx: icecandidate:', iceCandidates)

  let addr = ''

  const hostPortsString = iceCandidates.map((candidate) => {
    return candidateToHostPort(candidate)
  }).filter(Boolean).join('|')

  console.log('vmx: hostportsstring:', hostPortsString)

  addr += '/webrtc/certhash/' + certhash
  addr += `/memory/${connectionType}=${hostPortsString}`
  addr += `/p2p/${peerId}`

  console.log('vmx: offer: qr code data:', JSON.stringify(addr))

  return multiaddr(addr)
}

const ipv = (host: string) => {
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) {
    return 'IP4'
  } else {
    return 'IP6'
  }
}

const certhashToFingerprint = (certhash: string) => {
  const baseDecoded = base64url.decode(certhash)
  const multihashDecoded = digest.decode(baseDecoded)
  const hex = hexFromUint8Array(multihashDecoded.digest).toUpperCase()
  const fingerprint = hex?.match(/.{2}/g)?.join(':')
  return `sha-256 ${fingerprint}`
}

const ma2sdp = (ma: Multiaddr, isOffer: boolean) => {
  const memoryValue = ma.stringTuples().filter(([protocol, value]) => {
    return protocol === MEMORY
  }).map(([_protocol, value]) => {
    return value
  })[0]
  console.log('vmx: memory value:', memoryValue)
  const [_, hostPortsString] = memoryValue!.split('=')
  const hostPorts = hostPortsString.split('|').map((hostPort) => {
    const [host, port] = hostPort.split('_')
    return { host, port: parseInt(port) }
  })
  const candidates = hostPorts.map(({host, port}) => {
    return `a=candidate:1467250027 1 UDP 1467250027 ${host} ${port} typ host`
  })

  let setup
  if (isOffer) {
    setup = 'active'
  } else {
    setup = 'passive'
  }

  const ip = hostPorts[0].host
  const ipVersion = ipv(hostPorts[0].host)
  const port = hostPorts[0].port
  const fingerprint = ma.stringTuples().filter(([proto, value]) => {
    console.log('vmx: ma2sdp: fingerprint: filter: proto, value:', proto, value, CERTHASH)
    return proto === CERTHASH
  }).map(([_proto, certhash]) => {
    console.log('vmx: ma2sdp: fingerprint: filter: certhash:', certhash)
    return certhashToFingerprint(certhash!)
  }).pop()
  console.log('vmx: m2sdp: fingerprint:', fingerprint)


  const sdp = `v=0
o=- 0 0 IN ${ipVersion} ${ip}
s=-
c=IN ${ipVersion} ${ip}
t=0 0
m=application ${port} UDP/DTLS/SCTP webrtc-datachannel
a=mid:0
a=setup:${setup}
a=ice-ufrag:${UFRAG}
a=ice-pwd:${UFRAG}
a=fingerprint:${fingerprint}
a=sctp-port:5000
a=max-message-size:262144
`
  if (isOffer) {
    return sdp + candidates.join('\n') + '\n'
  } else {
    return sdp
  }
}

//const mungeOffer = (addresses: Multiaddr[]): {type: 'offer', sdp: string} => {
//const mungeOffer = (ma: Multiaddr, hostPorts: {host: string, port: number][]): {type: 'offer', sdp: string} => {
const mungeOffer = (ma: Multiaddr): {type: 'offer', sdp: string} => {
  // Construct an SDP offer from a Multiaddress.
  return {
    type: 'offer',
    //sdp: ma2sdp(addresses, true)
    sdp: ma2sdp(ma, true)
  }
}

//const mungeAnswer = (addresses: Multiaddr[]): {type: 'answer', sdp: string} => {
const mungeAnswer = (ma: Multiaddr): {type: 'answer', sdp: string} => {
  // Construct an SDP answer from a Multiaddress.
  return {
    type: 'answer',
    //sdp: ma2sdp(addresses, false)
    sdp: ma2sdp(ma, false)
  }
}

export class WebRTCPeerTransport implements Transport, Startable {
  private readonly _started = false
  private initiator?: { connection: RTCPeerConnection, dataChannel: RTCDataChannel, address: Multiaddr }
  private receiver?: { connection: RTCPeerConnection, dataChannel: RTCDataChannel, address: Multiaddr }
  private established: { connection: RTCPeerConnection, dataChannel: RTCDataChannel, address: Multiaddr }[] = []
  //private initiatorsAddresses: Multiaddr[]
  //private receiversAddresses: Multiaddr[]
  private listener: Listener | null = null

  constructor (
    private readonly components: WebRTCPeerTransportComponents,
  ) {
  }

  isStarted () {
    return this._started
  }

  async start () {
    // TODO vmx 2023-01-25: check if it makes sense to use `receiver` here.
    const initiator = await createConnection('receiver', this.components.peerId)
    console.log('vmx: peer transport: transport: about to call transport manager listen')
    // TODO vmx 2023-03-04: It might make sense to call it only once with both initaor and receiver addresses.
    await this.components.transportManager.listen([initiator.address])
    this.initiator = initiator

    // TODO vmx 2023-01-25: check if it makes sense to use `receiver` here.
    const receiver = await createConnection('initiator', this.components.peerId)
    await this.components.transportManager.listen([receiver.address])
    this.receiver = receiver

    console.log('vmx: transport: it should listen to some addresses now:', initiator.address.toString(), receiver.address.toString())
    console.log('vmx: transport: it listens to addresses:', this.components.transportManager.getAddrs().map((address) => address.toString()))
  }

  async stop () {
    //await this.components.registrar.unhandle(PROTOCOL)
  }

  createListener (options: CreateListenerOptions): Listener {
    if (this.listener === null) {
      this.listener = new WebRTCPeerListener()
    }
    return this.listener
  }

  get [Symbol.toStringTag] (): string {
    return '@libp2p/webrtc'
  }

  get [symbol] (): true {
    return true
  }

  /**
   * Takes a list of `Multiaddr`s and returns only valid addresses for the transport
   */
  filter (multiaddrs: Multiaddr[]): Multiaddr[] {
    return multiaddrs.filter(validMa)
  }

  /*
   * dial connects to a remote via the circuit relay or any other protocol
   * and proceeds to upgrade to a webrtc connection.
   * multiaddr of the form: <multiaddr>/webrtc-peer/p2p/<destination-peer>
   * For a circuit relay, this will be of the form
   * <relay address>/p2p/<relay-peer>/p2p-circuit/p2p/<destination-peer>/webrtc-sdp/p2p/<destination-peer>
  */
  async dial (ma: Multiaddr, options: DialOptions): Promise<Connection> {
    console.log('vmx: peer transport: transport: dial: am i callled?', ma.protoNames())

    const memoryValue = ma.stringTuples().filter(([protocol, value]) => {
      return protocol === MEMORY
    }).map(([_protocol, value]) => {
      return value
    })[0]
    console.log('vmx: memory value:', memoryValue)
    const [connectionType, _] = memoryValue!.split('=')

    let connection
    switch (connectionType) {
      case 'initiator': {
        connection = this.initiator!

        const offer = mungeOffer(ma)
        await connection.connection.setRemoteDescription(offer)
        await connection.connection.createAnswer()
        const answer = mungeAnswer(connection.address)
        await connection.connection.setLocalDescription(answer)
        break
      }
      case 'receiver': {
        connection = this.receiver!

        const answer = mungeAnswer(ma)
        await connection.connection.setRemoteDescription(answer)
        break
      }
      default:
        throw new Error('unsupported webrtc connection mode')
    }

    //await waitForConnected(pc)
    await waitForDataChannelOpen(connection.dataChannel)
    console.log('vmx: about to upgrade outbound connection')

    const result = await options.upgrader.upgradeOutbound(
      new WebRTCMultiaddrConnection({
        peerConnection: connection.connection,
        timeline: { open: (new Date()).getTime() },
        remoteAddr: ma
      }),
      {
        skipProtection: true,
        skipEncryption: true,
        //muxerFactory: new DataChannelMuxerFactory(pc, '/webrtc-peer')
        muxerFactory: new DataChannelMuxerFactory(connection.connection)
      }
    )

    console.log('vmx: connected! create new connection')
    this.established.push(connection)

    // The connection was successful, hence create a new connection for the
    // next time someone wants to connect.
    switch (connectionType) {
     case 'initiator': {
       // TODO vmx 2023-03-05: Think again about naming, as using `receiver` here is confusing.
       this.initiator = await createConnection('receiver', this.components.peerId)
       await this.components.transportManager.listen([this.initiator.address])
       break
     }
     case 'receiver': {
       // TODO vmx 2023-03-05: Think again about naming, as using `receiver` here is confusing.
       this.receiver = await createConnection('initiator', this.components.peerId)
       await this.components.transportManager.listen([this.receiver.address])
       break
     }
     default:
       throw new Error('unsupported webrtc connection mode')
    }

    return result
  }
}

/**
 * Determine if a given multiaddr contains a WebRTC Code (280),
 * a Certhash Code (466) and a PeerId
 */
const validMa = (ma: Multiaddr): boolean => {
  const codes = ma.protoCodes()
  return codes.includes(WEBRTC_CODE) && codes.includes(CERTHASH_CODE) && ma.getPeerId() != null
}
