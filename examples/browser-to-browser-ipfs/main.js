import { createLibp2p } from 'libp2p'
import { webRTC, webRTCPeer } from '@libp2p/webrtc'
import { FaultTolerance } from '@libp2p/interface-transport'
import * as IPFS from 'ipfs-core'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { plaintext } from 'libp2p/insecure'
import { peerIdFromString } from '@libp2p/peer-id'

// Multiaddress protocol used to transmit custom information.
const MEMORY = 777


const listener = () => {
  return createLibp2p({
      transports: [
        webRTCPeer(),
      ],
      connectionEncryption: [plaintext()],
      transportManager: {
        faultTolerance: FaultTolerance.NO_FATAL
      },
      pubsub: new gossipsub()
    })
}

const dialer = () => {
  return createLibp2p({
      transports: [
        webRTCPeer(),
      ],
      connectionEncryption: [plaintext()],
      transportManager: {
        faultTolerance: FaultTolerance.NO_FATAL
      },
      pubsub: new gossipsub()
    })
}


const ipfsListener = await IPFS.create({
  libp2p: listener,
  repo: 'listener',
  Bootstrap: [],
  "Addresses": {
   "Swarm": []
  },
  pubsub: gossipsub()
})

const ipfsDialer = await IPFS.create({
  libp2p: dialer,
  repo: 'dialer',
  Bootstrap: [],
  "Addresses": {
   "Swarm": []
  },
  pubsub: gossipsub()
})


// Only include addresses of the initiator.
const listenerAddresses = (await ipfsListener.swarm.localAddrs()).filter((address) => {
// return address.stringTuples().some(([protocol, value]) => {
//   return protocol === MEMORY && value === 'initiator'
// })
  return true
})
console.log('vmx: listener addresses:', listenerAddresses.map((address) => address.toString()))
// TODO vmx 2023-01-28: dial all addresses.
//const connection1 = ipfsDialer.swarm.connect(listenerAddresses[0])
//const connection2 = ipfsDialer.swarm.connect(listenerAddresses[1])
//await connection1
//await connection2


console.log('vmx: address book:', ipfsDialer.libp2p.peerStore.addressBook)
const listenerPeerId = peerIdFromString(listenerAddresses[0].getPeerId())
console.log('vmx: peerid:', listenerPeerId)
await ipfsDialer.libp2p.peerStore.addressBook.add(listenerPeerId, listenerAddresses)
const connection1 = ipfsDialer.swarm.connect(listenerPeerId)
await connection1


/*


// Only include addresses of the receiver.
const dialerAddresses = (await ipfsDialer.swarm.localAddrs()).filter((address) => {
// return address.stringTuples().some(([protocol, value]) => {
//   return protocol == MEMORY && value === 'receiver'
// })
  return true
})
console.log('vmx: dialer addresses:', dialerAddresses)
// TODO vmx 2023-01-28: dial all addresses.
await ipfsListener.swarm.connect(dialerAddresses[0])



const listenerPeerInfos = await ipfsListener.swarm.peers()
console.log('vmx: listener peers:', listenerPeerInfos)
const dialerPeerInfos = await ipfsDialer.swarm.peers()
console.log('vmx: dialer peers:', dialerPeerInfos)



const topic = 'data-exchange'
const receiveMessage = (message) => {
  console.log('vmx: message received:', new TextDecoder().decode(message.data))
}

await ipfsDialer.pubsub.subscribe(topic, receiveMessage)
await ipfsListener.pubsub.subscribe(topic, receiveMessage)

/// Wait until at least the given number of peers is subscribed to the given
/// topic. It returns a promise with the number of peers that were connected
/// at that time.
const waitForPeersSubscribed = (peer, numPeers, topic) => {
  return new Promise((resolve, _reject) => {
    const interval = setInterval(async () => {
      const peerIds = await peer.pubsub.peers(topic)
      if (peerIds.length >= numPeers) {
        resolve(peerIds.length)
        clearInterval(interval)
      }
    }, 1000)
  })
}

await waitForPeersSubscribed(ipfsDialer, 1, topic);

const message = new TextEncoder().encode('sending over some message.')
await ipfsDialer.pubsub.publish(topic, message)

*/
