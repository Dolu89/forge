import { defineStore } from 'pinia'
import { db } from '~/db/db'
import { IndexableType } from 'dexie'
import { RelayType } from '~/enums'
import { RelayExtended } from '~/interfaces'

export const useRelaysStore = defineStore('relays', {
  state: (): { relays: RelayExtended[] } => {
    return { relays: [] }
  },
  getters: {
    getAll: (state): RelayExtended[] => {
      return state.relays.sort((a, b) => a.port - b.port);
    }
  },
  actions: {
    async initStore() {
      this.relays = await RelayService.getAll();
    },
    async add(relayType: RelayType, tag: string) {
      const relay = await RelayService.add(relayType, tag)
      this.relays = [...this.relays, relay]
    },
    async remove(id?: number) {
      const relay = this.relays.find(r => r.id === id)
      if (!relay) return;
      await RelayService.remove(relay.port)
      this.relays = this.relays.filter(r => r.id !== id)
    },
    async start(port: number) {
      const relay = this.relays.find(r => r.port === port)
      if (!relay) return
      const status = await RelayService.start(port)
      relay.status = status
    },
    async stop(port: number) {
      const relay = this.relays.find(r => r.port === port)
      if (!relay) return
      const status = await RelayService.stop(port)
      relay.status = status
    },
    async startAll() {
      for (const relay of this.relays) {
        this.start(relay.port)
      }
    },
    async stopAll() {
      for (const relay of this.relays) {
        this.stop(relay.port)
      }
    }
  },
})