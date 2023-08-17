import { Relay, db } from "~/db/db";
import { DockerStatus, RelayType } from "~/enums";
import relayData from "~/data/relay";
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
        return {
            ...relay,
            status: await window.api.docker.getStatus(relay.containerIds),
        }
    }

    public async getAll(): Promise<RelayExtended[]> {
        const relays = await db.relays.toArray();
        const relayPromises = relays.map(async (r) => {
            return {
                ...r,
                status: await window.api.docker.getStatus(r.containerIds),
            }
        });
        return await Promise.all(relayPromises);
    }

    public async add(relayType: RelayType, tag: string): Promise<RelayExtended> {
        const nextPort = await this.getNextPort(relayType);
        const result = await window.api.docker.create(nextPort, relayType, tag);

        const relay: Relay = {
            port: nextPort,
            containerIds: result.containerIds,
            relayType,
            relayTag: tag
        }
        const relayId = await db.relays.add(relay);

        const status = await window.api.docker.getStatus(relay.containerIds)

        return { ...relay, id: relayId as number, status: status };
    }

    public async start(port: number): Promise<DockerStatus> {
        const relay = await db.relays.get({ port });
        if (!relay) throw new Error('Relay not found');
        await window.api.docker.start(relay.containerIds);
        const status = await window.api.docker.getStatus(relay.containerIds);
        return status;
    }

    public async stop(port: number): Promise<DockerStatus> {
        const relay = await db.relays.get({ port });
        if (!relay) throw new Error('Relay not found');
        await window.api.docker.stop(relay.containerIds);
        const status = await window.api.docker.getStatus(relay.containerIds);
        return status;
    }

    public async remove(port: number) {
        const relay = await db.relays.get({ port });
        if (!relay) throw new Error('Relay not found');
        await this.stop(port);
        await window.api.docker.remove(relay.containerIds);
        await db.relays.delete(relay.id as number);
    }

}

export default new RelayService();