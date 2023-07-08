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
} from 'decky-frontend-lib';
import { VFC } from 'react';
import { useState, useEffect } from 'react';
import { FaShip } from 'react-icons/fa';
import { Backend } from './backend';
import { BatteryInfo, MemoryInfo, ProcsInfo } from './interfaces';

let pollTimerRef: NodeJS.Timeout | undefined;

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

  // setVersion(backend.systemInfo.version);
  const refreshStatus = async () => {
    setMemory(backend.systemInfo.memory);
    setUptime(backend.systemInfo.uptime);
    setBattery(backend.systemInfo.battery);
    setProcs(backend.systemInfo.topKMemProcs);
  };
  useEffect(() => {
    pollTimerRef = setInterval(async () => {
      await refreshStatus();
    }, 1000);

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
          <div>Memory: {memory?.percent}%</div>
        </PanelSectionRow>
        <PanelSectionRow>
          <div>Uptime: {uptime}</div>
        </PanelSectionRow>
        <PanelSectionRow>
          <div>Battery: {battery?.percent.toFixed(2)}%</div>
        </PanelSectionRow>
      </PanelSection>
      <PanelSection title="Process Info">
        {procs?.map((proc, index) => (
          <PanelSectionRow key={index}>
            <div>Process ID: {proc.pid}</div>
            <div>Name: {proc.name}</div>
            <div>Memory Info:</div>
            <ul>
              <li>RSS: {(proc.mem.rss / 1024 / 1024).toFixed(2)}</li>
              <li>VMS: {(proc.mem.vms / 1024 / 1024).toFixed(2)}</li>
            </ul>
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
      </PanelSection>
    </div>
  );
};

export default definePlugin((serverAPI: ServerAPI) => {
  const backend = new Backend(serverAPI);
  backend.log({ sender: 'loader', message: 'Plugin Loaded' });

  if (pollTimerRef) {
    clearInterval(pollTimerRef);
  }
  pollTimerRef = setInterval(async () => {
    await backend.refreshStatus();
  }, 1000);

  return {
    title: <div className={staticClasses.Title}>Decky Spy</div>,
    content: <Content backend={backend} />,
    icon: <FaShip />,
    onDismount() {
      if (pollTimerRef) {
        clearInterval(pollTimerRef);
      }
    },
  };
});
