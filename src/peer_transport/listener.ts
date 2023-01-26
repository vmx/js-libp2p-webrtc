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

export class WebRTCPeerListener extends EventEmitter<ListenerEvents> implements Listener {
  constructor (
  ) {
    super()
  }

    private listeningAddrs: Multiaddr[] = []
    async listen (ma: Multiaddr): Promise<void> {
      this.listeningAddrs.push(ma)
    }

    getAddrs (): Multiaddr[] { return this.listeningAddrs }
    async close () { }
}
