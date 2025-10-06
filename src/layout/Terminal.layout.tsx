import { useState } from "react";
import { useMantineColorScheme } from "@mantine/core";
import { TerminalTabs } from "../components/TerminalTabs";
import { TerminalSendBar } from "../components/TerminalSendBar";
import { SettingsSidebar } from "../components/SettingsSideBar";
import type { Characteristic } from "../interfaces/ICharacteristic";
import type { TerminalTab } from "../interfaces/ITerminalTab";

export const TerminalLayout = (): React.JSX.Element => {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  // Tabs (notify/read characteristics + console)
  const [tabs, setTabs] = useState<TerminalTab[]>([
    { id: "console", label: "Console" },
  ]);
  const [activeTab, setActiveTab] = useState("console");

  // Capture
  const [captureEnabled, setCaptureEnabled] = useState(false);
  const [capturePath, setCapturePath] = useState("captures/session.log");
  const [captureFormat, setCaptureFormat] = useState<"raw" | "hex" | "utf8">(
    "raw"
  );

  // BLE state (stubs)
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [selectedDevice, setSelectedDevice] = useState("");
  const [services, setServices] = useState<Array<{ id: string; uuid: string }>>(
    []
  );
  const [selectedService, setSelectedService] = useState("");
  const [characteristics, setCharacteristics] = useState<Characteristic[]>([]);
  const [selectedWriteChar, setSelectedWriteChar] = useState("");
  const [sendValue, setSendValue] = useState("");

  const writable = characteristics.filter((c) => c.canWrite);

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setDevices([
        { id: "dev1", name: "Sensor A" },
        { id: "dev2", name: "Module B" },
      ]);
      setIsScanning(false);
    }, 800);
  };

  const handleSelectDevice = (id: string) => {
    setSelectedDevice(id);
    setServices([
      { id: "svc1", uuid: "180F" },
      { id: "svc2", uuid: "12345678-1234" },
    ]);
    setSelectedService("");
    setCharacteristics([]);
    resetWrite();
  };

  const handleSelectService = (id: string) => {
    setSelectedService(id);
    setCharacteristics([
      { id: "char1", uuid: "2A19", canRead: true, canNotify: true },
      {
        id: "char2",
        uuid: "FFE1",
        canRead: true,
        canNotify: true,
        canWrite: true,
      },
      { id: "char3", uuid: "ABCD-01", canWrite: true },
    ]);
    resetWrite();
  };

  const resetWrite = () => {
    setSelectedWriteChar("");
    setSendValue("");
  };

  const attachCharacteristicTab = (charId: string) => {
    if (!tabs.find((t) => t.id === charId)) {
      const meta = characteristics.find((c) => c.id === charId);
      setTabs((prev) => [
        ...prev,
        { id: charId, label: meta ? meta.uuid : charId },
      ]);
    }
    setActiveTab(charId);
  };

  const handleSend = () => {
    if (!selectedWriteChar || !sendValue.trim()) return;
    // TODO: BLE write bridge
    setSendValue("");
  };

  const clearAll = () => {
    setDevices([]);
    setServices([]);
    setCharacteristics([]);
    setTabs([{ id: "console", label: "Console" }]);
    setActiveTab("console");
    resetWrite();
    setSelectedDevice("");
    setSelectedService("");
  };

  return (
    <div className="w-full h-full flex flex-row overflow-hidden">
      <div className="flex-1 flex flex-col border-r border-gray-600/40 overflow-hidden">
        <TerminalTabs
          isDark={isDark}
          tabs={tabs}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          capture={{
            enabled: captureEnabled,
            format: captureFormat,
            path: capturePath,
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
      <SettingsSidebar
        isDark={isDark}
        // BLE
        ble={{
          isScanning,
          devices,
          services,
          characteristics,
          selectedDevice,
          selectedService,
          selectedWriteChar,
          onScan: handleScan,
          onSelectDevice: handleSelectDevice,
          onSelectService: handleSelectService,
          onAttachCharacteristic: attachCharacteristicTab,
          onSelectWrite: setSelectedWriteChar,
          onClear: clearAll,
          tabs,
          activeTab,
        }}
        // Capture
        capture={{
          enabled: captureEnabled,
          path: capturePath,
          format: captureFormat,
          setEnabled: setCaptureEnabled,
          setPath: setCapturePath,
          setFormat: setCaptureFormat,
        }}
      />
    </div>
  );
};

export default TerminalLayout;
