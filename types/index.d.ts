import { DockerStatus } from "~/enums"

export { }

declare global {
  // Import the types definitions
  interface Window {
    api: {
      docker: {
        getStatus: (containerIds: string[]) => Promise<DockerStatus>,
        getContainer: (containerId: string) => Promise<Dockerode.Container>,
        start: (containerIds: string[]) => Promise<void>,
        stop: (containerIds: string[]) => Promise<void>,
        remove: (containerIds: string[]) => Promise<void>,
        create: (port: number, relayType: string, tag: string) => Promise<{ port: number, containerIds: string[] }>,
        streamLogs: (key: string, containerIds: string[], callback: (data) => void) => void,
        stopStreamLogs: (key: string) => void,
      }
    }
  }
}