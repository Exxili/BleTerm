// import noble from "@abandonware/noble";
// import { GetMainWindow } from "../state";

import { ipcMain } from "electron";
import noble, { Peripheral } from "@abandonware/noble";
import { GetMainWindow } from "../state";

// /** ------------------------------
//  * Noble Events
//  * -------------------------------
//  */

// /**
//  * onNobleStateChange
//  * @description Handles changes in the Bluetooth adapter state.
//  * @param state The new state of the Bluetooth adapter
//  */
// const onNobleStateChange = (state: string): void => {
//   console.log(`Noble State Change: ${state}`);

//   if (state === "poweredOn") {
//     noble.startScanningAsync(); // Start scanning (allow duplicates)
//   }
// };

// /**
//  * onNobleDeviceDiscover
//  * @description Handles the discovery of a new peripheral device.
//  * @param peripheral The discovered peripheral device
//  */
// const onNobleDeviceDiscover = (peripheral: noble.Peripheral): void => {
//   GetMainWindow()?.webContents.send("ble-device-discovered", {
//     id: peripheral.id,
//     name: peripheral.advertisement.localName,
//     rssi: peripheral.rssi,
//   });
// };

// /** ------------------------------
//  * Functions
//  * ------------------------------
//  */

// /**
//  * AttachNobleEvents
//  * @description Attaches all noble event listeners.
//  * @return void
//  */
// export const AttachNobleEvents = (): void => {
//   // State Change
//   noble.on("stateChange", onNobleStateChange);

//   // Device Discovery
//   noble.on("discover", onNobleDeviceDiscover);
// };

// /**
//  * DettachNobleEvents
//  * @description Dettaches all noble event listeners.
//  * @return void
//  */
// export const DettachNobleEvents = (): void => {
//   // State Change
//   noble.removeAllListeners();
// };

// /**
//  * SetupBluetoothService
//  * @description Initializes the Bluetooth service.
//  * @return void
//  */
// export const SetupBluetoothServices = (): void => {
//   AttachNobleEvents();
// };

// /**
//  * DestroyBluetoothService
//  * @description Cleans up the Bluetooth service.
//  * @return void
//  */
// export const DestroyBluetoothServices = (): void => {
//   DettachNobleEvents();
// };

///////////////////////////////////////////////////////////////////////////////////////////////
// new attempt

// current error:

// ✓ 33 modules transformed.
// [commonjs--resolver] node_modules/@abandonware/bluetooth-hci-socket/build/Release/bluetooth_hci_socket.node (1:3): Unexpected character '\0' (Note that you need plugins to import files that are not JavaScript)
// file: C:/Users/Exxili/Documents/Github/BleTerm/node_modules/@abandonware/noble/index.js:1:3

// 1: MZ�♥♦���☺▼�� �!�☺L�!This program cannot be run in DOS mode.
//       ^
// 2: $l�%�(�K�(�K�(�K�c�H�/�K�c�Nٯ�K�c�O�"�Kد♣H�!�Kد♣O�&�Kد♣N�    �K�c�J�+�K�(�J�r�Kا♣B�)�Kا♣��)�Kا♣I�)�K�Rich(�K�...
// 3: �☺H��(��~�♣�O��H��(�I��H��(�M����H��(�↑☺H�\H�t$►H�|$ AVH�� H��L��3��������u♠�؈D$@@�☺�=q�☺...

// transforming (36) node_modules\usb\dist\usb\bindings.js
// VITE_DEV_SERVER_URL: http://localhost:5173/
// [38460:1006/210827.256:ERROR:CONSOLE(1)] "Request Autofill.enable failed. {"code":-32601,"message":"'Autofill.enable' wasn't found"}", source: devtools://devtools/bundled/core/protocol_client/protocol_client.js (1)
// ERROR: The process "38460" not found.

// /* eslint-disable @typescript-eslint/no-var-requires */
// /* eslint-disable @typescript-eslint/no-explicit-any */

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
