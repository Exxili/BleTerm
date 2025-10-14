import { useEffect, useState, useCallback } from "react";

interface ScanDevice {
  id: string;
  localName: string;
  rssi: number;
  address?: string;
  connectable?: boolean;
  serviceUuids?: string[];
  manufacturerData?: string;
}

interface Props {
  isDark: boolean;
  onSelectDevice?: (id: string) => void;
  selectedDevice?: string;
}

export const BLEChannels = {
  scanStart: "ble:scan:start",
  scanStop: "ble:scan:stop",
  evtState: "ble:state",
  evtScanResult: "ble:scan:result",
  evtScanFinished: "ble:scan:finished",
  evtError: "ble:error",
} as const;

export const BleSection = ({
  isDark,
  onSelectDevice,
  selectedDevice,
}: Props) => {
  // Guard if preload failed or running outside Electron
  const bridge = (window as any)?.ble;
  const ch = BLEChannels;

  // const [adapterState, setAdapterState] = useState("unknown");
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<ScanDevice[]>([]);
  const [error, setError] = useState<string | null>(null);

  const startScan = useCallback(async () => {
    if (!bridge) return;
    setDevices([]);
    setError(null);
    setScanning(true);
    await bridge.scan();
  }, [bridge]);

  const stopScan = useCallback(async () => {
    if (!bridge) return;
    await bridge.stop();
  }, [bridge]);

  useEffect(() => {
    // Log bridge and channels for debugging
    console.log("BLE Bridge:", bridge);

    console.log("BLE Channels:", ch);

    if (!bridge || !ch) return;
    // const onState = (_: any, d: any) => {
    //   console.log("Adapter state:", d.state);
    //   setAdapterState(d.state);
    // };
    const onResult = (_: any, dev: ScanDevice) =>
      setDevices((prev) =>
        prev.find((p) => p.id === dev.id) ? prev : [...prev, dev]
      );
    const onFinished = () => setScanning(false);
    const onErr = (_: any, d: any) => {
      setError(d.message || "BLE error");
      setScanning(false);
    };

    // bridge.on(ch.evtState, onState);
    bridge.on(ch.evtScanResult, onResult);
    bridge.on(ch.evtScanFinished, onFinished);
    bridge.on(ch.evtError, onErr);
    return () => {
      // bridge.off(ch.evtState, onState);
      bridge.off(ch.evtScanResult, onResult);
      bridge.off(ch.evtScanFinished, onFinished);
      bridge.off(ch.evtError, onErr);
    };
  }, [bridge, ch]);

  if (!bridge || !ch) {
    return (
      <div className="text-xs opacity-60">
        BLE bridge not available (preload not loaded or running outside
        Electron).
      </div>
    );
  }

  return (
    <div className="space-y-4 text-xs">
      <div className="flex justify-between items-center gap-2">
        <button
          onClick={startScan}
          disabled={scanning}
          className={`w-full px-3 py-1 rounded bg-blue-600 hover:bg-blue-500`}
        >
          Scan
        </button>
        <button
          onClick={stopScan}
          disabled={!scanning}
          className={`px-3 py-1 rounded ${
            scanning
              ? "bg-gray-600 hover:bg-gray-500"
              : "bg-gray-700 opacity-50 cursor-not-allowed"
          }`}
        >
          Stop
        </button>
      </div>

      {error && (
        <div
          className={`px-2 py-1 rounded border ${
            isDark
              ? "border-red-500 bg-red-900/30 text-red-300"
              : "border-red-400 bg-red-100 text-red-700"
          }`}
        >
          {error}
        </div>
      )}

      <div>
        <div className="mb-1 font-semibold text-[11px] opacity-80">Devices</div>
        <div className="space-y-1 max-h-56 overflow-auto pr-1">
          {devices.map((d) => {
            const selected = selectedDevice === d.id;
            return (
              <button
                key={d.id}
                onClick={() => onSelectDevice && onSelectDevice(d.id)}
                className={`w-full text-left px-2 py-1 rounded border text-xs truncate ${
                  selected
                    ? "bg-blue-600 border-blue-500"
                    : "border-gray-600 hover:border-gray-400"
                }`}
                title={`${d.localName || "(no name)"} RSSI:${d.rssi}`}
              >
                <div className="flex justify-between">
                  <span>
                    {d.localName || "(no name)"}{" "}
                    <span className="opacity-50 text-[10px]">[{d.id}]</span>
                  </span>
                  <span className="opacity-60">{d.rssi}dBm</span>
                </div>
                {d.serviceUuids && d.serviceUuids.length > 0 && (
                  <div className="opacity-40 text-[9px]">
                    {d.serviceUuids.slice(0, 3).join(",")}
                    {d.serviceUuids.length > 3 && "..."}
                  </div>
                )}
              </button>
            );
          })}
          {!devices.length && (
            <div className="opacity-50 text-[11px]">
              {scanning ? "Scanning..." : "No devices"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
