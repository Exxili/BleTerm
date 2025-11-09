import { BleSection } from "./BleSection";
import { FileCaptureSection } from "./FileCaptureSection";
import { Collapsible } from "./Collapsible";
import { useState } from "react";
import { useBleStore } from "../state/useBleStore";
import UISettingsSection from "./UISettingsSection";

const SettingsSideBar = ({
  isDark,
  onSelectDevice,
  selectedDevice,
  onWritableChange,
  onCreateTab,
}: {
  isDark: boolean;
  onSelectDevice?: (id: string) => void;
  selectedDevice?: string;
  onWritableChange?: (chars: { id: string; uuid: string }[]) => void;
  onCreateTab?: (tab: { id: string; label: string }) => void;
}) => {
  const [bleOpen, setBleOpen] = useState(true);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [uiOpen, setUiOpen] = useState(true);
  const conn = useBleStore((s) => s.connected);

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
        right={conn ? (
          <span className="flex items-center gap-1">
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 9999,
                backgroundColor: "#2f9e44",
                display: "inline-block",
              }}
            />
            <span className="truncate max-w-40" title={conn.name || conn.id}>
              {conn.name || conn.id}
            </span>
          </span>
        ) : undefined}
      >
        <BleSection
          isDark={isDark}
          onSelectDevice={onSelectDevice}
          selectedDevice={selectedDevice}
          onWritableChange={onWritableChange}
          onCreateTab={onCreateTab}
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

      <Collapsible
        title="UI Settings"
        open={uiOpen}
        onToggle={() => setUiOpen((o) => !o)}
        isDark={isDark}
      >
        <UISettingsSection isDark={isDark} />
      </Collapsible>
    </div>
  );
};

export default SettingsSideBar;
