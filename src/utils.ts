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
	title: 'Low Battery [{#0}%]',
	body: 'Time left: {#1}.',
};

export function formatBatteryWarning(systemInfo: SystemInfo) {
	const batteryWarning = { ...BatteryWarningTemplate };
	batteryWarning.title = batteryWarning.title.replace(
		'{#0}',
		systemInfo.battery.percent.toFixed(1).toString(),
	);
	batteryWarning.body = batteryWarning.body.replace(
		'{#1}',
		convertSecondsToHumanReadable(systemInfo.battery.secsleft),
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
	return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
}

export function convertSecondsToHumanReadable(seconds: number) {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = Math.floor((seconds % 3600) % 60);
	// Display two decimal, padding with 0
	return `${hours}:${minutes.toString().padStart(2, '0')}:${secs
		.toString()
		.padStart(2, '0')}`;
}
