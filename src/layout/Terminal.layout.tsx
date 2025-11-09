import { useState, useEffect, useRef } from "react";
import { useMantineColorScheme } from "@mantine/core";
import { TerminalTabs } from "../components/TerminalTabs";
import { TerminalSendBar } from "../components/TerminalSendBar";
import SettingsSideBar from "../components/SettingsSideBar";
import { ITerminalTab } from "../interfaces/ITerminalTab";
import { ICharacteristic } from "../interfaces/ICharacteristic";

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
  const notifyHandlerRef = useRef<(event: any, data: any) => void>();
  const activeWatchersRef = useRef<Set<string>>(new Set());
  const [tabActivity, setTabActivity] = useState<Record<string, { ts: number; count: number }>>({});

  // Centralized send handler (single and autosend rows call this)
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

  const handleWritableChange = (chars: { id: string; uuid: string }[]) => {
    const mapped: ICharacteristic[] = chars.map((c) => ({ id: c.id, uuid: c.uuid, canWrite: true }));
    setWritable(mapped);
  };

  const handleCreateTab = (tab: { id: string; label: string }) => {
    setTabs((prev) => {
      if (prev.find((t) => t.id === tab.id)) return prev;
      return [...prev, { id: tab.id, label: tab.label }];
    });
    setActiveTab(tab.id);
    // Execute action for read/watch tabs
    const [kind, serviceUuid, charUuid] = tab.id.split(":");
    if (kind === "read" && selectedDevice) {
      (window as any).ble
        .read(selectedDevice, serviceUuid, charUuid)
        .then((hex: string) => {
          appendLine(tab.id, formatLine(`READ ${serviceUuid}/${charUuid}: ${hex}`));
        })
        .catch((e: any) => appendLine(tab.id, formatLine(`READ error: ${e?.message || e}`)));
    }
    if (kind === "watch" && selectedDevice) {
      const key = `${serviceUuid}:${charUuid}`;
      if (!activeWatchersRef.current.has(key)) {
        (window as any).ble
          .notifyStart(selectedDevice, serviceUuid, charUuid)
          .then(() => {
            activeWatchersRef.current.add(key);
            appendLine(tab.id, formatLine(`WATCH started ${serviceUuid}/${charUuid}`));
          })
          .catch((e: any) => appendLine(tab.id, formatLine(`WATCH error: ${e?.message || e}`)));
      } else {
        appendLine(tab.id, formatLine(`WATCH already active ${serviceUuid}/${charUuid}`));
      }
    }
  };

  const appendLine = (tabId: string, line: string) => {
    setTabContent((prev) => {
      const arr = prev[tabId] ? [...prev[tabId], line] : [line];
      return { ...prev, [tabId]: arr.slice(-500) };
    });
  };

  const formatLine = (text: string) => {
    const ts = new Date().toISOString().split("T")[1].replace("Z", "");
    return `[${ts}] ${text}`;
  };

  // Keep a ref to current device to avoid re-registering handler
  const currentDeviceRef = useRef<string>("");
  const lastNotifyRef = useRef<Map<string, { hex: string; ts: number }>>(new Map());
  useEffect(() => {
    currentDeviceRef.current = selectedDevice;
  }, [selectedDevice]);

  // Listen once for notify data and route to matching watch tab
  useEffect(() => {
    const bridge = (window as any)?.ble;
    if (!bridge) return;
    const handler = (_: any, d: any) => {
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
    bridge.on("ble:notify:data", handler);
    return () => bridge.off("ble:notify:data", handler);
  }, []);

  // On disconnect, just clear our local watcher registry; main cleans up subs
  useEffect(() => {
    const bridge = (window as any)?.ble;
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
          isDark={isDark}
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
