import { useEffect } from "react";
import { Button, Badge, Group, Paper, Text, Stack, Loader } from "@mantine/core";
import { useBleStore, BleServiceInfo } from "../state/useBleStore";

interface Props {
  isDark: boolean;
  onSelectDevice?: (id: string) => void;
  selectedDevice?: string;
  onWritableChange?: (chars: { id: string; uuid: string }[]) => void;
  onCreateTab?: (tab: { id: string; label: string }) => void;
}
/**
 * @component BleSection
 * @description Renders connect/scan controls and discovered services/characteristics,
 * backed by the shared BLE store. Emits writable characteristics upward for
 * terminal send controls.
 * @param {object} props React props
 * @param {boolean} props.isDark Whether dark theme is active
 * @param {(id: string) => void} [props.onSelectDevice] Callback for device selection
 * @param {string} [props.selectedDevice] Current device id selection
 * @param {(chars: { id: string; uuid: string }[]) => void} [props.onWritableChange] Emits writable char list
 * @param {(tab: { id: string; label: string }) => void} [props.onCreateTab] Opens read/watch tabs
 * @returns {JSX.Element}
 */
 export const BleSection = ({
  isDark,
  onSelectDevice,
  selectedDevice,
  onWritableChange,
  onCreateTab,
}: Props) => {
  /**
   * BleSection
   * Renders connect/scan controls and discovered services/characteristics,
   * backed by the shared BLE store. Emits writable characteristics upward.
   */
  // Zustand-backed state and actions
  const scanning = useBleStore((s) => s.scanning);
  const devices = useBleStore((s) => s.devices);
  const error = useBleStore((s) => s.error);
  const connected = useBleStore((s) => s.connected);
  const services = useBleStore((s) => s.services);
  const discovering = useBleStore((s) => s.discovering);

  const startScan = useBleStore((s) => s.startScan);
  const connect = useBleStore((s) => s.connect);
  const disconnect = useBleStore((s) => s.disconnect);
  const refreshServices = useBleStore((s) => s.refreshServices);
  const selectDevice = useBleStore((s) => s.selectDevice);

  // Derive and emit writables whenever services change
  useEffect(() => {
    if (!onWritableChange) return;
    const writables = (services || []).flatMap((svc: BleServiceInfo) =>
      (svc.characteristics || [])
        .filter(
          (c) =>
            (c.properties || []).includes("write") ||
            (c.properties || []).includes("writeWithoutResponse")
        )
        .map((c) => ({ id: `${svc.uuid}:${c.uuid}` as string, uuid: c.uuid as string }))
    );
    onWritableChange(writables);
  }, [services, onWritableChange]);

  return (
    <div className="space-y-4 text-xs">
      {!connected ? (
        <div className="flex items-center gap-2">
          <Button onClick={startScan} loading={scanning} fullWidth>
            {scanning ? "Scanning…" : "Scan"}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <Paper withBorder p="xs">
            <Text size="sm" fw={600}>Connected to</Text>
            <Text size="xs" c="dimmed">
              {connected?.name ? (
                <>
                  {connected.name} <span className="opacity-60">[{connected.id}]</span>
                </>
              ) : (
                connected?.id
              )}
            </Text>
          </Paper>
          <Group grow>
            <Button variant="light" onClick={refreshServices}>Refresh services</Button>
            <Button color="red" variant="light" onClick={() => disconnect(connected?.id)}>Disconnect</Button>
          </Group>
          {discovering && (
            <Paper withBorder p="sm">
              <Group gap={8} align="center">
                <Loader size="sm" />
                <Text size="xs">Discovering services and characteristics…</Text>
              </Group>
            </Paper>
          )}
        </div>
      )}

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

      {!connected && (
        <div>
          <div className="mb-1 font-semibold text-[11px] opacity-80">Devices</div>
          <div className="space-y-1 max-h-56 overflow-auto pr-1">
            {devices.map((d) => {
              const selected = selectedDevice === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => {
                    onSelectDevice && onSelectDevice(d.id);
                    selectDevice(d.id);
                  }}
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
          <div className="mt-2">
            <Button onClick={() => connect(selectedDevice)} fullWidth disabled={!selectedDevice} variant="light">
              Connect
            </Button>
          </div>
        </div>
      )}

      {services.length > 0 && (
        <div>
          <div className="mb-1 font-semibold text-[11px] opacity-80">Services</div>
          <div>
            <Stack gap="xs">
              {services.map((s) => (
                <Paper key={s.uuid} p="xs" withBorder>
                  <Text size="xs" fw={600} mb={6}>
                    {s.uuid}
                  </Text>
                  <Stack gap={6}>
                    {(s.characteristics && s.characteristics.length ? s.characteristics : []).map((c) => {
                      const props = new Set(c.properties || []);
                      const canNotify = props.has("notify") || props.has("indicate");
                      const canRead = props.has("read");
                      const label = `${c.uuid}`;
                      return (
                        <Group key={`${s.uuid}:${c.uuid}`} justify="space-between" align="center">
                          <Group gap={6}>
                            {canNotify && <Badge size="xs" color="violet">notify</Badge>}
                            {props.has("indicate") && <Badge size="xs" color="grape">indicate</Badge>}
                            {props.has("write") && <Badge size="xs" color="green">write</Badge>}
                            {props.has("writeWithoutResponse") && <Badge size="xs" color="teal">writeNR</Badge>}
                            {canRead && <Badge size="xs" color="blue">read</Badge>}
                            <Text size="xs" c="dimmed">{label}</Text>
                          </Group>
                          <Group gap={6}>
                            {canNotify && (
                              <Button
                                size="xs"
                                variant="light"
                                onClick={() => onCreateTab && onCreateTab({ id: `watch:${s.uuid}:${c.uuid}` , label: `${c.uuid}` })}
                              >
                                Watch
                              </Button>
                            )}
                            {canRead && (
                              <Button
                                size="xs"
                                variant="light"
                                onClick={() => onCreateTab && onCreateTab({ id: `read:${s.uuid}:${c.uuid}`, label: `Read ${c.uuid}` })}
                              >
                                Read
                              </Button>
                            )}
                          </Group>
                        </Group>
                      );
                    })}
                  </Stack>
                  {(!s.characteristics || s.characteristics.length === 0) && (
                    <Text size="xs" c="dimmed">No characteristics found</Text>
                  )}
                </Paper>
              ))}
            </Stack>
          </div>
        </div>
      )}
    </div>
  );
};
