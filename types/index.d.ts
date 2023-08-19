import { DockerCreated } from "~/interfaces"
import { DockerStatus } from "~/enums"

export { }

declare global {
  // Import the types definitions
  interface Window {
    api: {
      docker: {
        getDockerStatus: () => Promise<DockerStatus>,
        getStatus: (relay: RelayDB) => Promise<DockerStatus>,
        start: (relay: RelayDB) => Promise<void>,
        stop: (relay: RelayDB) => Promise<void>,
        remove: (relay: RelayDB) => Promise<void>,
        create: (relay: RelayDB) => Promise<DockerCreated>,
        streamLogs: (key: string, relay: RelayDB, callback: (data) => void) => void,
        stopStreamLogs: (key: string) => void,
      }
    }
  }
}