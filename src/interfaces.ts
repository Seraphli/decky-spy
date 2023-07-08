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

export interface ProcsMemInfo {
    rss: number;
    vms: number;
}

export interface ProcsInfo {
    pid: number;
    name: string;
    mem: ProcsMemInfo;
}

export interface SystemInfo {
    version: string;
    memory: MemoryInfo;
    topKMemProcs: ProcsInfo[];
    uptime: string;
    battery: BatteryInfo;
}