export const FileCaptureSection = ({
  // isDark,
  enabled,
  path,
  format,
  setEnabled,
  setPath,
  setFormat,
}: {
  isDark: boolean;
  enabled: boolean;
  path: string;
  format: string;
  setEnabled: (b: boolean) => void;
  setPath: (v: string) => void;
  setFormat: (v: "raw" | "hex" | "utf8") => void;
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          id="captureEnabled"
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="cursor-pointer"
        />
        <label htmlFor="captureEnabled" className="cursor-pointer">
          Enable capture
        </label>
      </div>
      <div>
        <label className="block mb-1 text-[10px] opacity-70">File path</label>
        <input
          value={path}
          onChange={(e) => setPath(e.target.value)}
          className="w-full px-2 py-1 rounded bg-transparent border border-gray-500/50 text-xs"
        />
      </div>
      <div>
        <label className="block mb-1 text-[10px] opacity-70">Format</label>
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value as "raw" | "hex" | "utf8")}
          className="w-full px-2 py-1 rounded bg-transparent border border-gray-500/50 text-xs"
        >
          <option value="raw">raw</option>
          <option value="hex">hex</option>
          <option value="utf8">utf8</option>
        </select>
      </div>
      <button
        disabled={!enabled}
        className={`mt-1 w-full text-xs py-1 rounded ${
          enabled
            ? "bg-green-600 hover:bg-green-500"
            : "bg-gray-600 cursor-not-allowed"
        }`}
      >
        Flush buffer
      </button>
    </div>
  );
};
