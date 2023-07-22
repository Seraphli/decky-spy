import { SystemInfo } from './interfaces';

export const OOMWarningTemplate = {
	title: 'Out of memory [{#0}%]',
	body: 'TOP: {#1}[{#2}].',
};

export function formatOOMWarning(systemInfo: SystemInfo) {
	const oomWarning = { ...OOMWarningTemplate };
	const procs = systemInfo.topKMemProcs[0];
	oomWarning.title = oomWarning.title.replace(
		'{#0}',
		systemInfo.memory.vmem.percent.toString(),
	);
	oomWarning.body = oomWarning.body.replace('{#1}', procs.name);
	oomWarning.body = oomWarning.body.replace(
		'{#2}',
		convertBytesToHumanReadable(procs.mem.rss),
	);
	return oomWarning;
}

export const BatteryWarningTemplate = {
	title: 'Battery [{#0}%]',
	body: '{#1}.',
};

export function formatBatteryWarning(systemInfo: SystemInfo) {
	const batteryWarning = { ...BatteryWarningTemplate };
	batteryWarning.title = batteryWarning.title.replace(
		'{#0}',
		systemInfo.battery.percent && !isNaN(systemInfo.battery.percent) ? systemInfo.battery.percent.toFixed(2).toString() : '0',
	);
	batteryWarning.body = batteryWarning.body.replace(
		'{#1}',
		systemInfo.battery.plugged ? "Plugged" : `Time left: ${convertSecondsToHumanReadable(systemInfo.battery.secsleft)}`,
	);
	return batteryWarning;
}

export function convertBytesToHumanReadable(bytes: number) {
	// Display two decimal places
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	if (bytes === 0) {
		return '0 B';
	}
	const i = Math.floor(Math.log(bytes) / Math.log(1024));
	const num = bytes / Math.pow(1024, i);
	if (num && !isNaN(num)) {
		return `${parseFloat(num.toFixed(2))} ${sizes[i]}`;
	}
	return '0 B';
}

export function convertSecondsToHumanReadable(seconds: number) {
	// If longer than 24 hours, display in days
	if (seconds > 86400) {
		const days = Math.floor(seconds / 86400);
		const hours = Math.floor((seconds % 86400) / 3600);
		const minutes = Math.floor(((seconds % 86400) % 3600) / 60);
		const secs = Math.floor(((seconds % 86400) % 3600) % 60);
		// Display two decimal, padding with 0
		return `${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = Math.floor((seconds % 3600) % 60);
	// Display two decimal, padding with 0
	return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
