import DockerService from "~/services/DockerService"
import { RelayType } from "~/enums"

export default defineEventHandler(async (event) => {
    const body: { port: number, relayType: RelayType, tag: string } = await readBody(event)

    const containerIds = await DockerService.launch(body.port, body.relayType, body.tag)
    const status = await DockerService.getStatus(containerIds)
    console.log(status)

    return {
        status: 'ok',
        data: {
            port: body.port,
            containerIds
        }
    }
})
