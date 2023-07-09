import { SystemInfo } from './interfaces';

export const OOMWarningTemplate = {
	title: 'Out of memory',
	body: 'OOM[{#0}%]! TOP: {#1}[{#2}].',
};

export function formatOOMWarning(systemInfo: SystemInfo) {
	const OOMWarning = { ...OOMWarningTemplate };
	const procs = systemInfo.topKMemProcs[0];
	OOMWarning.body = OOMWarning.body.replace(
		'{#0}',
		systemInfo.memory.vmem.percent.toString(),
	);
	OOMWarning.body = OOMWarning.body.replace('{#1}', procs.name);
	OOMWarning.body = OOMWarning.body.replace(
		'{#2}',
		convertBytesToHumanReadable(procs.mem.rss),
	);
	return OOMWarning;
}

export function convertBytesToHumanReadable(bytes: number) {
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(1024));
	return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
}
