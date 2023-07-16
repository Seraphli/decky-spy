export interface LogInfo {
	sender: string;
	message: string;
}

export interface LogErrorInfo {
	sender: string;
	message: string;
	stack?: string;
}

export interface _MemoryInfo {
	used: number;
	total: number;
	percent: number;
}

export interface MemoryInfo {
	vmem: _MemoryInfo;
	swap: _MemoryInfo;
}

export interface BatteryInfo {
	battery: boolean;
	percent: number;
	secsleft: number;
	plugged: boolean;
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

export interface AddressInfo {
	family: string;
	address: string;
	netmask: string;
	broadcast: string;
	p2p: string;
}

export interface NetInterfaceInfo {
	name: string;
	addresses: AddressInfo[];
}

export interface SystemInfo {
	version: string;
	memory: MemoryInfo;
	topKMemProcs: ProcsInfo[];
	uptime: number;
	battery: BatteryInfo;
	nis: NetInterfaceInfo[];
}

export interface Settings {
	procs_k: number;
	oom: {
		enabled: boolean;
		threshold: number;
		plusSwap: boolean;
		logDetails: boolean;
		cooldown: number;
	};
	battery: {
		enabled: boolean;
		threshold: number;
		step: number;
	};
	network: {
		enabled: boolean;
	};
	toaster: {
		duration: number;
		sound: number;
		playSound: boolean;
	};
	debug: {
		frontend: boolean;
		backend: boolean;
	};
}
