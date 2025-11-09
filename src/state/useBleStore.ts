import { create } from "zustand";

export interface ScanDevice {
  id: string;
  localName: string;
  rssi: number;
  address?: string;
  connectable?: boolean;
  serviceUuids?: string[];
  manufacturerData?: string;
}

export interface BleServiceInfo {
  uuid: string;
  characteristics: Array<{ uuid: string; properties: string[] }>;
}

interface ConnectedInfo {
  id: string;
  name?: string;
}

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

const bridge = ((): any => (window as any)?.ble)();

const ensureBridgeListeners = (set: any, get: any) => {
  if (bridgeListenersAttached || !bridge) return;

  const onResult = (_: any, dev: ScanDevice) => {
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
  const onErr = (_: any, d: any) => {
    set({ error: d?.message || "BLE error", scanning: false, discovering: false });
  };
  const onConnected = (_: any, d: any) => {
    set({ connected: { id: d?.id, name: d?.localName }, selectedDevice: d?.id || null });
  };
  const onDisconnected = (_: any, d: any) => {
    set((st: BleState) => {
      if (!st.connected || st.connected.id !== d?.id) return {};
      return { connected: null, services: [], discovering: false };
    });
  };

  bridge.on("ble:scan:result", onResult);
  bridge.on("ble:scan:finished", onFinished);
  bridge.on("ble:error", onErr);
  bridge.on("ble:connected", onConnected);
  bridge.on("ble:disconnected", onDisconnected);
  bridgeListenersAttached = true;
};

export const useBleStore = create<BleState>((set, get) => ({
  scanning: false,
  discovering: false,
  devices: [],
  services: [],
  error: null,
  selectedDevice: null,
  connected: null,

  selectDevice: (id) => set({ selectedDevice: id }),

  startScan: async () => {
    ensureBridgeListeners(set, get);
    if (!bridge) return;
    if (get().scanning) return;
    set({ devices: [], error: null, scanning: true });
    await bridge.scan();
    if (stopTimer) window.clearTimeout(stopTimer);
    stopTimer = window.setTimeout(() => {
      bridge.stop();
    }, SCAN_MS);
  },

  stopScan: async () => {
    if (!bridge) return;
    await bridge.stop();
    if (stopTimer) {
      window.clearTimeout(stopTimer);
      stopTimer = null;
    }
    set({ scanning: false });
  },

  connect: async (id?: string | null) => {
    ensureBridgeListeners(set, get);
    if (!bridge) return;
    const toConnect = id ?? get().selectedDevice;
    if (!toConnect) return;
    try {
      const info = await bridge.connect(toConnect);
      set({ connected: { id: info?.id ?? toConnect, name: info?.localName }, selectedDevice: info?.id ?? toConnect });
    } catch (e: any) {
      // benign already-connected case shouldn't break flow
      const msg = e?.message || String(e || "");
      if (!/already connected/i.test(msg)) {
        set({ error: msg });
        throw e;
      }
    } finally {
      await get().refreshServices();
    }
  },

  disconnect: async (id?: string | null) => {
    if (!bridge) return;
    const cur = id ?? get().connected?.id;
    if (!cur) return;
    await bridge.disconnect(cur);
    set({ connected: null, services: [], discovering: false });
  },

  refreshServices: async () => {
    if (!bridge) return;
    const cur = get().connected?.id;
    if (!cur) return;
    set({ discovering: true, services: [] });
    try {
      const svc = await bridge.services(cur);
      set({ services: svc });
    } catch (e: any) {
      set({ error: e?.message || String(e) });
    } finally {
      set({ discovering: false });
    }
  },
}));

