import { BleSection } from "./BleSection";
import { FileCaptureSection } from "./FileCaptureSection";
import { Collapsible } from "./Collapsible";
import { useState } from "react";

const SettingsSideBar = ({
  isDark,
  onSelectDevice,
  selectedDevice,
}: {
  isDark: boolean;
  onSelectDevice?: (id: string) => void;
  selectedDevice?: string;
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
        <BleSection
          isDark={isDark}
          onSelectDevice={onSelectDevice}
          selectedDevice={selectedDevice}
        />
      </Collapsible>

      <Collapsible
        title="File Capture"
        open={captureOpen}
        onToggle={() => setCaptureOpen((o) => !o)}
        isDark={isDark}
      >
        <FileCaptureSection isDark={isDark} />
      </Collapsible>
    </div>
  );
};

export default SettingsSideBar;
