import DockerService from "~/services/DockerService"

export default defineEventHandler(async (event) => {
    const body: { containerIds: string[] } = await readBody(event)

    await DockerService.removeContainers(body.containerIds)

    return {
        status: 'ok',
    }
})
