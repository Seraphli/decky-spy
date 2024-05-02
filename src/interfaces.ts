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
	cpu: number;
	memory: MemoryInfo;
	topKMemProcs: ProcsInfo[];
	boottime: number;
	gameSessionStartTime: number;
	battery: BatteryInfo;
	nis: NetInterfaceInfo[];
}
export const DefaultSystemInfo: SystemInfo = {
	version: '0.0.0',
	cpu: 0,
	memory: {
		vmem: {
			used: 0,
			total: 0,
			percent: 0,
		},
		swap: {
			used: 0,
			total: 0,
			percent: 0,
		},
	},
	topKMemProcs: [],
	boottime: 0,
	gameSessionStartTime: 0,
	battery: {
		battery: false,
		percent: 0,
		secsleft: 0,
		plugged: true,
	},
	nis: [],
};

export interface Settings {
	refresh: {
		enabled: boolean;
		interval: number; // in seconds
	};
	procs_k: number;
	oom: {
		enabled: boolean;
		threshold: number;
		plusSwap: boolean;
		logDetails: boolean;
		interval: number; // in minutes
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
		duration: number; // in seconds
		sound: number;
		playSound: boolean;
	};
	anti_addict: {
		enabled: boolean;
		threshold: number; // in minutes
		interval: number; // in minutes
	};
	debug: {
		frontend: boolean;
		backend: boolean;
	};
}
export const DefaultSettings: Settings = {
	refresh: {
		enabled: true,
		interval: 5,
	},
	procs_k: 1,
	oom: {
		enabled: true,
		threshold: 99,
		plusSwap: false,
		interval: 5,
		logDetails: true,
	},
	battery: {
		enabled: true,
		threshold: 30,
		step: 5,
	},
	network: {
		enabled: true,
	},
	toaster: {
		duration: 5,
		sound: 8,
		playSound: true,
	},
	anti_addict: {
		enabled: false,
		threshold: 60,
		interval: 15,
	},
	debug: {
		frontend: true,
		backend: true,
	},
};

export interface BackendReturn {
	code: number;
	data: any;
}

// From https://github.com/popsUlfr/SDH-PauseGames.git
// SteamClient Doc https://github.com/SteamDeckHomebrew/decky-frontend-lib/pull/92

/**
 * @prop unAppID is not properly set by Steam for non-steam game shortcuts, so it defaults to 0 for them
 */
export interface AppLifetimeNotification {
	unAppID: number;
	nInstanceID: number;
	bRunning: boolean;
}

export interface Unregisterable {
	/**
	 * Unregister the callback.
	 */
	unregister(): void;
}

// only the needed subset of the SteamClient
export interface SteamClient {
	GameSessions: {
		/**
		 * Registers a callback function to be called when an app lifetime notification is received.
		 * @param {function} callback - The callback function to be called.
		 * @returns {Unregisterable | any} - An object that can be used to unregister the callback.
		 */
		RegisterForAppLifetimeNotifications(
			callback: (
				appLifetimeNotification: AppLifetimeNotification,
			) => void,
		): Unregisterable | any;
	};
	Apps: {
		/**
		 * Registers a callback function to be called when a game action starts.
		 * @param {function} callback - The callback function to be called.
		 * @returns {Unregisterable | any} - An object that can be used to unregister the callback.
		 */
		RegisterForGameActionStart(
			callback: (
				gameActionIdentifier: number,
				appId: string,
				action: string,
				param3: number,
			) => void,
		): Unregisterable | any;
		/**
		 * Registers a callback function to be called when a game action ends.
		 * @param {function} callback - The callback function to be called.
		 * @returns {Unregisterable | any} - An object that can be used to unregister the callback.
		 */
		RegisterForGameActionEnd(
			callback: (gameActionIdentifier: number) => void,
		): Unregisterable | any;
	};
	System: {
		RegisterForOnSuspendRequest: (cb: () => Promise<any> | void) => {
			unregister: () => void;
		};
		RegisterForOnResumeFromSuspend: (cb: () => Promise<any> | void) => {
			unregister: () => void;
		};
	};
}
