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
import { useState, useEffect, useRef } from 'react';
import { FaWatchmanMonitoring } from 'react-icons/fa';
import { Backend } from './backend';
import { SystemInfo, DefaultSystemInfo, Settings } from './interfaces';
import {
	convertBytesToHumanReadable,
	convertSecondsToHumanReadable,
} from './utils';

let backendPollTimerRef: NodeJS.Timeout | undefined;

const Content: VFC<{ backend: Backend }> = ({ backend }) => {
	const [uptime, setUptime] = useState<{ uptime: number; playtime: number }>({
		uptime: 0,
		playtime: 0,
	});
	const [systemInfo, setSystemInfo] = useState<SystemInfo>(DefaultSystemInfo);
	const [settings, setSettings] = useState<Settings>(backend.settings);
	const pollTimerRef = useRef<NodeJS.Timeout>();

	const refreshStatus = async () => {
		setSystemInfo({ ...backend.systemInfo });
		setUptime({
			uptime: Date.now() / 1000 - systemInfo.boottime,
			playtime: backend.playtime,
		});
	};
	useEffect(() => {
		pollTimerRef.current = setInterval(async () => {
			await refreshStatus();
		}, 500);

		return () => {
			if (pollTimerRef) {
				clearInterval(pollTimerRef.current);
			}
		};
	}, []);

	return (
		<div>
			<PanelSection title="System Info">
				<ToggleField
					label="Refresh Enabled"
					checked={settings.refresh.enabled}
					onChange={(value) => {
						setSettings({
							...settings,
							refresh: { ...settings.refresh, enabled: value },
						});
						backend.settings.refresh.enabled = value;
						backend.queueForSaveSettings();
					}}
				/>
				<SliderField
					label="Refresh Interval (seconds)"
					value={settings.refresh.interval}
					min={1}
					max={60}
					step={1}
					showValue={true}
					onChange={(value) => {
						setSettings({
							...settings,
							refresh: { ...settings.refresh, interval: value },
						});
						backend.settings.refresh.interval = value;
						backend.queueForSaveSettings();
					}}
				/>
				<Field
					focusable={true}
					childrenLayout="below"
					childrenContainerWidth="max"
				>
					<div>
						Uptime:{' '}
						{uptime && convertSecondsToHumanReadable(uptime.uptime)}
					</div>
					<div>
						Play Time:{' '}
						{uptime &&
							convertSecondsToHumanReadable(uptime.playtime)}
					</div>
					<div>
						Mem:{' '}
						{systemInfo.memory &&
							`${convertBytesToHumanReadable(
								systemInfo.memory.vmem.used,
							)}/${convertBytesToHumanReadable(
								systemInfo.memory.vmem.total,
							)}(${systemInfo.memory.vmem.percent}%)`}
					</div>
					<div>
						Swap:{' '}
						{systemInfo.memory &&
							`${convertBytesToHumanReadable(
								systemInfo.memory.swap.used,
							)}/${convertBytesToHumanReadable(
								systemInfo.memory.swap.total,
							)}(${systemInfo.memory.swap.percent}%)`}
					</div>
					<div>
						Battery:{' '}
						{systemInfo.battery &&
							`${systemInfo.battery.percent.toFixed(2)}%`}
					</div>
				</Field>
			</PanelSection>
			<PanelSection title="Process Info">
				<SliderField
					label="Num of Process"
					description="How many processes displayed"
					value={settings.procs_k}
					min={1}
					max={5}
					step={1}
					showValue={true}
					onChange={(value) => {
						setSettings({
							...settings,
							procs_k: value,
						});
						backend.settings.procs_k = value;
						backend.queueForSaveSettings();
					}}
				/>
				{systemInfo.topKMemProcs?.map((proc, index) => (
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
				<ToggleField
					label="Show Network Info"
					checked={settings.network.enabled}
					onChange={(value) => {
						setSettings({
							...settings,
							network: { ...settings.network, enabled: value },
						});
						backend.settings.network.enabled = value;
						backend.queueForSaveSettings();
					}}
				/>
				{settings.network.enabled &&
					systemInfo.nis?.map((ni, index) => (
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
					label="Out of Memory"
					focusable={false}
					highlightOnFocus={false}
					childrenLayout="below"
				>
					<ToggleField
						label="OOM Warning"
						description="Enable OutOfMemory warning"
						checked={settings.oom.enabled}
						onChange={(value) => {
							setSettings({
								...settings,
								oom: { ...settings.oom, enabled: value },
							});
							backend.settings.oom.enabled = value;
							backend.queueForSaveSettings();
						}}
					/>
					<SliderField
						label="Threshold"
						description="OOM threshold"
						value={settings.oom.threshold}
						min={50}
						max={100}
						step={0.2}
						showValue={true}
						onChange={(value) => {
							setSettings({
								...settings,
								oom: { ...settings.oom, threshold: value },
							});
							backend.settings.oom.threshold = value;
							backend.queueForSaveSettings();
						}}
					/>
					<ToggleField
						label="Plus Swap"
						description="Include swap"
						checked={settings.oom.plusSwap}
						onChange={(value) => {
							setSettings({
								...settings,
								oom: { ...settings.oom, plusSwap: value },
							});
							backend.settings.oom.plusSwap = value;
							backend.queueForSaveSettings();
						}}
					/>
					<SliderField
						label="Interval"
						description="Interval of warning (minutes)"
						value={settings.oom.interval}
						min={1}
						max={60}
						step={1}
						showValue={true}
						onChange={(value) => {
							setSettings({
								...settings,
								oom: { ...settings.oom, interval: value },
							});
							backend.settings.oom.interval = value;
							backend.queueForSaveSettings();
						}}
					/>
					<ToggleField
						label="Log Details"
						description="Log details of OOM"
						checked={settings.oom.logDetails}
						onChange={(value) => {
							setSettings({
								...settings,
								oom: { ...settings.oom, logDetails: value },
							});
							backend.settings.oom.logDetails = value;
							backend.queueForSaveSettings();
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
						checked={settings.battery.enabled}
						onChange={(value) => {
							setSettings({
								...settings,
								battery: {
									...settings.battery,
									enabled: value,
								},
							});
							backend.settings.battery.enabled = value;
							backend.queueForSaveSettings();
						}}
					/>
					<SliderField
						label="Threshold"
						description="Low battery threshold"
						value={settings.battery.threshold}
						min={5}
						max={50}
						step={1}
						showValue={true}
						onChange={(value) => {
							setSettings({
								...settings,
								battery: {
									...settings.battery,
									threshold: value,
								},
							});
							backend.settings.battery.threshold = value;
							backend.queueForSaveSettings();
						}}
					/>
					<SliderField
						label="Step"
						description="Step of warning after passing threshold"
						value={settings.battery.step}
						min={1}
						max={10}
						step={1}
						showValue={true}
						onChange={(value) => {
							setSettings({
								...settings,
								battery: {
									...settings.battery,
									step: value,
								},
							});
							backend.settings.battery.step = value;
							backend.queueForSaveSettings();
						}}
					/>
				</Field>
				<Field
					label="Anti-Addiction"
					focusable={false}
					highlightOnFocus={false}
					childrenLayout="below"
				>
					<ToggleField
						label="Enable Warning"
						description="Enable anti-addiction warning"
						checked={settings.anti_addict.enabled}
						onChange={(value) => {
							setSettings({
								...settings,
								anti_addict: {
									...settings.anti_addict,
									enabled: value,
								},
							});
							backend.settings.anti_addict.enabled = value;
							backend.queueForSaveSettings();
						}}
					/>
					<SliderField
						label="Threshold"
						description="Anti-addiction threshold (minutes)"
						value={settings.anti_addict.threshold}
						min={1}
						max={720}
						step={1}
						showValue={true}
						onChange={(value) => {
							setSettings({
								...settings,
								anti_addict: {
									...settings.anti_addict,
									threshold: value,
								},
							});
							backend.settings.anti_addict.threshold = value;
							backend.queueForSaveSettings();
						}}
					/>
					<SliderField
						label="Interval"
						description="Interval of warning (minutes)"
						value={settings.anti_addict.interval}
						min={1}
						max={120}
						step={1}
						showValue={true}
						onChange={(value) => {
							setSettings({
								...settings,
								anti_addict: {
									...settings.anti_addict,
									interval: value,
								},
							});
							backend.settings.anti_addict.interval = value;
							backend.queueForSaveSettings();
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
						value={settings.toaster.duration}
						min={3}
						max={10}
						step={1}
						showValue={true}
						onChange={(value) => {
							setSettings({
								...settings,
								toaster: {
									...settings.toaster,
									duration: value,
								},
							});
							backend.settings.toaster.duration = value;
							backend.queueForSaveSettings();
						}}
					/>
					<SliderField
						label="Sound"
						description="Sound of toaster"
						value={settings.toaster.sound}
						min={0}
						max={20}
						step={1}
						showValue={true}
						onChange={(value) => {
							setSettings({
								...settings,
								toaster: {
									...settings.toaster,
									sound: value,
								},
							});
							backend.settings.toaster.sound = value;
							backend.queueForSaveSettings();
						}}
					/>
					<ToggleField
						label="Play Sound"
						description="Play sound of toaster"
						checked={settings.toaster.playSound}
						onChange={(value) => {
							setSettings({
								...settings,
								toaster: {
									...settings.toaster,
									playSound: value,
								},
							});
							backend.settings.toaster.playSound = value;
							backend.queueForSaveSettings();
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
					<ButtonItem
						layout="below"
						onClick={() => {
							backend.antiAddictWarning();
						}}
					>
						Test Anti-Addiction Warning
					</ButtonItem>
				</Field>
			</PanelSection>
			<PanelSection title="Debug Info">
				<Field label="Version" focusable={true}>
					{backend.systemInfo.version}
				</Field>
				<Field
					label="Debug Info"
					focusable={true}
					childrenLayout="below"
					childrenContainerWidth="max"
				>
					{backend.debugInfo.map((info, index) => (
						<div key={index}>{info}</div>
					))}
				</Field>
				<ToggleField
					label="Frontend"
					description="Enable Frontend debug"
					checked={settings.debug.frontend}
					onChange={(value) => {
						setSettings({
							...settings,
							debug: { ...settings.debug, frontend: value },
						});
						backend.settings.debug.frontend = value;
						backend.queueForSaveSettings();
					}}
				/>
				<ToggleField
					label="Backend"
					description="Enable Backend debug"
					checked={settings.debug.backend}
					onChange={(value) => {
						setSettings({
							...settings,
							debug: { ...settings.debug, backend: value },
						});
						backend.settings.debug.backend = value;
						backend.queueForSaveSettings();
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
	backend.setup().then(() => {
		backendPollTimerRef = setInterval(async () => {
			await backend.refreshStatus();
		}, 1000);
	});

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
