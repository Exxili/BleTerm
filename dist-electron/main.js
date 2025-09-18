import { ipcMain, BrowserWindow, app } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import noble from "@abandonware/noble";
import os from "os";
let MainWindow = null;
const SetMainWindow = (window) => {
  MainWindow = window;
};
const GetMainWindow = () => {
  return MainWindow;
};
const GenerateMainWindowConfig = (iconPath, preloadPath) => {
  return {
    autoHideMenuBar: true,
    frame: false,
    minWidth: 800,
    minHeight: 600,
    width: 1024,
    height: 768,
    icon: iconPath,
    webPreferences: {
      preload: preloadPath
    }
  };
};
const onNobleStateChange = (state) => {
  console.log(`Noble State Change: ${state}`);
  if (state === "poweredOn") {
    noble.startScanningAsync();
  }
};
const onNobleDeviceDiscover = (peripheral) => {
  var _a;
  (_a = GetMainWindow()) == null ? void 0 : _a.webContents.send("ble-device-discovered", {
    id: peripheral.id,
    name: peripheral.advertisement.localName,
    rssi: peripheral.rssi
  });
};
const AttachNobleEvents = () => {
  noble.on("stateChange", onNobleStateChange);
  noble.on("discover", onNobleDeviceDiscover);
};
const SetupBluetoothServices = () => {
  AttachNobleEvents();
};
const onGetCurrentPlatform = () => {
  return os.platform();
};
const SetupPlatformServices = () => {
  ipcMain.handle("get-platform", onGetCurrentPlatform);
};
const onWindowMinimize = () => {
  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    window.minimize();
  }
};
const onWindowMaximize = () => {
  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    window.maximize();
  }
};
const onWindowUnmaximize = () => {
  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    window.unmaximize();
  }
};
const onWindowClose = () => {
  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    window.close();
  }
};
const onWindowIsMaximized = () => {
  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    return window.isMaximized();
  }
  return false;
};
const SetupWindowControlServices = () => {
  ipcMain.handle("window-minimize", onWindowMinimize);
  ipcMain.handle("window-maximize", onWindowMaximize);
  ipcMain.handle("window-unmaximize", onWindowUnmaximize);
  ipcMain.handle("window-close", onWindowClose);
  ipcMain.handle("window-is-maximized", onWindowIsMaximized);
};
const SetupServices = () => {
  SetupPlatformServices();
  SetupWindowControlServices();
  SetupBluetoothServices();
};
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
const CreateMainWindow = () => {
  const MainWindow2 = new BrowserWindow(
    GenerateMainWindowConfig(
      path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
      path.join(__dirname, "preload.mjs")
    )
  );
  SetMainWindow(MainWindow2);
};
const AttachMainWindowEvents = () => {
  var _a;
  (_a = GetMainWindow()) == null ? void 0 : _a.webContents.on("did-finish-load", onMainWindowDidFinishLoad);
};
const onMainWindowDidFinishLoad = () => {
  var _a;
  (_a = GetMainWindow()) == null ? void 0 : _a.webContents.send(
    "main-process-message",
    (/* @__PURE__ */ new Date()).toLocaleString()
  );
};
const LoadRenderer = () => {
  var _a, _b;
  console.log("VITE_DEV_SERVER_URL:", VITE_DEV_SERVER_URL);
  if (VITE_DEV_SERVER_URL) {
    (_a = GetMainWindow()) == null ? void 0 : _a.loadURL(VITE_DEV_SERVER_URL);
  } else {
    (_b = GetMainWindow()) == null ? void 0 : _b.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
};
const InitializeMainWindow = () => {
  var _a;
  CreateMainWindow();
  AttachMainWindowEvents();
  LoadRenderer();
  if (!app.isPackaged) {
    (_a = GetMainWindow()) == null ? void 0 : _a.webContents.openDevTools();
  }
};
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    SetMainWindow(null);
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    InitializeMainWindow();
  }
});
app.whenReady().then(() => {
  SetupServices();
  InitializeMainWindow();
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
