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

interface memoryInfo {
  total: number;
  available: number;
  percent: number;
}

class Backend {
  private static serverAPI: ServerAPI;

  static initBackend(server: ServerAPI) {
    this.setServer(server);
  }
  static setServer(server: ServerAPI) {
    this.serverAPI = server;
  }
  static getServer() {
    return this.serverAPI;
  }
  static async bridge(functionName: string, namedArgs?: any) {
    namedArgs = namedArgs ? namedArgs : {};
    console.debug(`[AutoSuspend] Calling backend function: ${functionName}`);
    var output = await this.serverAPI.callPluginMethod(functionName, namedArgs);
    return output.result;
  }
}

const Content: VFC<{ serverAPI: ServerAPI }> = ({ serverAPI }) => {
  const [version, setVersion] = useState<string | undefined>();

  const getVersion = async () => {
    const result = await serverAPI.callPluginMethod<any, string>(
      'get_version',
      {}
    );
    if (result.success) {
      setVersion(result.result);
    }
  };
  // {"total": 33559240704, "available": 19613745152, "percent": 41.6}
  const [memory, setMemory] = useState<memoryInfo | undefined>();

  const getMemory = async () => {
    const result = await serverAPI.callPluginMethod<any, memoryInfo>(
      'get_memory',
      {}
    );
    if (result.success) {
      console.log(result.result);
      setMemory(result.result);
    }
  };

  // Call getVersion when the component mounts
  useEffect(() => {
    getVersion();
  }, []);

  const onCheckVersion = async () => {
    let toastData: ToastData = {
      title: 'Hello World',
      body: version,
      duration: undefined,
      sound: 6,
      playSound: true,
      showToast: true,
    };
    serverAPI.toaster.toast(toastData);
  };

  const onGetMemory = async () => {
    await getMemory();
    let toastData: ToastData = {
      title: 'Memory',
      body: JSON.stringify(memory),
      duration: undefined,
      sound: 6,
      playSound: true,
      showToast: true,
    };
    serverAPI.toaster.toast(toastData);
  };

  return (
    <div>
      <PanelSection title="Spy Section">
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={onCheckVersion}>
            Check Version
          </ButtonItem>
          <ButtonItem layout="below" onClick={onGetMemory}>
            Get Memory
          </ButtonItem>
        </PanelSectionRow>

        <PanelSectionRow>
          <div>Version: {version}</div>
        </PanelSectionRow>
      </PanelSection>
    </div>
  );
};

const DeckyPluginRouterTest: VFC = () => {
  return (
    <div style={{ marginTop: '50px', color: 'white' }}>
      Hello World!
      <DialogButton onClick={() => Router.NavigateToLibraryTab()}>
        Go to Library
      </DialogButton>
    </div>
  );
};

export default definePlugin((serverApi: ServerAPI) => {
  Backend.initBackend(serverApi);

  serverApi.routerHook.addRoute('/decky-plugin-test', DeckyPluginRouterTest, {
    exact: true,
  });

  return {
    title: <div className={staticClasses.Title}>Example Plugin</div>,
    content: <Content serverAPI={serverApi} />,
    icon: <FaShip />,
    onDismount() {
      serverApi.routerHook.removeRoute('/decky-plugin-test');
    },
  };
});
