
// CommonJS only. ES Modules not supported for Dockerode when called from Electron main process. But works fine as type
const Docker = require('dockerode');
import type Dockerode from 'dockerode';
const DockerodeCompose = require('dockerode-compose');

// @ts-ignore
import fs from 'node:fs/promises';
import { DockerStatus, RelayType } from '../enums';
import stream from "stream"
import ansiRegex from 'ansi-regex'
import { isProd } from "../utils"
import { app } from "electron"
import { isLinux, isMac } from '~/utils/system';

class DockerService {

    private docker: Dockerode | undefined

    constructor() {
        console.log('docker service init')
        this.intialize();
    }

    private async intialize() {
        if (this.docker) return

        if (isMac() || isLinux()) {
            // try to detect the socket path in the default locations on linux/mac
            const socketPaths = [
                `${process.env.HOME}/.docker/run/docker.sock`,
                `${process.env.HOME}/.docker/desktop/docker.sock`,
                '/var/run/docker.sock',
            ];
            for (const socketPath of socketPaths) {
                const sock = await fs.stat(socketPath).catch(() => { });
                if (sock) {
                    console.log('docker socket detected:', socketPath);
                    this.docker = new Docker({ socketPath });
                    break;
                }
            }
        }

        if (this.docker) return
        this.docker = new Docker()
    }

    public async getDockerStatus(): Promise<DockerStatus> {
        await this.intialize().catch(() => { });
        return this.docker ? DockerStatus.Running : DockerStatus.Stopped
    }

    public async getStatus(containerIds: string[]): Promise<DockerStatus> {
        if (!this.docker) {
            throw new Error('Docker not initialized');
        }

        let allStatus = []
        for (const containerId of containerIds) {
            const container = this.getContainer(containerId)
            const containerInfo = await container.inspect()
            allStatus.push(containerInfo.State.Status === 'running')
        }

        if (allStatus.every(s => s)) {
            return DockerStatus.Running
        }
        if (allStatus.some(s => s)) {
            return DockerStatus.Partial
        }
        return DockerStatus.Stopped
    }

    public async startContainers(containerIds: string[]): Promise<void> {
        if (!this.docker) {
            throw new Error('Docker not initialized');
        }

        for (const containerId of containerIds) {
            const container = this.getContainer(containerId)
            await container.start().catch(() => console.log('Relay already started'))
        }
    }

    public async removeContainers(containerIds: string[]): Promise<void> {
        if (!this.docker) {
            throw new Error('Docker not initialized');
        }

        console.log("removing containers", containerIds.join(", "))

        for (const containerId of containerIds) {
            const container = this.getContainer(containerId)
            await container.remove()
        }
    }

    public getContainer(containerId: string): Dockerode.Container {
        if (!this.docker) {
            throw new Error('Docker not initialized');
        }

        return this.docker.getContainer(containerId)
    }

    public async stopContainers(containerIds: string[]): Promise<void> {
        if (!this.docker) {
            throw new Error('Docker not initialized');
        }

        for (const containerId of containerIds) {
            const container = this.getContainer(containerId)
            await container.stop().catch(() => console.log('Relay already stopped'))
        }
    }

    public streamLogs(containerIds: string[], callback: (data: string) => void): () => void {
        const streams: stream.PassThrough[] = []
        for (const containerId of containerIds) {
            const container = this.getContainer(containerId)
            var logStream = new stream.PassThrough();
            streams.push(logStream)

            logStream.on('data', function (chunk: Buffer) {
                let data = chunk.toString('utf8')
                data = data.replace(ansiRegex(), '')
                callback(data)
            });

            container.logs({ follow: true, stdout: true, stderr: true, tail: 100 }, function (err: unknown, stream: NodeJS.ReadableStream | undefined) {
                if (err) return
                container.modem.demuxStream(stream, logStream, logStream);
            });

        }

        function close() {
            for (const stream of streams) {
                stream.destroy()
            }
        }

        return close
    }

    public async create(port: number, relayType: RelayType, tag: string): Promise<{ port: number, containerIds: string[] }> {
        if (!this.docker) {
            throw new Error('Docker not initialized');
        }

        let composeFileData = ''
        switch (relayType) {
            case RelayType.NostrRsRelay:
                composeFileData = await this.getNostrRsRelayDockerComposeFileData(tag, port)
                break;
            case RelayType.Nostream:
                composeFileData = await this.getNostreamDockerComposeFileData(tag, port)
                break;
            default:
                throw new Error('Unknown relay type')
        }

        const destinationFolder = `${app.getPath('userData')}/docker`
        await fs.mkdir(destinationFolder, { recursive: true })
        const finalComposeFilePath = `${destinationFolder}/docker-compose.yml`
        await fs.writeFile(finalComposeFilePath, composeFileData)
        const dockerGroupName = isProd ? 'forge_' : 'forge_dev_'
        const compose = new DockerodeCompose(this.docker, finalComposeFilePath, dockerGroupName + port.toString())
        const state = await compose.up()

        return {
            port,
            containerIds: state.services.map((s: { id: string }) => s.id)
        }
    }

    private async getDockerComposeFileData(composeFileName: string) {
        return fs.readFile(`${app.getAppPath()}/docker/${composeFileName}`, 'utf8')
    }

    private async getNostrRsRelayDockerComposeFileData(tag: string, port: number) {
        const composeFile = await this.getDockerComposeFileData('docker-compose.nostr-rs-relay.yml')
        return composeFile.replaceAll('{{tag}}', tag).replaceAll('{{port}}', port.toString())
    }

    private async getNostreamDockerComposeFileData(tag: string, port: number) {
        const composeFile = await this.getDockerComposeFileData('docker-compose.nostream.yml')
        return composeFile.replaceAll('{{tag}}', tag).replaceAll('{{port}}', port.toString())
    }

}

export default new DockerService()