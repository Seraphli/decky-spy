import { ServerAPI, ToastData } from 'decky-frontend-lib';
import {
	LogInfo,
	LogErrorInfo,
	SystemInfo,
	MemoryInfo,
	BatteryInfo,
	ProcsInfo,
	Settings,
} from './interfaces';
import { formatOOMWarning } from './utils';

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
		procs_k: 1,
		oom: {
			enabled: true,
			threshold: 99.5,
			plusSwap: true,
			duration: 5,
			sound: 6,
			playSound: true,
			cooldown: 600,
			logDetails: true,
		},
		debug: {
			frontend: true,
			backend: true,
		},
	};
	public oomWarnCooldown = true;

	constructor(serverAPI: ServerAPI) {
		this.serverAPI = serverAPI;
		this.loadSettings();
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
		const result = await this.bridge('get_top_k_mem_procs', {
			k: this.settings.procs_k,
		});
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

	oomWarning() {
		const warning = formatOOMWarning(this.systemInfo.topKMemProcs[0]);
		let toastData: ToastData = {
			title: warning.title,
			body: warning.body,
			duration: this.settings.oom.duration * 1000,
			sound: this.settings.oom.sound,
			playSound: this.settings.oom.playSound,
			showToast: true,
		};
		this.serverAPI.toaster.toast(toastData);
		return warning;
	}

	async detectOOM() {
		// Detect OOM and log details if enabled
		if (this.settings.oom.enabled) {
			const mem = this.systemInfo.memory;
			const totalMem = this.settings.oom.plusSwap
				? mem.vmem.total + mem.swap.total
				: mem.vmem.total;
			const usedMem = this.settings.oom.plusSwap
				? mem.vmem.used + mem.swap.used
				: mem.vmem.used;
			const percent = usedMem / totalMem;
			if (
				this.oomWarnCooldown &&
				percent > this.settings.oom.threshold / 100
			) {
				const warning = this.oomWarning();
				this.oomWarnCooldown = false;
				setTimeout(() => {
					this.oomWarnCooldown = true;
				}, this.settings.oom.cooldown * 1000);

				// Log details if enabled
				if (this.settings.oom.logDetails) {
					await this.logError({
						sender: 'OOM',
						message: warning.body,
						stack: JSON.stringify(this.systemInfo),
					});
				}
			}
		}
	}

	async refreshStatus() {
		await this.getVersion();
		await this.getMemory();
		await this.getUptime();
		await this.getBattery();
		await this.getTopKMemProcs();

		// Detect OOM
		await this.detectOOM();
	}

	getServerAPI() {
		return this.serverAPI;
	}

	async log(info: LogInfo) {
		await this.serverAPI.callPluginMethod<{ message: string }, any>('log', {
			message: `[${info.sender}] ${info.message}`,
		});
	}

	async logError(info: LogErrorInfo) {
		let msg = `[${info.sender}] ${info.message}`;
		if (info.stack) {
			msg += `\n-->\n${info.stack}`;
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
		return JSON.parse(result);
	}

	async setSettings(key: string, value: any) {
		await this.bridge('set_settings', { key, value });
	}

	async commitSettings() {
		await this.bridge('commit_settings');
	}

	async loadSettings() {
		this.settings.procs_k = await this.getSettings('procs_k', 1);
		this.settings.oom.enabled = await this.getSettings('oom.enabled', true);
		this.settings.oom.threshold = await this.getSettings(
			'oom.threshold',
			99.5,
		);
		this.settings.oom.plusSwap = await this.getSettings(
			'oom.plusSwap',
			true,
		);
		this.settings.oom.duration = await this.getSettings('oom.duration', 5);
		this.settings.oom.sound = await this.getSettings('oom.sound', 6);
		this.settings.oom.playSound = await this.getSettings(
			'oom.playSound',
			true,
		);
		this.settings.oom.cooldown = await this.getSettings(
			'oom.cooldown',
			600,
		);
		this.settings.oom.logDetails = await this.getSettings(
			'oom.logDetails',
			true,
		);
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
		await this.setSettings('procs_k', this.settings.procs_k);
		await this.setSettings('oom.enabled', this.settings.oom.enabled);
		await this.setSettings('oom.threshold', this.settings.oom.threshold);
		await this.setSettings('oom.plusSwap', this.settings.oom.plusSwap);
		await this.setSettings('oom.duration', this.settings.oom.duration);
		await this.setSettings('oom.sound', this.settings.oom.sound);
		await this.setSettings('oom.playSound', this.settings.oom.playSound);
		await this.setSettings('oom.cooldown', this.settings.oom.cooldown);
		await this.setSettings('oom.logDetails', this.settings.oom.logDetails);
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
			const errMessage = `${functionName} return fail: ${ret}`;
			await this.logError({ sender: 'bridge', message: errMessage });
		}
		const errMessage = `${functionName} fail: ${ret}`;
		await this.logError({ sender: 'bridge', message: errMessage });
		return null;
	}

	onDismount() {}
}
