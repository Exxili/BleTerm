import { BleSection } from "./BleSection";
import { FileCaptureSection } from "./FileCaptureSection";
import { Collapsible } from "./Collapsible";
import { useState } from "react";
import { useBleStore } from "../state/useBleStore";
import UISettingsSection from "./UISettingsSection";

/**
 * @component SettingsSideBar
 * @description Collapsible sidebar hosting BLE controls, file capture settings,
 * and UI options.
 * @param {object} props React props
 * @param {boolean} props.isDark Whether dark theme is active
 * @param {(id: string) => void} [props.onSelectDevice] Callback when a device is picked
 * @param {string} [props.selectedDevice] Currently selected device id
 * @param {(chars: { id: string; uuid: string }[]) => void} [props.onWritableChange] Emits writable chars
 * @param {(tab: { id: string; label: string }) => void} [props.onCreateTab] Request to open a watch/read tab
 * @returns {JSX.Element}
 */
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
  // Local file capture state (placeholder until wired elsewhere)
  const [capEnabled, setCapEnabled] = useState(false);
  const [capPath, setCapPath] = useState("captures/session.log");
  const [capFormat, setCapFormat] = useState<"raw" | "hex" | "utf8">("raw");

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
        <FileCaptureSection
          isDark={isDark}
          enabled={capEnabled}
          path={capPath}
          format={capFormat}
          setEnabled={setCapEnabled}
          setPath={setCapPath}
          setFormat={setCapFormat}
        />
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
