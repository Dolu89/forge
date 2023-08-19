import { RelayDB } from "~/db/db"

export default defineNuxtPlugin(() => {

  const getDockerStatus = async () => {
    return window.api.docker.getDockerStatus()
  }

  const getStatus = async (relay: RelayDB) => {
    return window.api.docker.getStatus(relay.port)
  }

  const start = async (relay: RelayDB) => {
    return window.api.docker.start(relay.port)
  }

  const stop = async (relay: RelayDB) => {
    return window.api.docker.stop(relay)
  }

  const create = async (relay: RelayDB) => {
    return window.api.docker.create(relay)
  }

  const streamLogs = (key: string, relay: RelayDB, callback: (data: string) => void) => {
    window.api.docker.streamLogs(key, relay, (data: string) => {
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
        start,
        stop,
        create,
        streamLogs,
        stopStreamLogs,
      },
    },
  }
})
