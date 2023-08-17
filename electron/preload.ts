import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
    docker: {
        getDockerStatus: async () => {
            return ipcRenderer.invoke('docker:dockerStatus')
        },
        getStatus: async (containerIds: string[]) => {
            return ipcRenderer.invoke('docker:status', containerIds)
        },
        getContainer: async (containerId: string) => {
            return ipcRenderer.invoke('docker:container', containerId)
        },
        start: async (containerIds: string[]) => {
            return ipcRenderer.invoke('docker:start', containerIds)
        },
        stop: async (containerIds: string[]) => {
            return ipcRenderer.invoke('docker:stop', containerIds)
        },
        remove: async (containerIds: string[]) => {
            return ipcRenderer.invoke('docker:remove', containerIds)
        },
        create: async (port: number, relayType: string, tag: string) => {
            return ipcRenderer.invoke('docker:create', port, relayType, tag)
        },
        streamLogs(key: string, containerIds: string[], callback: (data: string) => void) {
            const messageChannel = new MessageChannel()
            messageChannel.port1.onmessage = (event) => {
                callback(event.data)
            }
            ipcRenderer.postMessage('docker:streamLogs', { key, containerIds }, [messageChannel.port2])
        },
        stopStreamLogs(key: string) {
            ipcRenderer.invoke('docker:stopStreamLogs', key)
        }
    },
})