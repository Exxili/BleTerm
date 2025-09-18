import { ipcMain } from "electron";
import os from "os";

/**
 * Platform-specific services and utilities.
 * @description This module provides platform-specific functionalities and abstractions.
 * @module services/platform
 */

/**
 * ----------------------------
 * Types and Interfaces
 * ----------------------------
 */

export interface PlatformService {
  getPlatform: () => Promise<string>;
}

/** ----------------------------
 * Events
 * ----------------------------
 * */

/**
 * Get the current platform.
 * "@description Returns the current operating system platform.
 * @returns string The current platform (e.g., 'win32', 'darwin', 'linux').
 */
export const onGetCurrentPlatform = (): string => {
  return os.platform();
};

/** ---------------------------
 * Functions
 * ---------------------------
 */

/**
 * SetupPlatformServices
 * @description Sets up platform-specific services.
 * @return void
 */
export const SetupPlatformServices = (): void => {
  ipcMain.handle("get-platform", onGetCurrentPlatform);
};

/**
 * DestroyPlatformServices
 * @description Cleans up platform-specific services.
 * @return void
 */
export const DestroyPlatformServices = (): void => {
  ipcMain.removeHandler("get-platform");
};
