import Dexie, { Table } from 'dexie';
import { RelayType } from '~/enums';

export interface Relay {
  id?: number;
  port: number;
  containerIds: string[];
  relayType: RelayType;
  relayTag: string;
}

export class DbContext extends Dexie {
  relays!: Table<Relay>;

  constructor() {
    super('forge');
    this.version(1).stores({
      relays: '++id, port, containerIds, relayType, relayTag',
    });
  }
}

export const db = new DbContext();