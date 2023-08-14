import { defineStore } from 'pinia'
import axios from 'axios'
import { db, Relay } from '~/db/db'
import RelayService, { RelayExtended } from '~/services/RelayService'
import { IndexableType } from 'dexie'

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
      this.relays = (await db.relays.toArray()).map(r => {
        return {
          ...r,
          running: RelayService.hasChildProcess(r.port)
        }
      });
    },
    async add() {
      const result = await axios.post('/api/start-relay', { port: await RelayService.getNextPort() })
      if (result.status === 200) {
        const relayId = await db.relays.add({ port: result.data.port });
        this.relays = [...this.relays, ({ port: result.data.port, id: relayId as number, running: true })]
      }
    },
    async remove(id?: number) {
      const relay = this.relays.find(r => r.id === id)
      if (!relay) return;
      await this.stop(relay.port)
      await db.relays.delete(id as IndexableType);
      this.relays = this.relays.filter(r => r.id !== id)
    },
    async start(port: number) {
      await axios.post('/api/start-relay', { port })
      const relay = this.relays.find(r => r.port === port)
      if (relay) relay.running = true;
    },
    async stop(port: number) {
      await axios.post('/api/stop-relay', { port })
      const relay = this.relays.find(r => r.port === port)
      if (relay) relay.running = false;
    },
    async startAll() {
      for (const relay of this.relays) {
        await this.start(relay.port)
      }
    },
    async stopAll() {
      for (const relay of this.relays) {
        await this.stop(relay.port)
      }
    }
  },
})