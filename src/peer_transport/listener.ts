import type { PeerId } from '@libp2p/interface-peer-id'
import type { ListenerEvents, TransportManager, Upgrader, Listener } from '@libp2p/interface-transport'
import { EventEmitter } from '@libp2p/interfaces/events'
// @ts-ignore
import { Multiaddr } from '@multiformats/multiaddr'

export interface ListenerOptions {
  peerId: PeerId
  upgrader: Upgrader
  transportManager: TransportManager
}

type AddressInfo = {
  isInitiator: boolean;
  certhash: string;
  address: Multiaddr;
}

const CERTHASH = 466
// Multiaddress protocol used to transmit custom information.
const MEMORY = 777

//const isInitiator = (address: Multiaddr): boolean => {
//  return ma.stringTuples().some(([protocol, value]) => {
//    return protocol == MEMORY && value === 'initiator'
//  })
//}

/// Extracts the information that we need.
const parseAddress = (address: Multiaddr): AddressInfo => {
  //const result: AddressInfo = { address }
  const result = {} as AddressInfo
  result.address = address
  for (const [protocol, value] of address.stringTuples()) {
    switch (protocol) {
      case MEMORY: {
        result.isInitiator = value === 'initiator'
        break
      }
      case CERTHASH: {
        result.certhash = value!
        break
      }
    }
  }
  return result
}

// Updates the given addresses with the new address.
//
// It might be added or replace the existing ones.
const updateddresses = (info: AddressInfo, addresses: Multiaddr[]): Multiaddr[] => {
  // No addressed are there yet.
  if (addresses.length === 0) {
    addresses.push(info.address)
  } else {
    const existing = parseAddress(addresses[0])
    // If a connection has several ICE candidates, it also has several
    // multiaddresses.
    if (info.certhash === existing.certhash) {
      addresses.push(info.address)
    }
    // If the address is from a difference connection, replace all existing
    // ones with the new address.
    else {
      addresses = [info.address]
    }
  }
  return addresses
}

export class WebRTCPeerListener extends EventEmitter<ListenerEvents> implements Listener {
  //constructor (
  //) {
  //  super()
  //}

    private initiator: Multiaddr[] = []
    private receiver: Multiaddr[] = []

    async listen (address: Multiaddr): Promise<void> {
      const info = parseAddress(address)
      if (info.isInitiator) {
        this.initiator = updateddresses(info, this.initiator)
      } else {
        this.receiver = updateddresses(info, this.receiver)
      }
    }

    getAddrs (): Multiaddr[] { return this.initiator.concat(this.receiver) }
    async close () { }
}
