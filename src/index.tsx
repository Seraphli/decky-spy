import {
	ButtonItem,
	definePlugin,
	DialogButton,
	Menu,
	MenuItem,
	PanelSection,
	PanelSectionRow,
	Router,
	ServerAPI,
	showContextMenu,
	staticClasses,
	ToastData,
	ToggleField,
	SliderField,
} from 'decky-frontend-lib';
import { VFC } from 'react';
import { useState, useEffect } from 'react';
import { FaWatchmanMonitoring } from 'react-icons/fa';
import { Backend } from './backend';
import { BatteryInfo, MemoryInfo, ProcsInfo } from './interfaces';

let pollTimerRef: NodeJS.Timeout | undefined;
let backendPollTimerRef: NodeJS.Timeout | undefined;

const Content: VFC<{ backend: Backend }> = ({ backend }) => {
	const [memory, setMemory] = useState<MemoryInfo | undefined>();
	const [uptime, setUptime] = useState<string | undefined>();
	const [battery, setBattery] = useState<BatteryInfo | undefined>();
	const [procs, setProcs] = useState<ProcsInfo[] | undefined>();
	// const onCheckVersion = async () => {
	//   let toastData: ToastData = {
	//     title: 'Hello World',
	//     body: version,
	//     duration: undefined,
	//     sound: 6,
	//     playSound: true,
	//     showToast: true,
	//   };
	//   serverAPI.toaster.toast(toastData);
	// };

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
					Memory:{' '}
					{memory &&
						`${Backend.convertBytesToHumanReadable(
							memory.vmem.used,
						)}/${Backend.convertBytesToHumanReadable(
							memory.vmem.total,
						)}(${memory.vmem.percent}%)`}
				</PanelSectionRow>
				<PanelSectionRow>
					Swap:{' '}
					{memory &&
						`${Backend.convertBytesToHumanReadable(
							memory.swap.used,
						)}/${Backend.convertBytesToHumanReadable(
							memory.swap.total,
						)}(${memory.swap.percent}%)`}
				</PanelSectionRow>
				<PanelSectionRow>Uptime: {uptime}</PanelSectionRow>
				<PanelSectionRow>
					Battery: {battery && `${battery.percent.toFixed(2)}%`}
				</PanelSectionRow>
			</PanelSection>
			<PanelSection title="Process Info">
				{procs?.map((proc, index) => (
					<PanelSectionRow key={index}>
						Rank: {index + 1}
						<br />
						Process ID: {proc.pid}
						<br />
						Name: {proc.name}
						<br />
						Memory Info:{' '}
						{Backend.convertBytesToHumanReadable(proc.mem.rss)}
						<br />
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
					></SliderField>
				</PanelSectionRow>
			</PanelSection>
			<PanelSection title="Debug Info">
				<PanelSectionRow>
					Version: {backend.systemInfo.version}
				</PanelSectionRow>
				<PanelSectionRow>
					<ToggleField
						label="Debug Frontend Mode"
						description="Enable Frontend debug mode"
						checked={backend.settings.debug.frontend}
						onChange={(value) => {
							backend.settings.debug.frontend = value;
							backend.saveSettings();
						}}
					/>
				</PanelSectionRow>
				<PanelSectionRow>
					<ToggleField
						label="Debug Backend Mode"
						description="Enable Backend debug mode"
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
		},
	};
});
