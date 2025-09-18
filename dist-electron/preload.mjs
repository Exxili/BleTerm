"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args) {
    const [channel, listener] = args;
    return electron.ipcRenderer.on(
      channel,
      (event, ...args2) => listener(event, ...args2)
    );
  },
  off(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.invoke(channel, ...omit);
  }
  // You can expose other APTs you need here.
  // ...
});
const PlatformApi = {
  getPlatform: () => electron.ipcRenderer.invoke("get-platform")
};
electron.contextBridge.exposeInMainWorld("platform", PlatformApi);
const WindowControlApi = {
  minimize: () => electron.ipcRenderer.invoke("window-minimize"),
  maximize: () => electron.ipcRenderer.invoke("window-maximize"),
  unmaximize: () => electron.ipcRenderer.invoke("window-unmaximize"),
  close: () => electron.ipcRenderer.invoke("window-close"),
  isMaximized: () => electron.ipcRenderer.invoke("window-is-maximized")
};
electron.contextBridge.exposeInMainWorld("windowcontrol", WindowControlApi);
