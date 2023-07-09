import { ServerAPI } from 'decky-frontend-lib';
import {
	LogInfo,
	LogErrorInfo,
	SystemInfo,
	MemoryInfo,
	BatteryInfo,
	ProcsInfo,
	Settings,
} from './interfaces';

export class Backend {
	private serverAPI: ServerAPI;

	public systemInfo: SystemInfo = {
		version: '0.0.0',
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
		uptime: '0:0:0',
		battery: {
			battery: false,
			percent: 0,
			secsleft: 0,
			plugged: true,
		},
	};
	public settings: Settings = {
		debug: {
			frontend: false,
			backend: false,
		},
	};

	constructor(serverAPI: ServerAPI) {
		this.serverAPI = serverAPI;
	}

	async getVersion() {
		const result = await this.bridge('get_version');
		if (result) {
			this.systemInfo.version = result as string;
		}
	}

	async getMemory() {
		const result = await this.bridge('get_memory');
		if (result) {
			this.systemInfo.memory = JSON.parse(result) as MemoryInfo;
		}
	}

	async getTopKMemProcs() {
		const result = await this.bridge('get_top_k_mem_procs', { k: 1 });
		if (result) {
			this.systemInfo.topKMemProcs = JSON.parse(result) as ProcsInfo[];
		}
	}

	async getUptime() {
		const result = await this.bridge('get_uptime');
		if (result) {
			this.systemInfo.uptime = result as string;
		}
	}

	async getBattery() {
		const result = await this.bridge('get_battery');
		if (result) {
			this.systemInfo.battery = JSON.parse(result) as BatteryInfo;
		}
	}

	async refreshStatus() {
		await this.getVersion();
		await this.getMemory();
		await this.getUptime();
		await this.getBattery();
		await this.getTopKMemProcs();
	}

	getServerAPI() {
		return this.serverAPI;
	}

	static convertBytesToHumanReadable(bytes: number) {
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
		if (bytes == 0) {
			return '0 Byte';
		}
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
	}

	async log(info: LogInfo) {
		await this.serverAPI.callPluginMethod<{ message: string }, any>('log', {
			message: `[${info.sender}] ${info.message}`,
		});
	}

	async logError(info: LogErrorInfo) {
		let msg = `[${info.sender}] ${info.message}`;
		if (info.stack) {
			msg += ` --> ${info.stack}`;
		}
		await this.serverAPI.callPluginMethod<{ message: string }, any>(
			'log_err',
			{
				message: msg,
			},
		);
	}

	async getSettings(key: string, defaultValue: any) {
		const result = await this.bridge('get_settings', {
			key,
			default: defaultValue,
		});
		if (result) {
			return JSON.parse(result);
		}
	}

	async setSettings(key: string, value: any) {
		await this.bridge('set_settings', { key, value });
	}

	async commitSettings() {
		await this.bridge('commit_settings');
	}

	async loadSettings() {
		this.settings.debug.frontend = await this.getSettings(
			'debug.frontend',
			false,
		);
		this.settings.debug.backend = await this.getSettings(
			'debug.backend',
			false,
		);
	}

	async saveSettings() {
		await this.setSettings('debug.frontend', this.settings.debug.frontend);
		await this.setSettings('debug.backend', this.settings.debug.backend);
		await this.commitSettings();
	}

	async bridge(functionName: string, namedArgs?: any) {
		namedArgs = namedArgs ? namedArgs : {};
		const ret = await this.serverAPI.callPluginMethod<any, string>(
			functionName,
			namedArgs,
		);
		await this.log({
			sender: 'bridge',
			message: `${functionName} return ${JSON.stringify(ret)}`,
		});
		if (ret.success) {
			if (ret.result == null) {
				return null;
			}
			const payload = JSON.parse(ret.result);
			if (payload.code == 0) {
				return payload.data;
			}
			const errMessage = `Calling backend function return fail: ${ret.result}`;
			await this.logError({ sender: 'bridge', message: errMessage });
		}
		const errMessage = `Calling backend function fail: ${ret.result}`;
		await this.logError({ sender: 'bridge', message: errMessage });
		return null;
	}
}
