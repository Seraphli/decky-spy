import {
	ButtonItem,
	definePlugin,
	PanelSection,
	PanelSectionRow,
	ServerAPI,
	staticClasses,
	ToggleField,
	SliderField,
	Field,
} from 'decky-frontend-lib';
import { VFC } from 'react';
import { useState, useEffect } from 'react';
import { FaWatchmanMonitoring } from 'react-icons/fa';
import { Backend } from './backend';
import { BatteryInfo, MemoryInfo, ProcsInfo } from './interfaces';
import { convertBytesToHumanReadable } from './utils';

let pollTimerRef: NodeJS.Timeout | undefined;
let backendPollTimerRef: NodeJS.Timeout | undefined;

const Content: VFC<{ backend: Backend }> = ({ backend }) => {
	const [memory, setMemory] = useState<MemoryInfo | undefined>();
	const [uptime, setUptime] = useState<string | undefined>();
	const [battery, setBattery] = useState<BatteryInfo | undefined>();
	const [procs, setProcs] = useState<ProcsInfo[] | undefined>();

	const refreshStatus = async () => {
		setMemory(backend.systemInfo.memory);
		setUptime(backend.systemInfo.uptime);
		setBattery(backend.systemInfo.battery);
		setProcs(backend.systemInfo.topKMemProcs);
	};
	useEffect(() => {
		pollTimerRef = setInterval(async () => {
			await refreshStatus();
		}, 200);

		return () => {
			if (pollTimerRef) {
				clearInterval(pollTimerRef);
			}
		};
	}, []);

	return (
		<div>
			<PanelSection title="System Info">
				<PanelSectionRow>
					<Field
						focusable={true}
						childrenLayout="below"
						childrenContainerWidth="max"
					>
						Uptime: {uptime}
						<br />
						Mem:{' '}
						{memory &&
							`${convertBytesToHumanReadable(
								memory.vmem.used,
							)}/${convertBytesToHumanReadable(
								memory.vmem.total,
							)}(${memory.vmem.percent}%)`}
						<br />
						Swap:{' '}
						{memory &&
							`${convertBytesToHumanReadable(
								memory.swap.used,
							)}/${convertBytesToHumanReadable(
								memory.swap.total,
							)}(${memory.swap.percent}%)`}
						<br />
						Battery: {battery && `${battery.percent.toFixed(2)}%`}
					</Field>
				</PanelSectionRow>
			</PanelSection>
			<PanelSection title="Process Info">
				{procs?.map((proc, index) => (
					<PanelSectionRow key={index}>
						<Field
							label={`[ ${index + 1} ]`}
							focusable={true}
							childrenLayout="inline"
							childrenContainerWidth="max"
						>
							PID: {proc.pid}
							<br />
							Name: {proc.name}
							<br />
							Mem: {convertBytesToHumanReadable(proc.mem.rss)}
						</Field>
					</PanelSectionRow>
				))}
			</PanelSection>
			<PanelSection title="Configuration">
				<PanelSectionRow>
					<SliderField
						label="Num of Process"
						description="How many processes displayed"
						value={backend.settings.procs_k}
						min={1}
						max={5}
						step={1}
						showValue={true}
						onChange={(value) => {
							backend.settings.procs_k = value;
							backend.saveSettings();
						}}
					/>
				</PanelSectionRow>
				<PanelSectionRow>
					<ToggleField
						label="OOM Warning"
						description="Enable OutOfMemory warning"
						checked={backend.settings.oom.enabled}
						onChange={(value) => {
							backend.settings.oom.enabled = value;
							backend.saveSettings();
						}}
					/>
					<SliderField
						label="Threshold"
						description="OOM threshold"
						value={backend.settings.oom.threshold}
						min={50}
						max={100}
						step={0.2}
						showValue={true}
						onChange={(value) => {
							backend.settings.oom.threshold = value;
							backend.saveSettings();
						}}
					/>
					<ToggleField
						label="Plus Swap"
						description="Include swap"
						checked={backend.settings.oom.plusSwap}
						onChange={(value) => {
							backend.settings.oom.plusSwap = value;
							backend.saveSettings();
						}}
					/>
					<SliderField
						label="Duration"
						description="Duration of warning toaster"
						value={backend.settings.oom.duration}
						min={3}
						max={10}
						step={1}
						showValue={true}
						onChange={(value) => {
							backend.settings.oom.duration = value;
							backend.saveSettings();
						}}
					/>
					<SliderField
						label="Sound"
						description="Sound of toaster"
						value={backend.settings.oom.sound}
						min={0}
						max={20}
						step={1}
						showValue={true}
						onChange={(value) => {
							backend.settings.oom.sound = value;
							backend.saveSettings();
						}}
					/>
					<ToggleField
						label="Play Sound"
						description="Play sound of toaster"
						checked={backend.settings.oom.playSound}
						onChange={(value) => {
							backend.settings.oom.playSound = value;
							backend.saveSettings();
						}}
					/>
					<SliderField
						label="Cooldown"
						description="Cooldown of warning"
						value={backend.settings.oom.cooldown}
						min={30}
						max={600}
						step={10}
						showValue={true}
						onChange={(value) => {
							backend.settings.oom.cooldown = value;
							backend.saveSettings();
						}}
					/>
					<ToggleField
						label="Log Details"
						description="Log details of OOM"
						checked={backend.settings.oom.logDetails}
						onChange={(value) => {
							backend.settings.oom.logDetails = value;
							backend.saveSettings();
						}}
					/>
					<ButtonItem
						description="Make a false alarm"
						layout="below"
						onClick={() => {
							backend.oomWarning();
						}}
					>
						Test Warning
					</ButtonItem>
				</PanelSectionRow>
			</PanelSection>
			<PanelSection title="Debug Info">
				<PanelSectionRow>
					<Field label="Version" focusable={true}>
						{backend.systemInfo.version}
					</Field>
				</PanelSectionRow>
				<PanelSectionRow>
					<ToggleField
						label="Frontend"
						description="Enable Frontend debug"
						checked={backend.settings.debug.frontend}
						onChange={(value) => {
							backend.settings.debug.frontend = value;
							backend.saveSettings();
						}}
					/>
				</PanelSectionRow>
				<PanelSectionRow>
					<ToggleField
						label="Backend"
						description="Enable Backend debug"
						checked={backend.settings.debug.backend}
						onChange={(value) => {
							backend.settings.debug.backend = value;
							backend.saveSettings();
						}}
					/>
				</PanelSectionRow>
			</PanelSection>
		</div>
	);
};

export default definePlugin((serverAPI: ServerAPI) => {
	const backend = new Backend(serverAPI);
	backend.log({ sender: 'loader', message: 'Plugin Loaded' });

	if (backendPollTimerRef) {
		clearInterval(backendPollTimerRef);
	}
	backendPollTimerRef = setInterval(async () => {
		await backend.refreshStatus();
	}, 1000);

	return {
		title: <div className={staticClasses.Title}>Decky Spy</div>,
		content: <Content backend={backend} />,
		icon: <FaWatchmanMonitoring />,
		onDismount() {
			if (backendPollTimerRef) {
				clearInterval(backendPollTimerRef);
			}
			backend.onDismount();
		},
	};
});
