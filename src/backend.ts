import { ServerAPI } from 'decky-frontend-lib';
import { LogInfo, LogErrorInfo, SystemInfo, MemoryInfo, BatteryInfo } from './interfaces';


export class Backend {
    private serverAPI: ServerAPI;
    private initialized: boolean = false;
    private pollTimerRef: NodeJS.Timeout | undefined;

    public systemInfo: SystemInfo = {
        version: '0.0.0',
        memory: {
            total: 0,
            available: 0,
            percent: 0,
        },
        uptime: '0:0:0',
        battery: {
            battery: false,
            percent: 0,
            secsleft: 0,
            power_plugged: 0,
        },
    };

    constructor(serverAPI: ServerAPI) {
        this.serverAPI = serverAPI;
    }

    async initialize() {
        if (this.initialized) {
            return;
        }
        const result = await this.bridge('get_version');
        if (result == null) {
            return
        }
        this.systemInfo.version = result as string;
        const getMemory = async () => {
            const result = await this.bridge('get_memory');
            if (result) {
                this.systemInfo.memory = JSON.parse(result) as MemoryInfo;
            }
        };
        const getUptime = async () => {
            const result = await this.bridge('get_uptime');
            if (result) {
                this.systemInfo.uptime = result as string;
            }
        };
        const getBattery = async () => {
            const result = await this.bridge('get_battery');
            if (result) {
                this.systemInfo.battery = JSON.parse(result) as BatteryInfo;
            }
        };
        const refreshStatus = async () => {
            await getMemory();
            await getUptime();
            await getBattery();
        };

        if (this.pollTimerRef) {
            clearInterval(this.pollTimerRef);
        }
        this.pollTimerRef = setInterval(async () => {
            await refreshStatus();
        }, 1000);

        this.initialized = true;
    }

    getServerAPI() {
        return this.serverAPI;
    }

    getInitialized() {
        return this.initialized;
    }

    async log(info: LogInfo) {
        await this.serverAPI.callPluginMethod<{ message: string }, any>('log', {
            message: `[${info.sender}] ${info.message}`,
        });
    }

    async logError(info: LogErrorInfo) {
        await this.serverAPI.callPluginMethod<{ message: string }, any>('log', {
            message: `[${info.sender}] ${info.message} --> ${info.stack}`,
        });
    }

    async bridge(functionName: string, namedArgs?: any) {
        namedArgs = namedArgs ? namedArgs : {};
        const ret = await this.serverAPI.callPluginMethod<any, string>(functionName, namedArgs);
        await this.log({ sender: "bridge", message: `${functionName} return ${JSON.stringify(ret)}` });
        if (ret.success) {
            if (ret.result == null) {
                return null;
            }
            const payload = JSON.parse(ret.result);
            if (payload.code == 0) {
                return payload.data;
            }
            const errMessage = `Calling backend function return fail: ${ret.result}`;
            await this.log({ sender: "bridge", message: errMessage });
        }
        const errMessage = `Calling backend function fail: ${ret.result}`;
        await this.log({ sender: "bridge", message: errMessage });
        return null;
    }

    async onDismount() {
        if (this.pollTimerRef) {
            clearInterval(this.pollTimerRef);
        }
        await this.log({ sender: "onDismount", message: '' });
    }
}
