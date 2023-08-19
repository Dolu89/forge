
// CommonJS only. ES Modules not supported for Dockerode when called from Electron main process. But works fine as type
const Docker = require('dockerode');
import type Dockerode from 'dockerode';
const DockerodeCompose = require('dockerode-compose');

import fs from 'node:fs/promises';
import { DockerStatus, RelayType } from '../enums';
import stream from "stream"
import ansiRegex from 'ansi-regex'
import { isProd } from "../utils"
import { app } from "electron"
import { isLinux, isMac } from '../utils/system';
import { homedir } from 'os';
import { DockerCreated } from '../interfaces';
import YAML from 'yaml'
import { RelayDB } from '~/db/db';

class DockerService {

    private docker: Dockerode | undefined
    private baseDir: string;

    constructor() {
        console.log('docker service init')
        this.baseDir = `${homedir()}/.forge`
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

    public async getStatus(relay: RelayDB): Promise<DockerStatus> {
        if (!this.docker) {
            throw new Error('Docker not initialized');
        }

        const compose = await this._getCompose(relay)
        const containers = await this._getContainers(compose.projectName)
        if (containers.length === 0) return DockerStatus.Stopped

        let allStatus = []
        for (const container of containers) {
            allStatus.push(container.State === 'running')
        }

        if (allStatus.every(s => s)) {
            return DockerStatus.Running
        }
        if (allStatus.some(s => s)) {
            return DockerStatus.Partial
        }
        return DockerStatus.Stopped
    }

    public async startContainers(relay: RelayDB): Promise<void> {
        if (!this.docker) {
            throw new Error('Docker not initialized');
        }

        const compose = await this._getCompose(relay)
        await compose.up()
    }

    public async stopContainers(relay: RelayDB): Promise<void> {
        if (!this.docker) {
            throw new Error('Docker not initialized');
        }

        const compose = await this._getCompose(relay)
        await compose.down()
    }



    public async remove(relay: RelayDB): Promise<void> {
        if (!this.docker) {
            throw new Error('Docker not initialized');
        }

        await fs.rm(this._getRelayPath(relay.port), { recursive: true })
    }

    public async streamLogs(relay: RelayDB, callback: (data: string) => void): Promise<() => void> {
        if (!this.docker) {
            throw new Error('Docker not initialized');
        }

        const compose = await this._getCompose(relay)
        const containers = await this._getContainers(compose.projectName)

        const streams: stream.PassThrough[] = []
        for (const container of containers) {
            const dockerContainer = this.docker.getContainer(container.Id)
            var logStream = new stream.PassThrough();
            streams.push(logStream)

            logStream.on('data', function (chunk: Buffer) {
                let data = chunk.toString('utf8')
                data = data.replace(ansiRegex(), '')
                callback(data)
            });

            dockerContainer.logs({ follow: true, stdout: true, stderr: true, tail: 100 }, function (err: unknown, stream: NodeJS.ReadableStream | undefined) {
                if (err) return
                dockerContainer.modem.demuxStream(stream, logStream, logStream);
            });
        }

        function close() {
            for (const stream of streams) {
                stream.destroy()
            }
        }

        return close
    }

    public async create(relay: RelayDB): Promise<DockerCreated> {
        if (!this.docker) {
            throw new Error('Docker not initialized');
        }

        const relayFolder = this._getRelayPath(relay.port)
        await fs.mkdir(relayFolder, { recursive: true });

        let composeFileData = ''
        switch (relay.relayType) {
            case RelayType.NostrRsRelay:
                composeFileData = await this._prepareNostrRsRelay(relayFolder, relay.relayTag, relay.port)
                break;
            case RelayType.Nostream:
                composeFileData = await this._prepareNostream(relay.relayTag, relay.port)
                break;
            default:
                throw new Error('Unknown relay type')
        }

        const composeFilePath = `${relayFolder}/docker-compose.yml`
        await fs.writeFile(composeFilePath, composeFileData)

        return {
            port: relay.port,
            path: relayFolder
        }
    }

    // TODO: Add string type for dockerode-compose
    private async _getCompose(relay: RelayDB) {
        const rootPath = `${this._getRelayPath(relay.port)}`
        const composeName = await this._getComposeName(rootPath)
        return new DockerodeCompose(this.docker, `${rootPath}/docker-compose.yml`, composeName)
    }

    // TODO: use custom dockerode-compose type instead of magic string
    private async _getContainers(groupName: string): Promise<Dockerode.ContainerInfo[]> {
        if (!this.docker) {
            throw new Error('Docker not initialized');
        }

        return this.docker.listContainers({
            all: true,
            filters: { label: [`com.docker.compose.project=${groupName}`] },
        });
    }

    private async _getComposeName(path: string, fileName: string = 'docker-compose.yml') {
        const content = await this._getComposeFileData(path, fileName)
        const parsed = YAML.parse(content)
        return parsed.name
    }

    private async _getComposeFileData(path: string, fileName: string = 'docker-compose.yml') {
        return fs.readFile(`${path}/${fileName}`, 'utf8')
    }

    private async _prepareNostrRsRelay(destinationFolder: string, tag: string, port: number): Promise<string> {
        const sourceFolder = `${app.getAppPath()}/docker/nostr-rs-relay`

        // Write config.toml
        const configFileName = 'config.toml'
        const configFileContent = await fs.readFile(`${sourceFolder}/${configFileName}`, 'utf8')
        await fs.writeFile(`${destinationFolder}/${configFileName}`, configFileContent)

        // Create data folder
        await fs.mkdir(`${destinationFolder}/data`, { recursive: true })

        // Copy docker-compose.yml
        const dockerGroupName = isProd ? 'forge' : 'forge-dev'
        const composeFile = await this._getComposeFileData(sourceFolder)
        return composeFile
            .replaceAll('{{name}}', `${dockerGroupName}-${port.toString()}`)
            .replaceAll('{{tag}}', tag)
            .replaceAll('{{port}}', port.toString())
    }

    private async _prepareNostream(tag: string, port: number) {
        const sourceFolder = `${app.getAppPath()}/docker/nostream`

        // Copy docker-compose.yml
        const composeFile = await this._getComposeFileData(sourceFolder)
        return composeFile.replaceAll('{{tag}}', tag).replaceAll('{{port}}', port.toString())
    }

    private _getRelayPath(port: number) {
        return this.baseDir + '/' + port.toString()
    }

}

export default new DockerService()