export default defineNuxtPlugin(() => {

  const getDockerStatus = async () => {
    return window.api.docker.getDockerStatus()
  }

  const getStatus = async (containerIds: string[]) => {
    return window.api.docker.getStatus(containerIds)
  }

  const getContainer = async (containerId: string) => {
    return window.api.docker.getContainer(containerId)
  }

  const start = async (containerIds: string[]) => {
    return window.api.docker.start(containerIds)
  }

  const stop = async (containerIds: string[]) => {
    return window.api.docker.stop(containerIds)
  }

  const remove = async (containerIds: string[]) => {
    return window.api.docker.remove(containerIds)
  }

  const create = async (port: number, relayType: string, tag: string) => {
    return window.api.docker.create(port, relayType, tag)
  }

  const streamLogs = (key: string, containerIds: string[], callback: (data: string) => void) => {
    window.api.docker.streamLogs(key, containerIds, (data: string) => {
      callback(data)
    })
  }

  const stopStreamLogs = (key: string) => {
    window.api.docker.stopStreamLogs(key)
  }

  return {
    provide: {
      docker: {
        getDockerStatus,
        getStatus,
        getContainer,
        start,
        stop,
        remove,
        create,
        streamLogs,
        stopStreamLogs,
      },
    },
  }
})
