import type { Characteristic } from "../interfaces/ICharacteristic";

export const TerminalSendBar = ({
  isDark,
  writable,
  selectedWriteChar,
  onSelectWriteChar,
  value,
  onChangeValue,
  onSend,
}: {
  isDark: boolean;
  writable: Characteristic[];
  selectedWriteChar: string;
  onSelectWriteChar: (id: string) => void;
  value: string;
  onChangeValue: (v: string) => void;
  onSend: () => void;
}) => {
  return (
    <div
      className={`flex items-center gap-2 px-2 py-2 border-t text-xs ${
        isDark ? "bg-gray-900 border-gray-700" : "bg-gray-100 border-gray-300"
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
        onChange={(e) => onSelectWriteChar(e.target.value)}
      >
        <option value="">Select write characteristic</option>
        {writable.map((c) => (
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
        value={value}
        onChange={(e) => onChangeValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSend()}
        disabled={!selectedWriteChar}
      />
      <button
        onClick={onSend}
        disabled={!selectedWriteChar || !value.trim()}
        className={`px-3 py-1 rounded text-xs font-semibold ${
          !selectedWriteChar || !value.trim()
            ? "bg-gray-600 cursor-not-allowed opacity-60"
            : "bg-green-600 hover:bg-green-500"
        }`}
      >
        Send
      </button>
    </div>
  );
};
