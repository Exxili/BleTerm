import { useState, useEffect, useRef } from "react";
import { useMantineColorScheme } from "@mantine/core";
import { TerminalTabs } from "../components/TerminalTabs";
import { TerminalSendBar } from "../components/TerminalSendBar";
import SettingsSideBar from "../components/SettingsSideBar";
import { ITerminalTab } from "../interfaces/ITerminalTab";
import { ICharacteristic } from "../interfaces/ICharacteristic";

/**
 * @component TerminalLayout
 * @description Renders the main two‑pane view (Terminal area + BLE settings)
 * and orchestrates terminal tabs, content, and BLE watch/read actions via the
 * preload‑exposed BLE bridge.
 * @returns {JSX.Element}
 */
const TerminalLayout = (): React.JSX.Element => {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  // Tabs
  const [tabs, setTabs] = useState<ITerminalTab[]>([
    { id: "console", label: "Console" },
  ]);
  const [activeTab, setActiveTab] = useState("console");

  // Selected device (from BLE sidebar)
  const [selectedDevice, setSelectedDevice] = useState<string>("");

  // Writable chars (will be filled in Step 3 when we wire services/chars)
  const [writable, setWritable] = useState<ICharacteristic[]>([]);
  const [tabContent, setTabContent] = useState<Record<string, string[]>>({});
  const activeWatchersRef = useRef<Set<string>>(new Set());
  const [tabActivity, setTabActivity] = useState<Record<string, { ts: number; count: number }>>({});

  // Centralized send handler (single and autosend rows call this)
  /**
   * @function handleSend
   * @description Central send entry used by single‑shot and timed send rows.
   * @param {string|undefined} deviceId Currently selected device id
   * @param {string} characteristicId Service:Characteristic identifier
   * @param {string} value Payload to send
   * @returns {void}
   */
  const handleSend = (
    deviceId: string | undefined,
    characteristicId: string,
    value: string
  ) => {
    if (!deviceId || !characteristicId || !value.trim()) return;
    // TODO Step 3: implement BLE write via window.ble.write(...)
    // For now, just a placeholder
    console.log("Send:", { deviceId, characteristicId, value });
  };

  /**
   * @function handleWritableChange
   * @description Receives a list of write‑capable (service:char) ids and exposes
   * them to the send bar.
   * @param {{ id: string; uuid: string }[]} chars Write‑capable characteristic ids
   * @returns {void}
   */
  const handleWritableChange = (chars: { id: string; uuid: string }[]) => {
    const mapped: ICharacteristic[] = chars.map((c) => ({ id: c.id, uuid: c.uuid, canWrite: true }));
    setWritable(mapped);
  };

  /**
   * @function handleCreateTab
   * @description Creates a new tab and performs side effects for read/watch tabs
   * via the BLE bridge.
   * @param {{ id: string; label: string }} tab Tab descriptor
   * @returns {void}
   */
  const handleCreateTab = (tab: { id: string; label: string }) => {
    setTabs((prev) => {
      if (prev.find((t) => t.id === tab.id)) return prev;
      return [...prev, { id: tab.id, label: tab.label }];
    });
    setActiveTab(tab.id);
    // Execute action for read/watch tabs
    const [kind, serviceUuid, charUuid] = tab.id.split(":");
    // Guard: only perform read/watch if a device is selected
    if (!selectedDevice) return;

    if (kind === "read") {
      const ble = (window as unknown as {
        ble?: { read: (id: string, s: string, c: string) => Promise<string> };
      }).ble;
      if (!ble) return;
      ble
        .read(selectedDevice, serviceUuid, charUuid)
        .then((hex: string) => {
          appendLine(tab.id, formatLine(`READ ${serviceUuid}/${charUuid}: ${hex}`));
        })
        .catch((e: unknown) => {
          const msg = (e as { message?: string })?.message || String(e);
          appendLine(tab.id, formatLine(`READ error: ${msg}`));
        });
    }
    if (kind === "watch") {
      const key = `${serviceUuid}:${charUuid}`;
      if (!activeWatchersRef.current.has(key)) {
        const ble = (window as unknown as {
          ble?: { notifyStart: (id: string, s: string, c: string) => Promise<void> };
        }).ble;
        if (!ble) return;
        ble
          .notifyStart(selectedDevice, serviceUuid, charUuid)
          .then(() => {
            activeWatchersRef.current.add(key);
            appendLine(tab.id, formatLine(`WATCH started ${serviceUuid}/${charUuid}`));
          })
          .catch((e: unknown) => {
            const msg = (e as { message?: string })?.message || String(e);
            appendLine(tab.id, formatLine(`WATCH error: ${msg}`));
          });
      } else {
        appendLine(tab.id, formatLine(`WATCH already active ${serviceUuid}/${charUuid}`));
      }
    }
  };

  /**
   * @function appendLine
   * @description Appends a line to the given tab, keeping a rolling buffer.
   * @param {string} tabId Tab identifier
   * @param {string} line Text line to append
   * @returns {void}
   */
  const appendLine = (tabId: string, line: string) => {
    setTabContent((prev) => {
      const arr = prev[tabId] ? [...prev[tabId], line] : [line];
      return { ...prev, [tabId]: arr.slice(-500) };
    });
  };

  /**
   * @function formatLine
   * @description Adds a short ISO time prefix to a message line.
   * @param {string} text Raw message text
   * @returns {string}
   */
  const formatLine = (text: string) => {
    const ts = new Date().toISOString().split("T")[1].replace("Z", "");
    return `[${ts}] ${text}`;
  };

  /**
   * @description Keep a ref to the current device id to avoid re‑registering
   * event handlers on every selection change.
   */
  const currentDeviceRef = useRef<string>("");
  const lastNotifyRef = useRef<Map<string, { hex: string; ts: number }>>(new Map());
  useEffect(() => {
    currentDeviceRef.current = selectedDevice;
  }, [selectedDevice]);

  /**
   * @description Listen once for notify data and route to matching watch tab.
   */
  useEffect(() => {
    const bridge = (window as unknown as {
      ble?: { on: <T = unknown>(c: string, l: (e: unknown, d: T) => void) => void; off: <T = unknown>(c: string, l: (e: unknown, d: T) => void) => void };
    }).ble;
    if (!bridge) return;
    type NotifyData = { peripheralId: string; serviceUuid: string; charUuid: string; data: string };
    /** @description Handle incoming characteristic notifications for the active device. */
    const handler = (_: unknown, d: NotifyData) => {
      if (!d) return;
      const cur = currentDeviceRef.current;
      if (cur && d.peripheralId !== cur) return;
      const key = `${d.serviceUuid}:${d.charUuid}`;
      const now = Date.now();
      const prev = lastNotifyRef.current.get(key);
      if (prev && prev.hex === d.data && now - prev.ts < 120) {
        return; // drop rapid duplicate for same value
      }
      lastNotifyRef.current.set(key, { hex: d.data, ts: now });
      const tabId = `watch:${d.serviceUuid}:${d.charUuid}`;
      const line = formatLine(`NOTIFY ${d.serviceUuid}/${d.charUuid}: ${d.data}`);
      appendLine(tabId, line);
      setTabActivity((prev) => {
        const prevA = prev[tabId];
        const count = (prevA?.count || 0) + 1;
        return { ...prev, [tabId]: { ts: Date.now(), count } };
      });
    };
    bridge.on<NotifyData>("ble:notify:data", handler);
    return () => bridge.off<NotifyData>("ble:notify:data", handler);
  }, []);

  /**
   * @description On disconnect, clear the local watcher registry. The main
   * process is responsible for cleaning up noble subscriptions.
   */
  useEffect(() => {
    const bridge = (window as unknown as {
      ble?: { on: (c: string, l: (e: unknown) => void) => void; off: (c: string, l: (e: unknown) => void) => void };
    }).ble;
    if (!bridge) return;
    const onDisc = () => {
      activeWatchersRef.current.clear();
    };
    bridge.on("ble:disconnected", onDisc);
    return () => bridge.off("ble:disconnected", onDisc);
  }, []);

  return (
    <div className="w-full h-full flex flex-row overflow-hidden">
      {/* Left: Terminal area */}
      <div className="flex-1 flex flex-col border-r border-gray-600/40 overflow-hidden">
        <div className="flex-1 min-h-0 overflow-hidden">
        <TerminalTabs
          isDark={isDark}
          tabs={tabs}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          capture={{
            enabled: false,
            format: "raw",
            path: "captures/session.log",
          }}
          content={tabContent[activeTab] || []}
          activity={tabActivity}
        />
        </div>

        <TerminalSendBar
          writable={writable}
          selectedDevice={selectedDevice}
          onSend={handleSend}
        />
      </div>

      {/* Right: Settings sidebar */}
      <SettingsSideBar
        isDark={isDark}
        onSelectDevice={setSelectedDevice}
        selectedDevice={selectedDevice}
        onWritableChange={handleWritableChange}
        onCreateTab={handleCreateTab}
      />
    </div>
  );
};

export default TerminalLayout;
