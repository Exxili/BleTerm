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

  // Tabs (only console for step 1)
  const [tabs] = useState<ITerminalTab[]>([
    { id: "console", label: "Console" },
  ]);
  const [activeTab, setActiveTab] = useState("console");

  // Step 1: Only scanning (no services/characteristics yet)
  const [selectedDevice, setSelectedDevice] = useState<string>("");

  // Write bar (empty until characteristics exist in later steps)
  const [selectedWriteChar, setSelectedWriteChar] = useState<string>("");
  const [sendValue, setSendValue] = useState<string>("");
  const writable: ICharacteristic[] = [];

  const handleSend = () => {
    if (!selectedWriteChar || !sendValue.trim()) return;
    // Placeholder: will wire in Step 3 (write path)
    setSendValue("");
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
          selectedWriteChar={selectedWriteChar}
          onSelectWriteChar={setSelectedWriteChar}
          value={sendValue}
          onChangeValue={setSendValue}
          onSend={handleSend}
        />
      </div>

      {/* Right: Settings sidebar (scan only for Step 1) */}
      <SettingsSideBar
        isDark={isDark}
        onSelectDevice={setSelectedDevice}
        selectedDevice={selectedDevice}
      />
    </div>
  );
};

export default TerminalLayout;
