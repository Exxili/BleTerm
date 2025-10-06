import { app, BrowserWindow } from "electron";
// import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { GetMainWindow, SetMainWindow } from "./state";
import { GenerateMainWindowConfig } from "./config/MainWindowConfig";
import { SetupServices } from "./services";

// export const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, "..");

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

/**
 * CreateMainWindow
 * @description Creates the main application window.
 * @returns BrowserWindow
 */
const CreateMainWindow = (): void => {
  // Create the browser window.
  const MainWindow = new BrowserWindow(
    GenerateMainWindowConfig(
      path.join(process.env.VITE_PUBLIC as string, "electron-vite.svg"),
      path.join(__dirname, "preload.mjs")
    )
  );

  // Set Main Window
  SetMainWindow(MainWindow);
};

/**
 * AttachMainWindowEvents
 * @description Attaches events to the main application window.
 * @returns void
 */
const AttachMainWindowEvents = (): void => {
  GetMainWindow()?.webContents.on("did-finish-load", onMainWindowDidFinishLoad);
};

/**
 * onMainWindowDidFinishLoad
 * @description Handles the "did-finish-load" event for the main application window.
 * @returns void
 */
const onMainWindowDidFinishLoad = (): void => {
  GetMainWindow()?.webContents.send(
    "main-process-message",
    new Date().toLocaleString()
  );
};

/**
 * LoadRenderer
 * @description Loads the renderer process into the main application window.
 * @returns void
 */
const LoadRenderer = (): void => {
  // Check what the url is
  console.log("VITE_DEV_SERVER_URL:", VITE_DEV_SERVER_URL);

  if (VITE_DEV_SERVER_URL) {
    GetMainWindow()?.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    GetMainWindow()?.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
};

/**
 * InitializeMainWindow
 * @description Initializes the main application window.
 * @return void
 */
const InitializeMainWindow = (): void => {
  CreateMainWindow();

  AttachMainWindowEvents();

  LoadRenderer();

  // Open the DevTools if the app is not packaged
  if (!app.isPackaged) {
    GetMainWindow()?.webContents.openDevTools();
  }
};

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    SetMainWindow(null);
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    InitializeMainWindow();
  }
});

app.whenReady().then(() => {
  // Setup Backend Services
  SetupServices();

  InitializeMainWindow();
});
