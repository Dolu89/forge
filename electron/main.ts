import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import Docker from '../services/DockerService'
import { RelayType } from 'enums'


// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js
// │ ├─┬ preload
// │ │ └── index.js
// │ ├─┬ renderer
// │ │ └── index.html

process.env.ROOT = path.join(__dirname, '..')
process.env.DIST = path.join(process.env.ROOT, 'dist-electron')
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? path.join(process.env.ROOT, 'public')
  : path.join(process.env.ROOT, '.output/public')
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow
const preload = path.join(process.env.DIST, 'preload.js')

function bootstrap() {
  win = new BrowserWindow({
    height: 800,
    width: 1200,
    webPreferences: {
      preload,
      nodeIntegrationInWorker: true,
      contextIsolation: true,
      nodeIntegration: true,
      webSecurity: false,
    },
  })

  const streamLogs = new Map<string, { close: () => void }>()
  function stopStreamLogsIfExists(key: string) {
    if (streamLogs.has(key)) {
      streamLogs.get(key)?.close()
      streamLogs.delete(key)
    }
  }

  ipcMain.handle('docker:dockerStatus', async (_) => {
    return Docker.getDockerStatus()
  })
  ipcMain.handle('docker:status', async (_, containerIds: string[]) => {
    return Docker.getStatus(containerIds)
  })
  ipcMain.handle('docker:container', async (_, containerId: string) => {
    return Docker.getContainer(containerId)
  })
  ipcMain.handle('docker:create', async (_, port: number, relayType: RelayType, tag: string) => {
    return Docker.create(port, relayType, tag)
  })
  ipcMain.handle('docker:remove', async (_, containerIds: string[]) => {
    return Docker.removeContainers(containerIds)
  })
  ipcMain.handle('docker:start', async (_, containerIds: string[]) => {
    return Docker.startContainers(containerIds)
  })
  ipcMain.handle('docker:stop', async (_, containerIds: string[]) => {
    return Docker.stopContainers(containerIds)
  })
  ipcMain.handle('docker:stopStreamLogs', (_, key: string) => {
    stopStreamLogsIfExists(key)
  })
  ipcMain.on('docker:streamLogs', (event, data: { key: string, containerIds: string[] }) => {
    const [replyPort] = event.ports
    stopStreamLogsIfExists(data.key)
    const close = Docker.streamLogs(data.containerIds, (data) => {
      replyPort.postMessage(data)
    })
    streamLogs.set(data.key, { close })
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(process.env.VITE_PUBLIC!, 'index.html'))
  }
}

app.whenReady().then(bootstrap)