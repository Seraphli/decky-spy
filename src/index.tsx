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
import {
	BatteryInfo,
	MemoryInfo,
	ProcsInfo,
	NetInterfaceInfo,
} from './interfaces';
import {
	convertBytesToHumanReadable,
	convertSecondsToHumanReadable,
} from './utils';

let pollTimerRef: NodeJS.Timeout | undefined;
let backendPollTimerRef: NodeJS.Timeout | undefined;

const Content: VFC<{ backend: Backend }> = ({ backend }) => {
	const [memory, setMemory] = useState<MemoryInfo | undefined>();
	const [uptime, setUptime] = useState<number | undefined>();
	const [battery, setBattery] = useState<BatteryInfo | undefined>();
	const [procs, setProcs] = useState<ProcsInfo[] | undefined>();
	const [netInterfaces, setNetInterfaces] = useState<
		NetInterfaceInfo[] | undefined
	>();

	const refreshStatus = async () => {
		backend.systemInfo.memory && setMemory(backend.systemInfo.memory);
		backend.systemInfo.uptime && setUptime(backend.systemInfo.uptime);
		backend.systemInfo.battery && setBattery(backend.systemInfo.battery);
		backend.systemInfo.topKMemProcs &&
			setProcs(backend.systemInfo.topKMemProcs);
		backend.systemInfo.nis && setNetInterfaces(backend.systemInfo.nis);
	};
	useEffect(() => {
		pollTimerRef = setInterval(async () => {
			await refreshStatus();
		}, 500);

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
						Uptime:{' '}
						{uptime && convertSecondsToHumanReadable(uptime)}
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
			<PanelSection title="Network Info">
				{netInterfaces?.map((ni, index) => (
					<PanelSectionRow key={index}>
						<Field
							label={`[ ${ni.name} ]`}
							focusable={true}
							childrenLayout="below"
							childrenContainerWidth="max"
						>
							{ni.addresses.map((addr, index) => (
								<div
									key={index}
									style={{
										wordBreak: 'break-word',
										overflowWrap: 'break-word',
										whiteSpace: 'normal',
									}}
								>
									{addr.family}: {addr.address}
								</div>
							))}
						</Field>
					</PanelSectionRow>
				))}
			</PanelSection>
			<PanelSection title="Configuration">
				<Field
					label="Process Info"
					focusable={false}
					highlightOnFocus={false}
					childrenLayout="below"
				>
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
				</Field>
				<Field
					label="Out of Memory"
					focusable={false}
					highlightOnFocus={false}
					childrenLayout="below"
				>
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
				</Field>
				<Field
					label="Low Battery"
					focusable={false}
					highlightOnFocus={false}
					childrenLayout="below"
				>
					<ToggleField
						label="Low Battery Warning"
						description="Enable low battery warning"
						checked={backend.settings.battery.enabled}
						onChange={(value) => {
							backend.settings.battery.enabled = value;
							backend.saveSettings();
						}}
					/>
					<SliderField
						label="Threshold"
						description="Low battery threshold"
						value={backend.settings.battery.threshold}
						min={5}
						max={50}
						step={1}
						showValue={true}
						onChange={(value) => {
							backend.settings.battery.threshold = value;
							backend.saveSettings();
						}}
					/>
					<SliderField
						label="Step"
						description="Step of warning after passing threshold"
						value={backend.settings.battery.step}
						min={1}
						max={10}
						step={1}
						showValue={true}
						onChange={(value) => {
							backend.settings.battery.step = value;
							backend.saveSettings();
						}}
					/>
				</Field>
				<Field
					label="Toaster"
					focusable={false}
					highlightOnFocus={false}
					childrenLayout="below"
				>
					<SliderField
						label="Duration"
						description="Duration of warning toaster"
						value={backend.settings.toaster.duration}
						min={3}
						max={10}
						step={1}
						showValue={true}
						onChange={(value) => {
							backend.settings.toaster.duration = value;
							backend.saveSettings();
						}}
					/>
					<SliderField
						label="Sound"
						description="Sound of toaster"
						value={backend.settings.toaster.sound}
						min={0}
						max={20}
						step={1}
						showValue={true}
						onChange={(value) => {
							backend.settings.toaster.sound = value;
							backend.saveSettings();
						}}
					/>
					<ToggleField
						label="Play Sound"
						description="Play sound of toaster"
						checked={backend.settings.toaster.playSound}
						onChange={(value) => {
							backend.settings.toaster.playSound = value;
							backend.saveSettings();
						}}
					/>
					<ButtonItem
						layout="below"
						onClick={() => {
							backend.oomWarning();
						}}
					>
						Test OOM Warning
					</ButtonItem>
					<ButtonItem
						layout="below"
						onClick={() => {
							backend.batteryWarning();
						}}
					>
						Test Battery Warning
					</ButtonItem>
				</Field>
			</PanelSection>
			<PanelSection title="Debug Info">
				<Field label="Version" focusable={true}>
					{backend.systemInfo.version}
				</Field>
				<ToggleField
					label="Frontend"
					description="Enable Frontend debug"
					checked={backend.settings.debug.frontend}
					onChange={(value) => {
						backend.settings.debug.frontend = value;
						backend.saveSettings();
					}}
				/>

				<ToggleField
					label="Backend"
					description="Enable Backend debug"
					checked={backend.settings.debug.backend}
					onChange={(value) => {
						backend.settings.debug.backend = value;
						backend.saveSettings();
					}}
				/>
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
