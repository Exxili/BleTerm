import { BLESection } from "../components/BleSection";
import { FileCaptureSection } from "../components/FileCaptureSection";
import { useState } from "react";
import { Characteristic } from "../interfaces/ICharacteristic";
import type { TerminalTab } from "../interfaces/ITerminalTab";
import { Collapsible } from "../components/Collapsible";

export const SettingsSidebar = ({
  isDark,
  ble,
  capture,
}: {
  isDark: boolean;
  ble: {
    isScanning: boolean;
    devices: Array<{ id: string; name: string }>;
    services: Array<{ id: string; uuid: string }>;
    characteristics: Characteristic[];
    selectedDevice: string;
    selectedService: string;
    selectedWriteChar: string;
    onScan: () => void;
    onSelectDevice: (id: string) => void;
    onSelectService: (id: string) => void;
    onAttachCharacteristic: (id: string) => void;
    onSelectWrite: (id: string) => void;
    onClear: () => void;
    tabs: TerminalTab[];
    activeTab: string;
  };
  capture: {
    enabled: boolean;
    path: string;
    format: string;
    setEnabled: (b: boolean) => void;
    setPath: (v: string) => void;
    setFormat: (v: "raw" | "hex" | "utf8") => void;
  };
}) => {
  const [bleOpen, setBleOpen] = useState(true);
  const [captureOpen, setCaptureOpen] = useState(false);

  return (
    <div
      className={`w-80 shrink-0 flex flex-col overflow-auto ${
        isDark ? "bg-gray-900" : "bg-gray-100"
      }`}
    >
      <Collapsible
        title="BLE"
        open={bleOpen}
        onToggle={() => setBleOpen((o) => !o)}
        isDark={isDark}
      >
        <BLESection isDark={isDark} {...ble} />
      </Collapsible>

      <Collapsible
        title="File Capture"
        open={captureOpen}
        onToggle={() => setCaptureOpen((o) => !o)}
        isDark={isDark}
      >
        <FileCaptureSection isDark={isDark} {...capture} />
      </Collapsible>
    </div>
  );
};
