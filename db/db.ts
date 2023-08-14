import Dexie, { Table } from 'dexie';

export interface Relay {
  id?: number;
  port: number;
}

export interface Settings {
  id?: number;
  portStart: number;
}

export class DbContext extends Dexie {
  relays!: Table<Relay>;
  settings!: Table<Settings>;

  constructor() {
    super('forge');
    this.version(1).stores({
      relays: '++id, port',
      settings: '++id, portStart'
    });

    this.on('ready', async () => {
      const settings = await this.settings.toArray();
      if (settings.length === 0) {
        await this.settings.add({ portStart: 9300 });
      }
    })
  }
}

export const db = new DbContext();