import { Characteristic } from "../interfaces/ICharacteristic";
import { TerminalTab } from "../interfaces/ITerminalTab";

export const BLESection = ({
  // isDark,
  isScanning,
  devices,
  services,
  characteristics,
  selectedDevice,
  selectedService,
  selectedWriteChar,
  onScan,
  onSelectDevice,
  onSelectService,
  onAttachCharacteristic,
  onSelectWrite,
  onClear,
  tabs,
}: // activeTab,
{
  isDark: boolean;
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
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={onScan}
          className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-xs disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={isScanning}
        >
          {isScanning ? "Scanning..." : "Scan"}
        </button>
        <button
          onClick={onClear}
          className="px-3 py-1 rounded bg-gray-600 hover:bg-gray-500 text-xs"
        >
          Clear
        </button>
      </div>

      <div>
        <SectionTitle>Devices</SectionTitle>
        <div className="space-y-1">
          {devices.map((d) => (
            <button
              key={d.id}
              onClick={() => onSelectDevice(d.id)}
              className={`w-full text-left px-2 py-1 rounded text-xs border ${
                selectedDevice === d.id
                  ? "bg-blue-600 border-blue-500"
                  : "border-gray-600 hover:border-gray-400"
              }`}
            >
              {d.name} <span className="opacity-60 text-[10px]">({d.id})</span>
            </button>
          ))}
          {!devices.length && (
            <div className="text-[11px] opacity-60">No devices</div>
          )}
        </div>
      </div>

      {!!services.length && (
        <div>
          <SectionTitle>Services</SectionTitle>
          <div className="space-y-1">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelectService(s.id)}
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

      {!!characteristics.length && (
        <div>
          <SectionTitle>Characteristics</SectionTitle>
          <div className="space-y-1">
            {characteristics.map((c) => {
              const inTabs = tabs.some((t) => t.id === c.id);
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
                      onClick={() => onAttachCharacteristic(c.id)}
                      className={`px-2 py-0.5 rounded text-[10px] ${
                        inTabs
                          ? "bg-gray-600 cursor-default opacity-60"
                          : "bg-green-700 hover:bg-green-600"
                      }`}
                      disabled={inTabs}
                      title="Open terminal tab"
                    >
                      Tab
                    </button>
                  )}
                  {c.canWrite && (
                    <button
                      onClick={() => onSelectWrite(c.id)}
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
  );
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-1 mb-1 font-semibold text-[11px] opacity-80">
    {children}
  </div>
);
