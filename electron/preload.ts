import { ipcRenderer, contextBridge } from "electron";
import { PlatformService } from "./services/platform";
import { WindowControlService } from "./services/window";
import { BLEChannels } from "./services/bluetooth";
// import { BLEChannels } from "./services/bluetooth";

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args;
    return ipcRenderer.on(channel, (event, ...args) =>
      listener(event, ...args)
    );
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args;
    return ipcRenderer.off(channel, ...omit);
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args;
    return ipcRenderer.send(channel, ...omit);
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args;
    return ipcRenderer.invoke(channel, ...omit);
  },

  // You can expose other APTs you need here.
  // ...
});

/**
 * ----------------------------
 * Platform API
 * ----------------------------
 */

const PlatformApi = {
  getPlatform: () => ipcRenderer.invoke("get-platform"),
} satisfies PlatformService;

/**
 * Platform API
 * @description Exposes platform-specific functionalities to the renderer process.
 */
contextBridge.exposeInMainWorld("platform", PlatformApi);

/**
 * ----------------------------
 * Window API
 * ----------------------------
 */

const WindowControlApi = {
  minimize: () => ipcRenderer.invoke("window-minimize"),
  maximize: () => ipcRenderer.invoke("window-maximize"),
  unmaximize: () => ipcRenderer.invoke("window-unmaximize"),
  close: () => ipcRenderer.invoke("window-close"),
  isMaximized: () => ipcRenderer.invoke("window-is-maximized"),
} satisfies WindowControlService;

/**
 * Window Control API
 * @description Exposes window-specific functionalities to the renderer process.
 */
contextBridge.exposeInMainWorld("windowcontrol", WindowControlApi);

/**
 * ----------------------------
 * Bluetooth API
 * ----------------------------
 */

contextBridge.exposeInMainWorld("ble", {
  scan: () => ipcRenderer.invoke("ble:scan:start"),
  stop: () => ipcRenderer.invoke("ble:scan:stop"),
  on: (channel: string, listener: (event: any, data: any) => void) =>
    ipcRenderer.on(channel, listener),
  off: (channel: string, listener: (...args: any[]) => void) =>
    ipcRenderer.removeListener(channel, listener),
  // channels: BLEChannels,
});
