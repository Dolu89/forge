import DockerService from "~/services/DockerService"

export default defineEventHandler(async (event) => {
    const body: { containerIds: string[] } = await readBody(event)

    const result = await DockerService.getStatus(body.containerIds)

    return result
})
