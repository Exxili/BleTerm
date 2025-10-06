import type { TerminalTab } from "../interfaces/ITerminalTab";

export const TerminalTabs = ({
  isDark,
  tabs,
  activeTab,
  onSelectTab,
  capture,
}: {
  isDark: boolean;
  tabs: TerminalTab[];
  activeTab: string;
  onSelectTab: (id: string) => void;
  capture: { enabled: boolean; format: string; path: string };
}) => {
  return (
    <>
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
              onClick={() => onSelectTab(t.id)}
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
      <div className="flex-1 overflow-auto">
        <div
          className={`w-full h-full font-mono text-xs p-2 ${
            isDark ? "bg-black text-green-400" : "bg-black text-green-400"
          }`}
        >
          <div className="opacity-60 mb-2">
            Tab: {activeTab} | Capture: {capture.enabled ? "on" : "off"} (
            {capture.format}) → {capture.path}
          </div>
          <div>
            Placeholder terminal output...
            <br />
            Future streaming data will appear here.
          </div>
        </div>
      </div>
    </>
  );
};
