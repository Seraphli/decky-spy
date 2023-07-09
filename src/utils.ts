import { ProcsInfo } from './interfaces';

export const OOMWarningTemplate = {
	title: 'Out of memory',
	body: 'OOM! Save! TOP: {#1}[{#2}].',
};

export function formatOOMWarning(procs: ProcsInfo) {
	const OOMWarning = { ...OOMWarningTemplate };
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
