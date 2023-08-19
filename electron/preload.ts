import { RelayDB } from '../db/db'
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
    docker: {
        getDockerStatus: async () => {
            return ipcRenderer.invoke('docker:dockerStatus')
        },
        getStatus: async (relay: RelayDB) => {
            return ipcRenderer.invoke('docker:status', relay)
        },
        start: async (relay: RelayDB) => {
            return ipcRenderer.invoke('docker:start', relay)
        },
        stop: async (relay: RelayDB) => {
            return ipcRenderer.invoke('docker:stop', relay)
        },
        remove: async (relay: RelayDB) => {
            return ipcRenderer.invoke('docker:remove', relay)
        },
        create: async (relay: RelayDB) => {
            return ipcRenderer.invoke('docker:create', relay)
        },
        streamLogs(key: string, relay: RelayDB, callback: (data: string) => void) {
            const messageChannel = new MessageChannel()
            messageChannel.port1.onmessage = (event) => {
                callback(event.data)
            }
            ipcRenderer.postMessage('docker:streamLogs', { key, relay }, [messageChannel.port2])
        },
        stopStreamLogs(key: string) {
            ipcRenderer.invoke('docker:stopStreamLogs', key)
        }
    },
})