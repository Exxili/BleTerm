import noble from "@abandonware/noble";
import { GetMainWindow } from "../state";

/** ------------------------------
 * Noble Events
 * -------------------------------
 */

/**
 * onNobleStateChange
 * @description Handles changes in the Bluetooth adapter state.
 * @param state The new state of the Bluetooth adapter
 */
const onNobleStateChange = (state: string): void => {
  console.log(`Noble State Change: ${state}`);

  if (state === "poweredOn") {
    noble.startScanningAsync(); // Start scanning (allow duplicates)
  }
};

/**
 * onNobleDeviceDiscover
 * @description Handles the discovery of a new peripheral device.
 * @param peripheral The discovered peripheral device
 */
const onNobleDeviceDiscover = (peripheral: noble.Peripheral): void => {
  GetMainWindow()?.webContents.send("ble-device-discovered", {
    id: peripheral.id,
    name: peripheral.advertisement.localName,
    rssi: peripheral.rssi,
  });
};

/** ------------------------------
 * Functions
 * ------------------------------
 */

/**
 * AttachNobleEvents
 * @description Attaches all noble event listeners.
 * @return void
 */
export const AttachNobleEvents = (): void => {
  // State Change
  noble.on("stateChange", onNobleStateChange);

  // Device Discovery
  noble.on("discover", onNobleDeviceDiscover);
};

/**
 * DettachNobleEvents
 * @description Dettaches all noble event listeners.
 * @return void
 */
export const DettachNobleEvents = (): void => {
  // State Change
  noble.removeAllListeners();
};

/**
 * SetupBluetoothService
 * @description Initializes the Bluetooth service.
 * @return void
 */
export const SetupBluetoothServices = (): void => {
  AttachNobleEvents();
};

/**
 * DestroyBluetoothService
 * @description Cleans up the Bluetooth service.
 * @return void
 */
export const DestroyBluetoothServices = (): void => {
  DettachNobleEvents();
};
