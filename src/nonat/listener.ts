import type { PeerId } from '@libp2p/interface-peer-id'
import type { ListenerEvents, TransportManager, Upgrader, Listener } from '@libp2p/interface-transport'
import { EventEmitter } from '@libp2p/interfaces/events'
import type { Multiaddr } from '@multiformats/multiaddr'

// Multiaddress protocol used to transmit custom information.
const MEMORY = 777

export interface ListenerOptions {
  peerId: PeerId
  upgrader: Upgrader
  transportManager: TransportManager
}

const isInitiator = (address: Multiaddr): boolean => {
  //return address.stringTuples().some(([protocol, value]: [number, string]): boolean => {
  return address.stringTuples().some(([protocol, value]) => {
    return protocol === MEMORY && value!.startsWith('initiator')
  })
}

export class WebRTCPeerListener extends EventEmitter<ListenerEvents> implements Listener {
    private initiator?: Multiaddr
    private receiver?: Multiaddr

    async listen (address: Multiaddr): Promise<void> {
      if (isInitiator(address)) {
        this.initiator = address
      } else {
        this.receiver = address
      }
    }

    getAddrs (): Multiaddr[] {
      const addresses = []
      if (this.initiator !== undefined) {
        addresses.push(this.initiator)
      }
      if (this.receiver !== undefined) {
        addresses.push(this.receiver)
      }
      return addresses
    }
  async close (): Promise<void> { }
}
