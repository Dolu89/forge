import { Relay, db } from "~/db/db";
import { ChildProcess } from 'child_process';

export interface RelayExtended extends Relay {
    running: boolean;
}

class RelayService {

    private _childProcesses: Map<number, ChildProcess>;

    constructor() {
        this._childProcesses = new Map<number, ChildProcess>();
    }

    server_pushChildProcess(port: number, childProcess: ChildProcess) {
        this._childProcesses.set(port, childProcess);
        childProcess.on('message', (message) => {
            console.log("MESSAGE FROM RELAY", message)
        });
    }

    server_removeChildProcess(port: number) {
        this._childProcesses.delete(port);
    }

    server_getChildProcessByPort(port: number) {
        return this._childProcesses.get(port);
    }

    hasChildProcess(port: number) {
        return this._childProcesses.has(port);
    }

    async getNextPort() {
        const startPort = await SettingsService.getStartPort();
        const usedPorts = (await db.relays.toArray()).map(r => r.port);
        let firstUnusedPort = startPort;
        while (usedPorts.includes(firstUnusedPort)) {
            firstUnusedPort++;
        }
        return firstUnusedPort;
    }

}

export default new RelayService();