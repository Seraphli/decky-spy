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
	Focusable,
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
		refreshStatus();

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
					<div>
						Memory:{' '}
						{memory &&
							`${Backend.convertBytesToHumanReadable(
								memory.vmem.used,
							)}/${Backend.convertBytesToHumanReadable(
								memory.vmem.total,
							)}(${memory.vmem.percent}%)`}
					</div>
				</PanelSectionRow>
				<PanelSectionRow>
					<div>Uptime: {uptime}</div>
				</PanelSectionRow>
				<PanelSectionRow>
					<div>
						Battery: {battery && `${battery.percent.toFixed(2)}%`}
					</div>
				</PanelSectionRow>
			</PanelSection>
			<PanelSection title="Process Info">
				{procs?.map((proc, index) => (
					<PanelSectionRow key={index}>
						<div>
							<div>Rank: {index + 1}</div>
							<div>Process ID: {proc.pid}</div>
							<div>Name: {proc.name}</div>
							<div>Memory Info:</div>
							<ul>
								<li>
									RSS:{' '}
									{Backend.convertBytesToHumanReadable(
										proc.mem.rss,
									)}
								</li>
								<li>
									VMS:{' '}
									{Backend.convertBytesToHumanReadable(
										proc.mem.vms,
									)}
								</li>
							</ul>
						</div>
					</PanelSectionRow>
				))}
			</PanelSection>
			<PanelSection title="Configuration">
				{/* <PanelSectionRow>
					<ButtonItem layout="below" onClick={onCheckVersion}>
						Check Version
					</ButtonItem>
					<ButtonItem layout="below" onClick={onGetMemory}>
						Get Memory
					</ButtonItem>
				</PanelSectionRow> */}
			</PanelSection>
			<PanelSection title="Debug Info">
				<PanelSectionRow>
					<div>Version: {backend.systemInfo.version}</div>
				</PanelSectionRow>
				<PanelSectionRow>
					<div>
						<ToggleField
							label="Debug Frontend Mode"
							description="Enable Frontend debug mode"
							checked={backend.settings.debug.frontend}
							onChange={(value) => {
								backend.settings.debug.frontend = value;
								backend.saveSettings();
							}}
						/>
					</div>
				</PanelSectionRow>
				<PanelSectionRow>
					<div>
						<ToggleField
							label="Debug Backend Mode"
							description="Enable Backend debug mode"
							checked={backend.settings.debug.backend}
							onChange={(value) => {
								backend.settings.debug.backend = value;
								backend.saveSettings();
							}}
						/>
					</div>
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
