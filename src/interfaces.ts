export interface LogInfo {
    sender: string;
    message: string;
}

export interface LogErrorInfo {
    sender: string;
    message: string;
    stack?: string;
}


export interface MemoryInfo {
    total: number;
    available: number;
    percent: number;
}

export interface BatteryInfo {
    battery: boolean;
    percent: number;
    secsleft: number;
    power_plugged: number;
}


export interface SystemInfo {
    version: string;
    memory: MemoryInfo;
    uptime: string;
    battery: BatteryInfo;
}