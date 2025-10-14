import { useState } from "react";
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
  const [tabs] = useState<ITerminalTab[]>([
    { id: "console", label: "Console" },
  ]);
  const [activeTab, setActiveTab] = useState("console");

  // Selected device (from BLE sidebar)
  const [selectedDevice, setSelectedDevice] = useState<string>("");

  // Writable chars (will be filled in Step 3 when we wire services/chars)
  const writable: ICharacteristic[] = [];

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

  return (
    <div className="w-full h-full flex flex-row overflow-hidden">
      {/* Left: Terminal area */}
      <div className="flex-1 flex flex-col border-r border-gray-600/40 overflow-hidden">
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
        />

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
      />
    </div>
  );
};

export default TerminalLayout;
