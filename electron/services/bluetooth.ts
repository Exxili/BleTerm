/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
// import noble from "@abandonware/noble";
// import { GetMainWindow } from "../state";

import { ipcMain } from "electron";
import noble, { Peripheral } from "@abandonware/noble";
import { GetMainWindow } from "../state";

/**
 * ------------------------------
 * Channels
 * ------------------------------
 */
export const BLEChannels = {
  scanStart: "ble:scan:start",
  scanStop: "ble:scan:stop",
  evtState: "ble:state",
  evtScanResult: "ble:scan:result",
  evtScanFinished: "ble:scan:finished",
  evtError: "ble:error",

  connect: "ble:connect",
  evtConnected: "ble:connected",
  evtDisconnected: "ble:disconnected",
} as const;

/**
 * ------------------------------
 * State
 * ------------------------------
 */
let scanning = false;
const seenPeripherals = new Set<string>();

/**
 * sendToRenderer
 * @description Safe wrapper to send IPC to renderer.
 */
const sendToRenderer = (channel: string, payload: any): void => {
  const win = GetMainWindow();
  if (!win || win.isDestroyed()) return;
  win.webContents.send(channel, payload);
};

/**
 * peripheralToPayload
 * @description Maps a noble Peripheral to a lean payload.
 */
const peripheralToPayload = (p: Peripheral) => ({
  id: p.id,
  address: p.address,
  localName: p.advertisement?.localName || "",
  rssi: p.rssi,
  connectable: p.connectable,
  serviceUuids: p.advertisement?.serviceUuids || [],
  manufacturerData: p.advertisement?.manufacturerData
    ? p.advertisement.manufacturerData.toString("hex")
    : undefined,
});

const promisifyIfNeeded = <T>(
  fn: Function,
  ctx: any,
  ...args: any[]
): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const cb = (err: any, res: T) => (err ? reject(err) : resolve(res));
    try {
      fn.apply(ctx, [...args, cb]);
    } catch (e) {
      reject(e);
    }
  });

const getDiscoveredPeripheral = (id: string): Peripheral | undefined => {
  // noble keeps an internal map we can use after discovery
  const map = (noble as any)._peripherals as
    | Record<string, Peripheral>
    | undefined;
  return map?.[id];
};

/**
 * startScan
 * @description Starts BLE scanning if adapter powered on.
 */
const startScan = async (): Promise<void> => {
  if (scanning) return;
  if (noble._state !== "poweredOn") {
    sendToRenderer(BLEChannels.evtError, {
      context: "scan",
      message: `Adapter not poweredOn (state=${noble._state})`,
    });
    return;
  }
  seenPeripherals.clear();
  scanning = true;
  try {
    await noble.startScanningAsync([], false); // all services, no duplicates
  } catch (e: any) {
    scanning = false;
    sendToRenderer(BLEChannels.evtError, {
      context: "scan",
      message: e?.message || String(e),
    });
  }
};

/**
 * stopScan
 * @description Stops BLE scanning.
 */
const stopScan = async (): Promise<void> => {
  if (!scanning) return;
  scanning = false;
  try {
    await noble.stopScanningAsync();
  } catch {
    // ignore
  }
  sendToRenderer(BLEChannels.evtScanFinished, {});
};

/**
 * ------------------------------
 * Noble Event Handlers
 * ------------------------------
 */

/**
 * onNobleStateChange
 * @description Handles adapter state changes.
 */
const onNobleStateChange = (state: string): void => {
  console.log(state);
  sendToRenderer(BLEChannels.evtState, { state });
  if (state !== "poweredOn" && scanning) {
    stopScan();
  }
};

/**
 * onNobleDeviceDiscover
 * @description Handles discovered peripherals.
 */
const onNobleDeviceDiscover = (peripheral: Peripheral): void => {
  if (!scanning) return;
  if (seenPeripherals.has(peripheral.id)) return;
  seenPeripherals.add(peripheral.id);
  sendToRenderer(BLEChannels.evtScanResult, peripheralToPayload(peripheral));
};

/*
 * ------------------------------
 * Handlers
 * ------------------------------
 *
 */

const handleConnect = async (
  _e: Electron.IpcMainInvokeEvent,
  peripheralId: string
) => {
  try {
    if (noble._state !== "poweredOn") {
      throw new Error(`Adapter not poweredOn (state=${noble._state})`);
    }

    const p = getDiscoveredPeripheral(peripheralId);
    if (!p) {
      throw new Error(
        `Peripheral ${peripheralId} not found — scan first and pick an id from results.`
      );
    }

    // Connect (supports both connectAsync and callback forms)
    if ((p as any).connectAsync) {
      await (p as any).connectAsync();
    } else {
      await promisifyIfNeeded<void>(p.connect, p);
    }

    // notify renderer
    const payload = peripheralToPayload(p);
    sendToRenderer(BLEChannels.evtConnected, payload);

    // also forward future remote disconnects
    const onDisc = () => {
      p.removeListener("disconnect", onDisc);
      sendToRenderer(BLEChannels.evtDisconnected, {
        id: p.id,
        reason: "remote",
      });
    };
    p.on("disconnect", onDisc);

    return payload; // so renderer can await the invoke and get basic info
  } catch (e: any) {
    sendToRenderer(BLEChannels.evtError, {
      context: "connect",
      message: e?.message || String(e),
    });
    throw e; // propagate to renderer invoke() caller
  }
};

/**
 * ------------------------------
 * Attach / Detach
 * ------------------------------
 */

/**
 * AttachNobleEvents
 * @description Attaches noble listeners.
 */
export const AttachNobleEvents = (): void => {
  noble.on("stateChange", onNobleStateChange);
  noble.on("discover", onNobleDeviceDiscover);
};

/**
 * DettachNobleEvents
 * @description Removes all noble listeners.
 */
export const DettachNobleEvents = (): void => {
  noble.removeAllListeners("stateChange");
  noble.removeAllListeners("discover");
};

/**
 * ------------------------------
 * IPC Registration
 * ------------------------------
 */

/**
 * registerIpcHandlers
 * @description Registers IPC handlers for BLE scan control.
 */
const registerIpcHandlers = (): void => {
  ipcMain.handle(BLEChannels.scanStart, async () => {
    await startScan();
  });
  ipcMain.handle(BLEChannels.scanStop, async () => {
    // await stopScan();
  });

  // ✅ NEW:
  ipcMain.handle(BLEChannels.connect, handleConnect);
};

/**
 * unregisterIpcHandlers
 * @description Removes IPC handlers.
 */
const unregisterIpcHandlers = (): void => {
  [BLEChannels.scanStart, BLEChannels.scanStop].forEach((ch) => {
    if (ipcMain.listenerCount(ch)) ipcMain.removeHandler(ch);
  });
};

/**
 * SetupBluetoothServices
 * @description Initializes BLE service (events + IPC).
 */
export const SetupBluetoothServices = (): void => {
  AttachNobleEvents();
  registerIpcHandlers();
};

/**
 * DestroyBluetoothServices
 * @description Tears down BLE service.
 */
export const DestroyBluetoothServices = (): void => {
  stopScan();
  DettachNobleEvents();
  unregisterIpcHandlers();
};
