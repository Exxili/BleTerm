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
  disconnect: "ble:disconnect",
  services: "ble:services",
  read: "ble:read",
  notifyStart: "ble:notify:start",
  notifyStop: "ble:notify:stop",
  evtNotifyData: "ble:notify:data",
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
// Track active notification subscriptions so we don't duplicate listeners
const activeNotifications = new Map<
  string,
  { char: any; onData: (data: Buffer, isNotification: boolean) => void }
>();
// Cache discovered characteristic objects by peripheral and "service:char" key
const charCache = new Map<string, Map<string, any>>();
// De-dup notifications arriving multiple times within a tiny window
const lastNotifyMap = new Map<string, { hex: string; ts: number }>();

const cleanupPeripheral = async (peripheralId: string) => {
  // Stop all active notifications for this peripheral
  const keys = Array.from(activeNotifications.keys()).filter((k) => k.startsWith(peripheralId + ":"));
  const p = getDiscoveredPeripheral(peripheralId) as any | undefined;
  const isConnected = p?.state === "connected";
  for (const key of keys) {
    const entry = activeNotifications.get(key);
    if (!entry) continue;
    // Always detach our specific data handler first
    try {
      entry.char?.off?.("data", entry.onData);
    } catch { /* noop */ }
    // Only attempt to unsubscribe if still connected to avoid noisy errors from noble
    if (isConnected) {
      try {
        await ((entry.char as any).unsubscribeAsync?.() || promisifyIfNeeded<void>(entry.char.unsubscribe, entry.char));
      } catch { /* noop */ }
    }
    activeNotifications.delete(key);
  }
  charCache.delete(peripheralId);
  // Clear last notify cache for this peripheral
  Array.from(lastNotifyMap.keys()).forEach((k) => {
    if (k.startsWith(peripheralId + ":")) lastNotifyMap.delete(k);
  });
};

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
 * listServicesAndCharacteristics
 * @description Discovers services and characteristics for a connected peripheral.
 */
const listServicesAndCharacteristics = async (
  peripheralId: string
): Promise<
  Array<{
    uuid: string;
    characteristics: Array<{
      uuid: string;
      properties: string[];
    }>;
  }>
> => {
  const p = getDiscoveredPeripheral(peripheralId);
  if (!p) throw new Error(`Peripheral ${peripheralId} not found`);
  // Discover services explicitly and then fetch each service's characteristics.
  const services: any[] =
    (await (p as any).discoverServicesAsync?.([])) ||
    (await promisifyIfNeeded<any[]>(p.discoverServices, p, []));
  const out: Array<{
    uuid: string;
    characteristics: Array<{ uuid: string; properties: string[] }>;
  }> = [];
  for (const s of services) {
    let chars: any[] =
      (await (s as any).discoverCharacteristicsAsync?.([])) ||
      (await promisifyIfNeeded<any[]>(s.discoverCharacteristics, s, []));
    // Fallback: some stacks require using peripheral.discoverSomeServicesAndCharacteristics
    if (!chars || chars.length === 0) {
      try {
        await ((p as any).discoverSomeServicesAndCharacteristicsAsync?.([s.uuid], []) ||
          promisifyIfNeeded<any[]>(p.discoverSomeServicesAndCharacteristics, p, [s.uuid], []));
        const svc = ((p as any).services || []).find((it: any) => it.uuid === s.uuid);
        if (svc) chars = (svc as any).characteristics || [];
      } catch {
        // ignore fallback errors
      }
    }
    // populate cache map
    let periphMap = charCache.get(peripheralId);
    if (!periphMap) {
      periphMap = new Map<string, any>();
      charCache.set(peripheralId, periphMap);
    }

    out.push({
      uuid: s.uuid,
      characteristics: (chars || []).map((c: any) => {
        const key = `${norm(s.uuid)}:${norm(c.uuid)}`;
        periphMap!.set(key, c);
        return {
          uuid: norm(c.uuid),
          properties: c.properties || [],
        };
      }),
    });
  }
  return out;
};

const readCharacteristic = async (
  peripheralId: string,
  serviceUuid: string,
  charUuid: string
): Promise<string> => {
  const p = getDiscoveredPeripheral(peripheralId);
  if (!p) throw new Error(`Peripheral ${peripheralId} not found`);
  const services: any[] = (await (p as any).discoverServicesAsync?.([serviceUuid]))
    || (await promisifyIfNeeded<any[]>(p.discoverServices, p, [serviceUuid]));
  const s = services[0];
  if (!s) throw new Error(`Service ${serviceUuid} not found`);
  const chars: any[] = (await (s as any).discoverCharacteristicsAsync?.([charUuid]))
    || (await promisifyIfNeeded<any[]>(s.discoverCharacteristics, s, [charUuid]));
  const c = chars[0];
  if (!c) throw new Error(`Characteristic ${charUuid} not found`);
  const buf: Buffer = (await (c as any).readAsync?.()) || (await promisifyIfNeeded<Buffer>(c.read, c));
  return buf.toString("hex");
};

const startNotify = async (
  peripheralId: string,
  serviceUuid: string,
  charUuid: string
): Promise<void> => {
  serviceUuid = norm(serviceUuid);
  charUuid = norm(charUuid);
  const key = `${peripheralId}:${serviceUuid}:${charUuid}`;
  if (activeNotifications.has(key)) {
    return; // already subscribed
  }
  // Try cache first
  let c = charCache.get(peripheralId)?.get(`${serviceUuid}:${charUuid}`);
  if (!c) {
    const p = getDiscoveredPeripheral(peripheralId);
    if (!p) throw new Error(`Peripheral ${peripheralId} not found`);
    const services: any[] = (await (p as any).discoverServicesAsync?.([serviceUuid]))
      || (await promisifyIfNeeded<any[]>(p.discoverServices, p, [serviceUuid]));
    const s = services[0];
    if (!s) throw new Error(`Service ${serviceUuid} not found`);
    const chars: any[] = (await (s as any).discoverCharacteristicsAsync?.([charUuid]))
      || (await promisifyIfNeeded<any[]>(s.discoverCharacteristics, s, [charUuid]));
    c = chars[0];
    // update cache for this one
    if (c) {
      if (!charCache.get(peripheralId)) charCache.set(peripheralId, new Map());
      charCache.get(peripheralId)!.set(`${serviceUuid}:${charUuid}`, c);
    }
  }
  if (!c) throw new Error(`Characteristic ${charUuid} not found`);
  const onData = (data: Buffer, isNotification: boolean) => {
    if (!isNotification) return;
    const hex = data.toString("hex");
    const lkey = `${peripheralId}:${serviceUuid}:${charUuid}`;
    const prev = lastNotifyMap.get(lkey);
    const now = Date.now();
    if (prev && prev.hex === hex && now - prev.ts < 10) {
      return; // drop tight duplicates from stack quirks
    }
    lastNotifyMap.set(lkey, { hex, ts: now });
    sendToRenderer(BLEChannels.evtNotifyData, {
      peripheralId,
      serviceUuid,
      charUuid,
      data: hex,
    });
  };
  c.on("data", onData);
  await ((c as any).subscribeAsync?.() || promisifyIfNeeded<void>(c.subscribe, c));
  activeNotifications.set(key, { char: c, onData });
};

const stopNotify = async (
  peripheralId: string,
  serviceUuid: string,
  charUuid: string
): Promise<void> => {
  serviceUuid = norm(serviceUuid);
  charUuid = norm(charUuid);
  const key = `${peripheralId}:${serviceUuid}:${charUuid}`;
  const existing = activeNotifications.get(key);
  let c: any = existing?.char;
  if (!c) {
    // Fallback: locate characteristic if not cached
    const p = getDiscoveredPeripheral(peripheralId);
    if (!p) throw new Error(`Peripheral ${peripheralId} not found`);
    const services: any[] = (await (p as any).discoverServicesAsync?.([serviceUuid]))
      || (await promisifyIfNeeded<any[]>(p.discoverServices, p, [serviceUuid]));
    const s = services[0];
    if (!s) throw new Error(`Service ${serviceUuid} not found`);
    const chars: any[] = (await (s as any).discoverCharacteristicsAsync?.([charUuid]))
      || (await promisifyIfNeeded<any[]>(s.discoverCharacteristics, s, [charUuid]));
    c = chars[0];
  }
  if (!c) return;
  try {
    await ((c as any).unsubscribeAsync?.() || promisifyIfNeeded<void>(c.unsubscribe, c));
  } catch { /* noop */ }
  try {
    const onData = existing?.onData;
    if (onData) (c as any).off?.("data", onData);
    else c.removeAllListeners?.("data");
  } catch { /* noop */ }
  activeNotifications.delete(key);
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

    // Connect only if not already connected
    if ((p as any).state !== "connected") {
      if ((p as any).connectAsync) {
        await (p as any).connectAsync();
      } else {
        await promisifyIfNeeded<void>(p.connect, p);
      }
    }

    // notify renderer
    const payload = peripheralToPayload(p);
    sendToRenderer(BLEChannels.evtConnected, payload);

    // also forward future remote disconnects
    const onDisc = async () => {
      p.removeListener("disconnect", onDisc);
      await cleanupPeripheral(p.id);
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
    await stopScan();
  });

  // ✅ NEW:
  ipcMain.handle(BLEChannels.connect, handleConnect);
  ipcMain.handle(BLEChannels.disconnect, handleDisconnect);
  ipcMain.handle(BLEChannels.services, async (_e, id: string) => {
    return listServicesAndCharacteristics(id);
  });
  ipcMain.handle(BLEChannels.read, async (_e, id: string, s: string, c: string) => {
    return readCharacteristic(id, s, c);
  });
  ipcMain.handle(BLEChannels.notifyStart, async (_e, id: string, s: string, c: string) => {
    return startNotify(id, s, c);
  });
  ipcMain.handle(BLEChannels.notifyStop, async (_e, id: string, s: string, c: string) => {
    return stopNotify(id, s, c);
  });
};

const handleDisconnect = async (
  _e: Electron.IpcMainInvokeEvent,
  peripheralId: string
) => {
  const p = getDiscoveredPeripheral(peripheralId);
  if (!p) return;
  try {
    if ((p as any).state === "connected") {
      if ((p as any).disconnectAsync) {
        await (p as any).disconnectAsync();
      } else {
        await promisifyIfNeeded<void>(p.disconnect, p);
      }
    }
  } finally {
    await cleanupPeripheral(peripheralId);
    sendToRenderer(BLEChannels.evtDisconnected, { id: peripheralId, reason: "local" });
  }
};

/**
 * unregisterIpcHandlers
 * @description Removes IPC handlers.
 */
const unregisterIpcHandlers = (): void => {
  [
    BLEChannels.scanStart,
    BLEChannels.scanStop,
    BLEChannels.connect,
    BLEChannels.disconnect,
    BLEChannels.services,
    BLEChannels.read,
    BLEChannels.notifyStart,
    BLEChannels.notifyStop,
    BLEChannels.evtNotifyData,
  ].forEach((ch) => {
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
  // Best-effort disconnect all connected peripherals
  try {
    const map = (noble as any)._peripherals as Record<string, Peripheral> | undefined;
    if (map) {
      const list = Object.values(map);
      list.forEach((p) => {
        if ((p as any).state === "connected") {
          try {
            (p as any).disconnect?.();
          } catch { /* noop */ }
        }
      });
    }
  } catch { /* noop */ }
  try { stopScan(); } catch { /* noop */ }
  try { DettachNobleEvents(); } catch { /* noop */ }
  try { unregisterIpcHandlers(); } catch { /* noop */ }
};
const norm = (u: string) => (u || "").toLowerCase();
