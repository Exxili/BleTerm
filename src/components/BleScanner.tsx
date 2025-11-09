import { useState, useEffect } from "react";

/**
 * @typedef Device
 * @description Minimal device information for the demo scanner.
 */
interface Device {
  id: string;
  name: string;
  rssi?: number;
}

/**
 * @component BleScanner
 * @description Demo BLE scanner UI that listens for IPC events and renders a
 * list of discovered devices.
 * @returns {JSX.Element}
 */
function BleScanner(): React.JSX.Element {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const startScan = (): void => {
    setIsScanning(true);
    // This would communicate with the main process via IPC
    window.ipcRenderer.send("start-ble-scan");
  };

  const stopScan = (): void => {
    setIsScanning(false);
    // This would communicate with the main process via IPC
    window.ipcRenderer.send("stop-ble-scan");
  };

  useEffect(() => {
    const onBleDeviceDiscovered = (
      _: Electron.IpcRendererEvent,
      device: unknown
    ) => {
      const d = device as Partial<Device> & { id?: string };
      if (!d || !d.id) return;
      // Log the type of device for debugging
      console.log("Discovered device:", d);

      setDevices((prev) => {
        const exists = prev.find((p) => p.id === d.id);
        if (exists) {
          return prev.map((p) => (p.id === d.id ? ({
            id: d.id!,
            name: d.name || p.name,
            rssi: d.rssi ?? p.rssi,
          }) : p));
        }
        return [...prev, { id: d.id!, name: d.name || "", rssi: d.rssi }];
      });
    };

    // Listen for discovered devices
    window.ipcRenderer.on("ble-device-discovered", onBleDeviceDiscovered);

    return () => {
      window.ipcRenderer.off("ble-device-discovered", onBleDeviceDiscovered);
    };
  }, []);

  return (
    <div className="w-full max-w-md mx-auto mt-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          BLE Device Scanner
        </h2>

        <div className="flex gap-2 mb-4">
          <button
            onClick={startScan}
            disabled={isScanning}
            className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            {isScanning ? "Scanning..." : "Start Scan"}
          </button>
          <button
            onClick={stopScan}
            disabled={!isScanning}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Stop Scan
          </button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {devices.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No devices found</p>
          ) : (
            devices.map((device) => (
              <div
                key={device.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-colors duration-150"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800">
                      {device.name || "Unknown Device"}
                    </p>
                    <p className="text-xs text-gray-500">{device.id}</p>
                  </div>
                  {device.rssi && (
                    <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">
                      {device.rssi} dBm
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 text-xs text-gray-400 text-center">
          Found {devices.length} device{devices.length !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}

export default BleScanner;
