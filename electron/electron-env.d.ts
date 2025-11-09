/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference types="vite-plugin-electron/electron-env" />
import { PlatformService } from "./services/platform";
import { WindowControlService } from "./services/window";

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string;
    /** /dist/ or /public/ */
    VITE_PUBLIC: string;
  }
}

declare global {
  // Used in Renderer process, expose in `preload.ts`
  interface Window {
    ipcRenderer: import("electron").IpcRenderer;
    platform: PlatformService;
    windowcontrol: WindowControlService;
    ble: {
      scan: () => Promise<void>;
      stop: () => Promise<void>;
      connect: (peripheralId: string) => Promise<any>;
      disconnect: (peripheralId: string) => Promise<void>;
      services: (
        peripheralId: string
      ) => Promise<Array<{ uuid: string; characteristics: Array<{ uuid: string; properties: string[] }> }>>;
      read: (peripheralId: string, serviceUuid: string, charUuid: string) => Promise<string>;
      notifyStart: (peripheralId: string, serviceUuid: string, charUuid: string) => Promise<void>;
      notifyStop: (peripheralId: string, serviceUuid: string, charUuid: string) => Promise<void>;
      on: (channel: string, listener: (event: any, data: any) => void) => void;
      off: (channel: string, listener: (event: any, data: any) => void) => void;
    };
  }
}

export {};
