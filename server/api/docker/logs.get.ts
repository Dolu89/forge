import * as Dockerode from "dockerode";
import { IncomingMessage, ServerResponse } from "http";
import DockerService from "~/services/DockerService"
import * as stream from "stream"
import ansiRegex from 'ansi-regex'

const isArray = function (a: any) {
    return (!!a) && (a.constructor === Array);
};

const streamLogs = function (container: Dockerode.Container, response: ServerResponse<IncomingMessage>) {
    var logStream = new stream.PassThrough();

    logStream.on('data', function (chunk: Buffer) {
        let data = chunk.toString('utf8')
        data = data.replace(ansiRegex(), '')
        response.write(`data: ${data}\n\n`)
    });

    container.attach({ stream: true, stdout: true, stderr: true }, function (err, stream) {
        if (err) return
        container.modem.demuxStream(stream, logStream, logStream);
    });
}

export default defineEventHandler(async (event) => {
    const query = getQuery(event)

    const response = event.node.res
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
    }

    response.writeHead(200, headers)

    if (isArray(query.containerIds)) {
        for (const containerId of query.containerIds as string[]) {
            const container = DockerService.getContainer(containerId)
            streamLogs(container, response)
        }
    }
    else {
        const container = DockerService.getContainer(query.containerIds as string)
        streamLogs(container, response)
    }
})
