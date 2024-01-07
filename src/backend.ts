import { ServerAPI, ToastData, Router } from 'decky-frontend-lib';
import {
	LogInfo,
	LogErrorInfo,
	SystemInfo,
	MemoryInfo,
	BatteryInfo,
	NetInterfaceInfo,
	ProcsInfo,
	Settings,
	BackendReturn,
	DefaultSystemInfo,
	DefaultSettings,
} from './interfaces';
import {
	formatOOMWarning,
	formatBatteryWarning,
	formatAntiAddictWarning,
} from './utils';

export class Backend {
	private serverAPI: ServerAPI;

	public systemInfo: SystemInfo = DefaultSystemInfo;
	public settings: Settings = DefaultSettings;
	public refreshStep = 0;
	public oomWarnInterval = true;
	public batteryWarnStep = 0;
	public playtime: number = 0; // in seconds
	public debugInfo: string[] = [];
	private oomIntervalTimerRef: NodeJS.Timeout | null = null;
	private aaLastWarnTime: number = 0;
	private queueForSaveTime: number | null = null;
	private unregisterHandlers: (() => void)[] = [];

	constructor(serverAPI: ServerAPI) {
		this.serverAPI = serverAPI;
	}

	async setup() {
		await this.loadSettings();
		await this.saveSettings();
		await this.getVersion();
		await this.getBoottime();

		this.unregisterHandlers.push(this.setupSuspendResumeHandler());
	}

	async getVersion() {
		const result = await this.bridge('get_version');
		if (result && result !== null) {
			const data = result as string;
			if (data) this.systemInfo.version = data;
		}
	}

	async getMemory() {
		const result = await this.bridge('get_memory');
		if (result && result !== null) {
			const data = JSON.parse(result) as MemoryInfo;
			if (data) this.systemInfo.memory = data;
		}
	}

	async getTopKMemProcs() {
		const result = await this.bridge('get_top_k_mem_procs', {
			k: this.settings.procs_k,
		});
		if (result && result !== null) {
			const data = JSON.parse(result) as ProcsInfo[];
			if (data) this.systemInfo.topKMemProcs = data;
		}
	}

	async getBoottime() {
		const result = await this.bridge('get_boottime');
		if (result && result !== null) {
			const data = result as number;
			if (data) this.systemInfo.boottime = data;
		}
	}

	async getBattery() {
		const result = await this.bridge('get_battery');
		if (result && result !== null) {
			const data = JSON.parse(result) as BatteryInfo;
			if (data) this.systemInfo.battery = data;
		}
	}

	async getNIs() {
		const result = await this.bridge('get_net_interface');
		if (result && result !== null) {
			const data = JSON.parse(result) as NetInterfaceInfo[];
			if (data) this.systemInfo.nis = data;
		}
	}

	oomWarning() {
		const warning = formatOOMWarning(this.systemInfo);
		let toastData: ToastData = {
			title: warning.title,
			body: warning.body,
			duration: this.settings.toaster.duration * 1000,
			sound: this.settings.toaster.sound,
			playSound: this.settings.toaster.playSound,
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
				this.oomWarnInterval &&
				percent > this.settings.oom.threshold / 100
			) {
				const warning = this.oomWarning();
				this.oomWarnInterval = false;
				this.oomIntervalTimerRef = setTimeout(() => {
					this.oomWarnInterval = true;
				}, this.settings.oom.interval * 60000);

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

	// Detect low battery
	batteryWarning() {
		const warning = formatBatteryWarning(this.systemInfo);
		let toastData: ToastData = {
			title: warning.title,
			body: warning.body,
			duration: this.settings.toaster.duration * 1000,
			sound: this.settings.toaster.sound,
			playSound: this.settings.toaster.playSound,
			showToast: true,
		};
		this.serverAPI.toaster.toast(toastData);
		return warning;
	}

	async detectBattery() {
		if (this.settings.battery.enabled) {
			const battery = this.systemInfo.battery;
			if (!battery.battery || battery.plugged) {
				this.batteryWarnStep = 0;
				return;
			}
			if (
				battery.percent <=
				this.settings.battery.threshold -
					this.batteryWarnStep * this.settings.battery.step
			) {
				this.batteryWarnStep =
					Math.floor(
						(this.settings.battery.threshold - battery.percent) /
							this.settings.battery.step,
					) + 1;
				const warning = this.batteryWarning();
				await this.logError({
					sender: 'Battery',
					message: warning.body,
					stack: JSON.stringify(this.systemInfo),
				});
			}
		}
	}

	antiAddictWarning() {
		const warning = formatAntiAddictWarning(this.playtime);
		let toastData: ToastData = {
			title: warning.title,
			body: warning.body,
			duration: this.settings.toaster.duration * 1000,
			sound: this.settings.toaster.sound,
			playSound: this.settings.toaster.playSound,
			showToast: true,
		};
		this.serverAPI.toaster.toast(toastData);
		return warning;
	}

	async detectAntiAddict() {
		if (this.settings.anti_addict.enabled) {
			if (this.playtime >= this.settings.anti_addict.threshold * 60) {
				if (
					this.aaLastWarnTime != 0 &&
					this.playtime - this.aaLastWarnTime <
						this.settings.anti_addict.interval * 60
				) {
					return;
				}
				const warning = this.antiAddictWarning();
				this.aaLastWarnTime =
					(Math.floor(
						(this.playtime / 60 -
							this.settings.anti_addict.threshold) /
							this.settings.anti_addict.interval,
					) *
						this.settings.anti_addict.interval +
						this.settings.anti_addict.threshold) *
					60;

				await this.log({
					sender: 'AntiAddict',
					message: warning.body,
				});
			}
		}
	}

	refreshPlayTime() {
		if (Router.RunningApps.length > 0) {
			if (this.systemInfo.gameSessionStartTime == 0) {
				this.systemInfo.gameSessionStartTime = Date.now() / 1000;
				this.aaLastWarnTime = 0;
			}
			this.playtime =
				Date.now() / 1000 - this.systemInfo.gameSessionStartTime;
		}
		if (Router.RunningApps.length == 0) {
			this.systemInfo.gameSessionStartTime = 0;
			this.playtime = 0;
			this.aaLastWarnTime = 0;
		}
	}

	async refreshStatus() {
		await this.saveSettings();
		this.refreshPlayTime();
		await this.detectAntiAddict();

		if (this.settings.refresh.enabled) {
			if (this.refreshStep == 0) {
				await this.getNIs();
				await this.getBattery();
				await this.getMemory();
				await this.getTopKMemProcs();
				// Detect OOM
				await this.detectOOM();
				// Detect low battery
				await this.detectBattery();
			}
			this.refreshStep += 1;
			if (this.settings.refresh.interval <= this.refreshStep) {
				this.refreshStep = 0;
			}
		}
	}

	getServerAPI() {
		return this.serverAPI;
	}

	async log(info: LogInfo) {
		console.log(`[${info.sender}] ${info.message}`);
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
		return result;
	}

	async setSettings(key: string, value: any) {
		await this.bridge('set_settings', { key, value });
	}

	async commitSettings() {
		await this.bridge('commit_settings');
	}

	async loadSettings() {
		this.settings.refresh.enabled = await this.getSettings(
			'refresh.enabled',
			DefaultSettings.refresh.enabled,
		);
		this.settings.refresh.interval = await this.getSettings(
			'refresh.interval',
			DefaultSettings.refresh.interval,
		);

		this.settings.procs_k = await this.getSettings(
			'procs_k',
			DefaultSettings.procs_k,
		);

		this.settings.oom.enabled = await this.getSettings(
			'oom.enabled',
			DefaultSettings.oom.enabled,
		);
		this.settings.oom.threshold = await this.getSettings(
			'oom.threshold',
			DefaultSettings.oom.threshold,
		);
		this.settings.oom.plusSwap = await this.getSettings(
			'oom.plusSwap',
			DefaultSettings.oom.plusSwap,
		);
		this.settings.oom.interval = await this.getSettings(
			'oom.interval',
			DefaultSettings.oom.interval,
		);
		this.settings.oom.logDetails = await this.getSettings(
			'oom.logDetails',
			DefaultSettings.oom.logDetails,
		);

		this.settings.battery.enabled = await this.getSettings(
			'battery.enabled',
			DefaultSettings.battery.enabled,
		);
		this.settings.battery.threshold = await this.getSettings(
			'battery.threshold',
			DefaultSettings.battery.threshold,
		);
		this.settings.battery.step = await this.getSettings(
			'battery.step',
			DefaultSettings.battery.step,
		);

		this.settings.network.enabled = await this.getSettings(
			'network.enabled',
			DefaultSettings.network.enabled,
		);

		this.settings.toaster.duration = await this.getSettings(
			'toaster.duration',
			DefaultSettings.toaster.duration,
		);
		this.settings.toaster.sound = await this.getSettings(
			'toaster.sound',
			DefaultSettings.toaster.sound,
		);
		this.settings.toaster.playSound = await this.getSettings(
			'toaster.playSound',
			DefaultSettings.toaster.playSound,
		);

		this.settings.anti_addict.enabled = await this.getSettings(
			'anti_addict.enabled',
			DefaultSettings.anti_addict.enabled,
		);
		this.settings.anti_addict.threshold = await this.getSettings(
			'anti_addict.threshold',
			DefaultSettings.anti_addict.threshold,
		);
		this.settings.anti_addict.interval = await this.getSettings(
			'anti_addict.interval',
			DefaultSettings.anti_addict.interval,
		);

		this.settings.debug.frontend = await this.getSettings(
			'debug.frontend',
			DefaultSettings.debug.frontend,
		);
		this.settings.debug.backend = await this.getSettings(
			'debug.backend',
			DefaultSettings.debug.backend,
		);
	}

	async _saveSettings() {
		await this.setSettings(
			'refresh.enabled',
			this.settings.refresh.enabled,
		);
		await this.setSettings(
			'refresh.interval',
			this.settings.refresh.interval,
		);

		await this.setSettings('procs_k', this.settings.procs_k);

		await this.setSettings('oom.enabled', this.settings.oom.enabled);
		await this.setSettings('oom.threshold', this.settings.oom.threshold);
		await this.setSettings('oom.plusSwap', this.settings.oom.plusSwap);
		await this.setSettings('oom.interval', this.settings.oom.interval);
		await this.setSettings('oom.logDetails', this.settings.oom.logDetails);

		await this.setSettings(
			'battery.enabled',
			this.settings.battery.enabled,
		);
		await this.setSettings(
			'battery.threshold',
			this.settings.battery.threshold,
		);
		await this.setSettings('battery.step', this.settings.battery.step);

		await this.setSettings(
			'network.enabled',
			this.settings.network.enabled,
		);

		await this.setSettings(
			'toaster.duration',
			this.settings.toaster.duration,
		);
		await this.setSettings('toaster.sound', this.settings.toaster.sound);
		await this.setSettings(
			'toaster.playSound',
			this.settings.toaster.playSound,
		);

		await this.setSettings(
			'anti_addict.enabled',
			this.settings.anti_addict.enabled,
		);
		await this.setSettings(
			'anti_addict.threshold',
			this.settings.anti_addict.threshold,
		);
		await this.setSettings(
			'anti_addict.interval',
			this.settings.anti_addict.interval,
		);

		await this.setSettings('debug.frontend', this.settings.debug.frontend);
		await this.setSettings('debug.backend', this.settings.debug.backend);
		await this.commitSettings();
	}

	async queueForSaveSettings() {
		// Record current time
		this.queueForSaveTime = Date.now();
	}

	async saveSettings() {
		// Check if queueForSaveTime is null
		if (this.queueForSaveTime == null) {
			return;
		}
		// Check if current time is after certain interval
		if (Date.now() - this.queueForSaveTime < 500) {
			return;
		}
		await this._saveSettings();
		this.queueForSaveTime = null;
	}

	async bridge(functionName: string, namedArgs?: any) {
		namedArgs = namedArgs ? namedArgs : {};
		await this.log({
			sender: 'bridge',
			message: `${functionName} call with ${JSON.stringify(namedArgs)}`,
		});
		const ret = await this.serverAPI.callPluginMethod<any, BackendReturn>(
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
			const payload = ret.result as BackendReturn;
			if (payload.code == 0) {
				return payload.data;
			}
			const errMessage = `${functionName} return fail: ${JSON.stringify(
				ret,
			)}`;
			await this.logError({ sender: 'bridge', message: errMessage });
		}
		const errMessage = `${functionName} fail: ${JSON.stringify(ret)}`;
		await this.logError({ sender: 'bridge', message: errMessage });
		return null;
	}

	setupSuspendResumeHandler() {
		const { unregister: unregisterOnResumeFromSuspend } =
			SteamClient.System.RegisterForOnResumeFromSuspend(() => {
				if (Router.RunningApps.length > 0) {
					this.systemInfo.gameSessionStartTime = Date.now() / 1000;
					this.aaLastWarnTime = 0;
				}
			});

		return () => {
			unregisterOnResumeFromSuspend();
		};
	}

	onDismount() {
		this.unregisterHandlers.forEach((unregister) => unregister());
		if (this.oomIntervalTimerRef) {
			clearInterval(this.oomIntervalTimerRef);
			this.oomWarnInterval = true;
		}
	}
}
