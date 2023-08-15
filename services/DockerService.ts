import { DockerStatus, RelayType } from '~/enums';
import Dockerode from 'dockerode';
// @ts-ignore
import DockerodeCompose from 'dockerode-compose';
import fs from 'node:fs/promises';

class DockerService {

    initialized: boolean = false;
    docker: Dockerode | undefined;

    constructor() {
        console.log('docker service init')
        this.intialize();
    }

    private async intialize() {
        // try to detect the socket path in the default locations on linux/mac
        const socketPaths = [
            `${process.env.HOME}/.docker/run/docker.sock`,
            `${process.env.HOME}/.docker/desktop/docker.sock`,
            '/var/run/docker.sock',
        ];
        for (const socketPath of socketPaths) {
            if (await fs.stat(socketPath)) {
                console.log('docker socket detected:', socketPath);
                this.docker = new Dockerode({ socketPath });
                this.initialized = true;
                break;
            }
        }
    }

    public async getStatus(containerIds: string[]): Promise<DockerStatus> {
        if (!this.docker) {
            throw new Error('Docker not initialized');
        }

        let allStatus = []
        for (const containerId of containerIds) {
            const container = this.docker.getContainer(containerId)
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
            const container = this.docker.getContainer(containerId)
            await container.start().catch(() => console.log('Relay already started'))
        }
    }

    public async removeContainers(containerIds: string[]): Promise<void> {
        if (!this.docker) {
            throw new Error('Docker not initialized');
        }

        console.log("removing containers", containerIds.join(", "))

        for (const containerId of containerIds) {
            const container = this.docker.getContainer(containerId)
            await container.remove()
        }
    }

    public async stopContainers(containerIds: string[]): Promise<void> {
        if (!this.docker) {
            throw new Error('Docker not initialized');
        }

        for (const containerId of containerIds) {
            const container = this.docker.getContainer(containerId)
            await container.stop().catch(() => console.log('Relay already stopped'))
        }
    }

    public async launch(port: number, relayType: RelayType, tag: string): Promise<string[]> {
        if (!this.docker) {
            throw new Error('Docker not initialized');
        }

        let composeFileName = ''
        let composeFileData = ''
        switch (relayType) {
            case RelayType.NostrRsRelay:
                composeFileName = `docker-compose.nostr-rs-relay.yml`
                const composeFile = await fs.readFile(`./docker/${composeFileName}`, 'utf8')
                composeFileData = composeFile.replaceAll('{{tag}}', tag).replaceAll('{{port}}', port.toString())
                break;
            default:
                throw new Error('Unknown relay type')
        }

        await fs.writeFile('./docker/docker-compose.yml', composeFileData)
        const compose = new DockerodeCompose(this.docker, './docker/docker-compose.yml', 'forge')
        const state = await compose.up()

        return state.services.map((s: { id: string }) => s.id)

        // let imageName = ''
        // let options: Dockerode.ContainerCreateOptions = { Tty: true }
        // switch (relayType) {
        //     case RelayType.NostrRsRelay:
        //         imageName = `dolu89/forge-nostr-rs-relay:${tag}`
        //         options = {
        //             ...options,
        //             name: `forge-nostr-rs-relay-${port}`,
        //             ExposedPorts: {
        //                 "8080/tcp": {}
        //             },
        //             HostConfig: {
        //                 PortBindings: {
        //                     "8080/tcp": [
        //                         {
        //                             "HostPort": port.toString()
        //                         }
        //                     ]
        //                 }
        //             }
        //         }
        //         break;
        //     default:
        //         throw new Error('Unknown relay type')
        // }

        // console.log('pulling image...')
        // await this.docker.pull(imageName, {})
        // // Hack. After pulling an image, we need to wait a bit before creating the container
        // await new Promise(resolve => setTimeout(resolve, 1000));

        // Works, but doesn't release the terminal
        // const container = await this.docker.run(imageName, [], process.stdout, options)
        // return container.id

        // const container = await this.docker.createContainer({
        //     Image: imageName,
        //     name: "nostr-rs-relay",
        //     ExposedPorts: {
        //         "8080/tcp": {}
        //     },
        //     HostConfig: {
        //         PortBindings: {
        //             "8080/tcp": [
        //                 {
        //                     "HostPort": "8080"
        //                 }
        //             ]
        //         }
        //     }
        // })
        // const container = await this.docker.createContainer({
        //     Image: imageName,
        //     ...options
        // })

        // container.start({}, (err, stream) => {
        //     if (err) return;
        //     container.modem.demuxStream(stream, process.stdout, process.stderr);
        // })
        // const stream = await exec.start({ Detach: true })
        // container.modem.demuxStream(stream, process.stdout, process.stderr);
        // container.exec(options, function (err, exec) {
        //     console.log('exec', err, exec)
        //     if (err) return;
        //     exec?.start({}, (err, stream) => {
        //         console.log('start', err, stream)
        //         if (err) return;

        //         console.log('stream', stream)
        //         container.modem.demuxStream(stream, process.stdout, process.stderr);

        //         // exec.inspect(function (err, data) {
        //         //     if (err) return;
        //         //     console.log(data);
        //         // });
        //     });
        // });
        // return container.id
    }
}

export default new DockerService();