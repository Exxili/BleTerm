import { BrowserWindow, ipcMain } from "electron";

/**
 * Window-specific services and utilities.
 * @description This module provides window-specific functionalities and abstractions.
 * @module services/windowcontrol
 */

/**
 * ----------------------------
 * Types and Interfaces
 * ----------------------------
 */

export interface WindowControlService {
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  unmaximize: () => Promise<void>;
  close: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
}

/** ----------------------------
 * Events
 * ----------------------------
 * */

/**
 * Minimize the current window.
 * @description Minimizes the currently focused window.
 * @returns void
 */
const onWindowMinimize = (): void => {
  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    window.minimize();
  }
};

/**
 * Maximize the current window.
 * @description Maximizes the currently focused window.
 * @returns void
 */
const onWindowMaximize = (): void => {
  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    window.maximize();
  }
};

/**
 * Unmaximize the current window.
 * @description Restores the currently focused window from maximized state.
 * @returns void
 */
const onWindowUnmaximize = (): void => {
  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    window.unmaximize();
  }
};

/**
 * Close the current window.
 * @description Closes the currently focused window.
 * @returns void
 */
const onWindowClose = (): void => {
  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    window.close();
  }
};

/**
 * Check if the current window is maximized.
 * @description Returns whether the currently focused window is maximized.
 * @returns boolean True if the window is maximized, false otherwise.
 */
const onWindowIsMaximized = (): boolean => {
  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    return window.isMaximized();
  }
  return false;
};

/** ---------------------------
 * Functions
 * ---------------------------
 */

/**
 * SetupWindowServices
 * @description Sets up window specific services and events.
 * @return void
 */
export const SetupWindowControlServices = (): void => {
  ipcMain.handle("window-minimize", onWindowMinimize);
  ipcMain.handle("window-maximize", onWindowMaximize);
  ipcMain.handle("window-unmaximize", onWindowUnmaximize);
  ipcMain.handle("window-close", onWindowClose);
  ipcMain.handle("window-is-maximized", onWindowIsMaximized);
};

/**
 * DestroyWindowServices
 * @description Cleans up window specific services and events.
 * @return void
 */
export const DestroyWindowControlServices = (): void => {
  ipcMain.removeHandler("window-minimize");
  ipcMain.removeHandler("window-maximize");
  ipcMain.removeHandler("window-unmaximize");
  ipcMain.removeHandler("window-close");
  ipcMain.removeHandler("window-is-maximized");
};
