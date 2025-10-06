import { useMantineColorScheme } from "@mantine/core";
import { useState } from "react";

/**
 * TerminalLayout
 * Left: terminal tabs (one per characteristic in future)
 * Right: settings (BLE + File capture etc.)
 */
const TerminalLayout = (): React.JSX.Element => {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  // Tabs
  const [tabs, setTabs] = useState<Array<{ id: string; label: string }>>([
    { id: "console", label: "Console" },
  ]);
  const [activeTab, setActiveTab] = useState<string>("console");

  // File capture
  const [captureEnabled, setCaptureEnabled] = useState(false);
  const [capturePath, setCapturePath] = useState("captures/session.log");
  const [captureFormat, setCaptureFormat] = useState<"raw" | "hex" | "utf8">(
    "raw"
  );

  // BLE
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [services, setServices] = useState<Array<{ id: string; uuid: string }>>(
    []
  );
  const [selectedService, setSelectedService] = useState<string>("");

  interface Characteristic {
    id: string;
    uuid: string;
    canWrite?: boolean;
    canNotify?: boolean;
    canRead?: boolean;
  }
  const [characteristics, setCharacteristics] = useState<Characteristic[]>([]);
  const [selectedCharacteristic, setSelectedCharacteristic] =
    useState<string>("");

  // Write bar
  const writableCharacteristics = characteristics.filter((c) => c.canWrite);
  const [selectedWriteChar, setSelectedWriteChar] = useState<string>("");
  const [sendValue, setSendValue] = useState<string>("");

  // Collapsibles
  const [bleOpen, setBleOpen] = useState(true);
  const [captureOpen, setCaptureOpen] = useState(false);

  const handleScan = async () => {
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
    setSelectedCharacteristic("");
    setSelectedWriteChar("");
  };

  const handleSelectService = (id: string) => {
    setSelectedService(id);
    setCharacteristics([
      {
        id: "char1",
        uuid: "2A19",
        canRead: true,
        canNotify: true,
        canWrite: false,
      },
      {
        id: "char2",
        uuid: "FFE1",
        canRead: true,
        canNotify: true,
        canWrite: true,
      },
      {
        id: "char3",
        uuid: "ABCD-01",
        canRead: false,
        canNotify: false,
        canWrite: true,
      },
    ]);
    setSelectedCharacteristic("");
    setSelectedWriteChar("");
  };

  const handleAttachCharacteristic = (charId: string) => {
    setSelectedCharacteristic(charId);
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
    // TODO: actual write
    setSendValue("");
  };

  return (
    <div className="w-full h-full flex flex-row overflow-hidden">
      {/* Terminal / Tabs Pane */}
      <div className="flex-1 flex flex-col border-r border-gray-600/40 overflow-hidden">
        {/* Tabs */}
        <div
          className={`flex items-stretch text-xs ${
            isDark ? "bg-gray-900" : "bg-gray-200"
          } border-b border-gray-600/40`}
          style={{ WebkitAppRegion: "no-drag" }}
        >
          {tabs.map((t) => {
            const active = t.id === activeTab;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-3 h-8 flex items-center gap-2 border-r border-gray-600/30
                ${
                  active
                    ? isDark
                      ? "bg-black text-green-400"
                      : "bg-white text-blue-600"
                    : isDark
                    ? "text-gray-400 hover:text-gray-200"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        {/* Active tab content */}
        <div className="flex-1 overflow-auto">
          <TerminalTabContent
            tabId={activeTab}
            isDark={isDark}
            capture={{
              enabled: captureEnabled,
              format: captureFormat,
              path: capturePath,
            }}
          />
        </div>
        {/* Send bar */}
        <div
          className={`flex items-center gap-2 px-2 py-2 border-t text-xs ${
            isDark
              ? "bg-gray-900 border-gray-700"
              : "bg-gray-100 border-gray-300"
          }`}
          style={{ WebkitAppRegion: "no-drag" }}
        >
          <select
            className={`px-2 py-1 rounded border bg-transparent ${
              isDark
                ? "border-gray-600 text-gray-200"
                : "border-gray-400 text-gray-800"
            }`}
            value={selectedWriteChar}
            onChange={(e) => setSelectedWriteChar(e.target.value)}
          >
            <option value="">Select write characteristic</option>
            {writableCharacteristics.map((c) => (
              <option key={c.id} value={c.id}>
                {c.uuid}
              </option>
            ))}
          </select>
          <input
            className={`flex-1 px-2 py-1 rounded border bg-transparent font-mono ${
              isDark
                ? "border-gray-600 text-green-300 placeholder-gray-500"
                : "border-gray-400 text-gray-800 placeholder-gray-500"
            }`}
            placeholder="Enter data..."
            value={sendValue}
            onChange={(e) => setSendValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={!selectedWriteChar}
          />
          <button
            onClick={handleSend}
            disabled={!selectedWriteChar || !sendValue.trim()}
            className={`px-3 py-1 rounded text-xs font-semibold ${
              !selectedWriteChar || !sendValue.trim()
                ? "bg-gray-600 cursor-not-allowed opacity-60"
                : "bg-green-600 hover:bg-green-500"
            }`}
          >
            Send
          </button>
        </div>
      </div>

      {/* Settings Sidebar */}
      <div
        className={`w-80 shrink-0 flex flex-col overflow-auto ${
          isDark ? "bg-gray-900" : "bg-gray-100"
        }`}
      >
        {/* BLE Section (open) */}
        <CollapsibleHeader
          title="BLE"
          open={bleOpen}
          onToggle={() => setBleOpen((o) => !o)}
          isDark={isDark}
        />
        {bleOpen && (
          <div className="px-3 pb-4 border-b border-gray-700/40 text-xs space-y-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handleScan}
                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isScanning}
              >
                {isScanning ? "Scanning..." : "Scan"}
              </button>
              <button
                className="px-3 py-1 rounded bg-gray-600 hover:bg-gray-500 text-xs"
                onClick={() => {
                  setDevices([]);
                  setServices([]);
                  setCharacteristics([]);
                  setSelectedDevice("");
                  setSelectedService("");
                  setSelectedCharacteristic("");
                  setTabs([{ id: "console", label: "Console" }]);
                  setActiveTab("console");
                  setSelectedWriteChar("");
                }}
              >
                Clear
              </button>
            </div>

            <div>
              <SubTitle>Devices</SubTitle>
              <div className="space-y-1">
                {devices.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => handleSelectDevice(d.id)}
                    className={`w-full text-left px-2 py-1 rounded text-xs border ${
                      selectedDevice === d.id
                        ? "bg-blue-600 border-blue-500"
                        : "border-gray-600 hover:border-gray-400"
                    }`}
                  >
                    {d.name}{" "}
                    <span className="opacity-60 text-[10px]">({d.id})</span>
                  </button>
                ))}
                {!devices.length && (
                  <div className="text-[11px] opacity-60">No devices</div>
                )}
              </div>
            </div>

            {services.length > 0 && (
              <div>
                <SubTitle>Services</SubTitle>
                <div className="space-y-1">
                  {services.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSelectService(s.id)}
                      className={`w-full text-left px-2 py-1 rounded text-xs border ${
                        selectedService === s.id
                          ? "bg-indigo-600 border-indigo-500"
                          : "border-gray-600 hover:border-gray-400"
                      }`}
                    >
                      {s.uuid}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {characteristics.length > 0 && (
              <div>
                <SubTitle>Characteristics</SubTitle>
                <div className="space-y-1">
                  {characteristics.map((c) => {
                    const isInTabs = tabs.some((t) => t.id === c.id);
                    return (
                      <div
                        key={c.id}
                        className="flex items-center gap-2 border border-gray-600 rounded px-2 py-1"
                      >
                        <div className="flex-1 text-left">
                          <div className="text-[11px]">{c.uuid}</div>
                          <div className="text-[9px] opacity-50">
                            {(c.canNotify && "notify ") || ""}
                            {(c.canRead && "read ") || ""}
                            {(c.canWrite && "write ") || ""}
                          </div>
                        </div>
                        {(c.canNotify || c.canRead) && (
                          <button
                            onClick={() => handleAttachCharacteristic(c.id)}
                            className={`px-2 py-0.5 rounded text-[10px] ${
                              isInTabs
                                ? "bg-gray-600 cursor-default opacity-60"
                                : "bg-green-700 hover:bg-green-600"
                            }`}
                            disabled={isInTabs}
                            title="Open terminal tab"
                          >
                            Tab
                          </button>
                        )}
                        {c.canWrite && (
                          <button
                            onClick={() => setSelectedWriteChar(c.id)}
                            className={`px-2 py-0.5 rounded text-[10px] ${
                              selectedWriteChar === c.id
                                ? "bg-blue-700"
                                : "bg-blue-600 hover:bg-blue-500"
                            }`}
                            title="Select for write"
                          >
                            Send
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* File Capture Section (collapsed by default) */}
        <CollapsibleHeader
          title="File Capture"
          open={captureOpen}
          onToggle={() => setCaptureOpen((o) => !o)}
          isDark={isDark}
        />
        {captureOpen && (
          <div className="px-3 pb-4 border-b border-gray-700/40 text-xs space-y-3">
            <div className="flex items-center gap-2">
              <input
                id="captureEnabled"
                type="checkbox"
                checked={captureEnabled}
                onChange={(e) => setCaptureEnabled(e.target.checked)}
                className="cursor-pointer"
              />
              <label htmlFor="captureEnabled" className="cursor-pointer">
                Enable capture
              </label>
            </div>
            <div>
              <label className="block mb-1 text-[10px] opacity-70">
                File path
              </label>
              <input
                value={capturePath}
                onChange={(e) => setCapturePath(e.target.value)}
                className="w-full px-2 py-1 rounded bg-transparent border border-gray-500/50 text-xs"
              />
            </div>
            <div>
              <label className="block mb-1 text-[10px] opacity-70">
                Format
              </label>
              <select
                value={captureFormat}
                onChange={(e) =>
                  setCaptureFormat(e.target.value as typeof captureFormat)
                }
                className="w-full px-2 py-1 rounded bg-transparent border border-gray-500/50 text-xs"
              >
                <option value="raw">raw</option>
                <option value="hex">hex</option>
                <option value="utf8">utf8</option>
              </select>
            </div>
            <button
              disabled={!captureEnabled}
              className={`mt-1 w-full text-xs py-1 rounded ${
                captureEnabled
                  ? "bg-green-600 hover:bg-green-500"
                  : "bg-gray-600 cursor-not-allowed"
              }`}
            >
              Flush buffer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TerminalLayout;

/* ------------ Helper Components ------------ */

const CollapsibleHeader = ({
  title,
  open,
  onToggle,
  isDark,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  isDark: boolean;
}) => (
  <button
    onClick={onToggle}
    className={`w-full flex items-center justify-between px-3 h-9 text-xs font-semibold tracking-wide border-b ${
      isDark
        ? "bg-gray-800 hover:bg-gray-750 border-gray-700 text-gray-200"
        : "bg-gray-200 hover:bg-gray-300 border-gray-300 text-gray-800"
    }`}
  >
    <span className="uppercase text-[10px]">{title}</span>
    <span className="text-[11px]">{open ? "▾" : "▸"}</span>
  </button>
);

const SubTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-1 mb-1 font-semibold text-[11px] opacity-80">
    {children}
  </div>
);

const TerminalTabContent = ({
  tabId,
  isDark,
  capture,
}: {
  tabId: string;
  isDark: boolean;
  capture: { enabled: boolean; path: string; format: string };
}) => {
  return (
    <div
      className={`w-full h-full font-mono text-xs p-2 ${
        isDark ? "bg-black text-green-400" : "bg-black text-green-400"
      }`}
    >
      <div className="opacity-60 mb-2">
        Tab: {tabId} | Capture: {capture.enabled ? "on" : "off"} (
        {capture.format}) → {capture.path}
      </div>
      <div>
        Placeholder terminal output...
        <br />
        Future streaming data will appear here.
      </div>
    </div>
  );
};
