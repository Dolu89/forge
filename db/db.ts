import Dexie, { Table } from 'dexie';
import { RelayType } from '~/enums';

export interface RelayDB {
  id?: number;
  port: number;
  path: string;
  relayType: RelayType;
  relayTag: string;
}

export class DbContext extends Dexie {
  relays!: Table<RelayDB>;

  constructor() {
    super('forge');
    this.version(1).stores({
      relays: '++id, port, path, relayType, relayTag',
    });
  }
}

export const db = new DbContext();