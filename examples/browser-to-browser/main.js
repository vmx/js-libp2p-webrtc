import { createLibp2p } from 'libp2p'
import { webRTC, webRTCPeer } from '@libp2p/webrtc'
import { noise } from '@chainsafe/libp2p-noise'
import { FaultTolerance } from '@libp2p/interface-transport'



const listener = await createLibp2p({
      transports: [
        webRTCPeer({isInitiator: false}),
      ],
      //streamMuxers: [mplex()],
      connectionEncryption: [noise()],
      transportManager: {
        faultTolerance: FaultTolerance.NO_FATAL
      }
      //relay: {
      //  enabled: true,
      //  autoRelay: {
      //    enabled: true,
      //    maxListeners: 2
      //  }
      //}
    })

const dialer = await createLibp2p({
      transports: [
        webRTCPeer({isInitiator: true}),
      ],
      //streamMuxers: [mplex()],
      connectionEncryption: [noise()],
      transportManager: {
        faultTolerance: FaultTolerance.NO_FATAL
      }
      //identify: {
      //  timeout: 30000
      //}
    })


    await listener.start()
    await dialer.start()

console.log('vmx: listener: transportmanager:', listener.components.transportManager)
console.log('vmx: listener: multiaddrs:', listener.getMultiaddrs())

    const listenerAddresses = listener.getMultiaddrs()
    for (const address of listenerAddresses) {
      if (address.protoNames().includes('webrtc-initiator')) {
        await dialer.dial(address)
        // NOTE vmx 2023-01-24: break for now, later use all addresses.
        break
      }
    }

    const dialerAddresses = dialer.getMultiaddrs()
    for (const address of dialerAddresses) {
      if (address.protoNames().includes('webrtc-receiver')) {
        // This dialing needs to be on the receiver side, so propbably another multiaddr.
        await listener.dial(address)
        // NOTE vmx 2023-01-24: break for now, later use all addresses.
        break
      }
    }

console.log('vmx: dialer peers:', dialer.peerId.toString(), dialer.getPeers()[0].toString())
console.log('vmx: listener peers:', listener.peerId.toString(), listener.getPeers()[0].toString())

console.log(`vmx: peer connected dialer: '${dialer.getConnections().map(c => c.remoteAddr.toString())}'`)
console.log(`vmx: peer connected listener: '${listener.getConnections().map(c => c.remoteAddr.toString())}'`)

const stream = await dialer.dialProtocol(listenerAddresses[0], ['/echo/1.0.0'])
console.log('vmx: echo stream:', stream)

//const pingListenerLatency = await dialer.ping(listenerAddresses[0])
//console.log('vmx: ping listener latency:', pingListenerLatency)


//// Let's also try the connection the other way round
//    for (const address of listenerAddresses) {
//      if (address.protoNames().includes('webrtc-receiver')) {
//        dialer.dial(address)
//        // NOTE vmx 2023-01-24: break for now, later use all addresses.
//        break
//      }
//    }
//    for (const address of dialerAddresses) {
//      if (address.protoNames().includes('webrtc-initiator')) {
//        // This dialing needs to be on the receiver side, so propbably another multiaddr.
//        listener.dial(address)
//        // NOTE vmx 2023-01-24: break for now, later use all addresses.
//        break
//      }
//    }



    listener.peerStore.addEventListener('change:multiaddrs', (event) => {
      const { peerId } = event.detail
      console.log('vmx: peerid:', peerId)

      // Updated self multiaddrs?
      if (peerId.equals(listener.peerId)) {
        const webrtcAddr = `${listener.getMultiaddrs()[0].toString()}/webrtc-peer/p2p/${peerId}`
        relaying.resolve(webrtcAddr)
      }
    })



//await listener.dial(relayAddress)
