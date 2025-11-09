import { create } from "zustand";
import type { StoreApi } from "zustand";

/**
 * @typedef ScanDevice
 * @description Slim device representation emitted during scanning.
 */
export interface ScanDevice {
  id: string;
  localName: string;
  rssi: number;
  address?: string;
  connectable?: boolean;
  serviceUuids?: string[];
  manufacturerData?: string;
}

/**
 * @typedef BleServiceInfo
 * @description Service with characteristic metadata as exposed to the renderer.
 */
export interface BleServiceInfo {
  uuid: string;
  characteristics: Array<{ uuid: string; properties: string[] }>;
}

/**
 * @typedef ConnectedInfo
 * @description Currently connected peripheral id + friendly name.
 */
interface ConnectedInfo {
  id: string;
  name?: string;
}


/**
 * @typedef BleState
 * @description Shared BLE state & actions powering the renderer BLE experience.
 */
interface BleState {
  // state
  scanning: boolean;
  discovering: boolean;
  devices: ScanDevice[];
  services: BleServiceInfo[];
  error: string | null;
  selectedDevice: string | null;
  connected: ConnectedInfo | null;

  // actions
  selectDevice: (id: string | null) => void;
  startScan: () => Promise<void>;
  stopScan: () => Promise<void>;
  connect: (id?: string | null) => Promise<void>;
  disconnect: (id?: string | null) => Promise<void>;
  refreshServices: () => Promise<void>;
}

const SCAN_MS = 5000;
let bridgeListenersAttached = false as boolean;
let stopTimer: number | null = null;

type BleIpcListener<T = unknown> = (event: unknown, data: T) => void;
/**
 * @typedef BleBridge
 * @description IPC bridge interface exposed by preload to the renderer.
 */
interface BleBridge {
  scan: () => Promise<void>;
  stop: () => Promise<void>;
  connect: (id: string) => Promise<{ id: string; localName?: string }>;
  disconnect: (id: string) => Promise<void>;
  services: (id: string) => Promise<BleServiceInfo[]>;
  on: <T = unknown>(channel: string, listener: BleIpcListener<T>) => void;
  off: <T = unknown>(channel: string, listener: BleIpcListener<T>) => void;
}

const bridge: BleBridge | undefined = ((): BleBridge | undefined => (window as unknown as { ble?: BleBridge })?.ble)();

/**
 * @function ensureBridgeListeners
 * @description Attaches singleton IPC listeners to keep store in sync with the
 * main process BLE events.
 * @param {StoreApi<BleState>["setState"]} set Zustand setState function
 * @returns {void}
 */
const ensureBridgeListeners = (set: StoreApi<BleState>["setState"]) => {
  if (bridgeListenersAttached || !bridge) return;

  const onResult = (_: unknown, dev: ScanDevice) => {
    set((st: BleState) => {
      if (st.devices.find((d) => d.id === dev.id)) return {};
      return { devices: [...st.devices, dev] };
    });
  };
  const onFinished = () => {
    if (stopTimer) {
      window.clearTimeout(stopTimer);
      stopTimer = null;
    }
    set({ scanning: false });
  };
  const onErr = (_: unknown, d: unknown) => {
    const msg = (d as { message?: string })?.message || "BLE error";
    set({ error: msg, scanning: false, discovering: false });
  };
  const onConnected = (_: unknown, d: unknown) => {
    const payload = d as { id?: string; localName?: string };
    set({ connected: { id: payload?.id as string, name: payload?.localName }, selectedDevice: payload?.id || null });
  };
  const onDisconnected = (_: unknown, d: unknown) => {
    const payload = d as { id?: string };
    set((st: BleState) => {
      if (!st.connected || st.connected.id !== payload?.id) return {};
      return { connected: null, services: [], discovering: false };
    });
  };

  bridge.on<ScanDevice>("ble:scan:result", onResult);
  bridge.on("ble:scan:finished", onFinished);
  bridge.on("ble:error", onErr);
  bridge.on<{ id?: string; localName?: string }>("ble:connected", onConnected);
  bridge.on<{ id?: string }>("ble:disconnected", onDisconnected);
  bridgeListenersAttached = true;
};

/**
 * @function useBleStore
 * @description Global BLE store. Prefer using these actions instead of calling
 * the bridge directly from components.
 * @returns {import('zustand').UseBoundStore<StoreApi<BleState>>}
 */
export const useBleStore = create<BleState>((set, get) => ({
  scanning: false,
  discovering: false,
  devices: [],
  services: [],
  error: null,
  selectedDevice: null,
  connected: null,

  /**
   * Select a device id (used by the Connect action when no arg provided).
   */
  selectDevice: (id) => set({ selectedDevice: id }),

  /** @description Start scanning; auto-stop after SCAN_MS. */
  startScan: async () => {
    ensureBridgeListeners(set);
    if (!bridge) return;
    if (get().scanning) return;
    set({ devices: [], error: null, scanning: true });
    await bridge.scan();
    if (stopTimer) window.clearTimeout(stopTimer);
    stopTimer = window.setTimeout(() => {
      bridge.stop();
    }, SCAN_MS);
  },

  /** @description Stop scanning immediately. */
  stopScan: async () => {
    if (!bridge) return;
    await bridge.stop();
    if (stopTimer) {
      window.clearTimeout(stopTimer);
      stopTimer = null;
    }
    set({ scanning: false });
  },

  /**
   * @description Connect to a device by id (or selectedDevice) and refresh services.
   * @param {string|null} [id] Device id to connect (defaults to selectedDevice)
   */
  connect: async (id?: string | null) => {
    ensureBridgeListeners(set);
    if (!bridge) return;
    const toConnect = id ?? get().selectedDevice;
    if (!toConnect) return;
    try {
      const info = await bridge.connect(toConnect);
      set({ connected: { id: info?.id ?? toConnect, name: info?.localName }, selectedDevice: (info?.id ?? toConnect) });
    } catch (e) {
      // benign already-connected case shouldn't break flow
      const msg = (e as { message?: string })?.message || String(e || "");
      if (!/already connected/i.test(msg)) {
        set({ error: msg });
        throw e;
      }
    } finally {
      await get().refreshServices();
    }
  },

  /** @description Disconnect from the current device (or provided id). */
  disconnect: async (id?: string | null) => {
    if (!bridge) return;
    const cur = id ?? get().connected?.id;
    if (!cur) return;
    await bridge.disconnect(cur);
    set({ connected: null, services: [], discovering: false });
  },

  /** @description Fetch and populate services/characteristics for the current device. */
  refreshServices: async () => {
    if (!bridge) return;
    const cur = get().connected?.id;
    if (!cur) return;
    set({ discovering: true, services: [] });
    try {
      const svc = await bridge.services(cur);
      set({ services: svc });
    } catch (e) {
      set({ error: (e as { message?: string })?.message || String(e) });
    } finally {
      set({ discovering: false });
    }
  },
}));
