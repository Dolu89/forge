import { Relay, db } from "~/db/db";
import { DockerStatus, RelayType } from "~/enums";
import relayData from "~/data/relay";
import axios from "axios";
import { RelayExtended } from "~/interfaces";

class RelayService {

    private async getNextPort(relayType: RelayType) {
        const portStart = relayData.find(r => r.name === relayType)!.portStart;
        const usedPorts = (await db.relays.where({ relayType }).toArray()).map(r => (r.port));
        let firstUnusedPort = portStart;
        while (usedPorts.includes(firstUnusedPort)) {
            firstUnusedPort++;
        }
        return firstUnusedPort;
    }

    public async getById(id: number): Promise<RelayExtended | undefined> {
        const relay = await db.relays.get({ id });
        if (!relay) return undefined;
        const statusResult = await axios.post('/api/docker/status', { containerIds: relay.containerIds })
        if (statusResult.status !== 200) throw new Error('Failed to get status');
        return {
            ...relay,
            status: statusResult.data,
        }
    }

    public async getAll(): Promise<RelayExtended[]> {
        const relays = await db.relays.toArray();
        const relayPromises = relays.map(async (r) => {
            const statusResult = await axios.post('/api/docker/status', { containerIds: r.containerIds })
            if (statusResult.status !== 200) throw new Error('Failed to get status');
            return {
                ...r,
                status: statusResult.data,
            }
        });
        return await Promise.all(relayPromises);
    }

    public async add(relayType: RelayType, tag: string): Promise<RelayExtended> {
        const result = await axios.post('/api/docker/launch', {
            port: await this.getNextPort(relayType),
            relayType,
            tag
        })
        if (result.status !== 200) throw new Error('Failed to launch container');

        const data = result.data.data
        const relay: Relay = {
            port: data.port,
            containerIds: data.containerIds,
            relayType,
            relayTag: tag
        }
        const relayId = await db.relays.add(relay);

        const statusResult = await axios.post('/api/docker/status', { containerIds: data.containerIds })
        if (statusResult.status !== 200) throw new Error('Failed to get status');

        return { ...relay, id: relayId as number, status: statusResult.data };
    }

    public async start(port: number): Promise<DockerStatus> {
        const relay = await db.relays.get({ port });
        if (!relay) throw new Error('Relay not found');
        const result = await axios.post('/api/docker/start', { containerIds: relay.containerIds })
        if (result.status !== 200) throw new Error('Failed to start container');
        return result.data;
    }

    public async stop(port: number): Promise<DockerStatus> {
        const relay = await db.relays.get({ port });
        if (!relay) throw new Error('Relay not found');
        const result = await axios.post('/api/docker/stop', { containerIds: relay.containerIds })
        if (result.status !== 200) throw new Error('Failed to stop container');
        return result.data;
    }

    public async remove(port: number) {
        const relay = await db.relays.get({ port });
        if (!relay) throw new Error('Relay not found');
        console.log('Stopping relay')
        await this.stop(port);
        console.log('Deleting containers')
        await axios.post('/api/docker/delete', { containerIds: relay.containerIds })
        console.log('Deleting relay from DB')
        await db.relays.delete(relay.id as number);
    }

}

export default new RelayService();