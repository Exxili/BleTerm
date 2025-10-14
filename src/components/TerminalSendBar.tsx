import { useEffect, useRef, useState } from "react";
import type { ICharacteristic } from "../interfaces/ICharacteristic";

interface SendRow {
  id: string;
  characteristicId: string;
  value: string;
  delayMs: number;
  repeatCount: number;
  running: boolean;
  runningMode?: "hex" | "ascii";
}

export const TerminalSendBar = ({
  isDark,
  writable,
  selectedDevice,
  onSend,
}: {
  isDark: boolean;
  writable: ICharacteristic[];
  selectedDevice?: string;
  onSend: (
    deviceId: string | undefined,
    characteristicId: string,
    value: string
  ) => void;
}) => {
  const [rows, setRows] = useState<SendRow[]>([
    {
      id: crypto.randomUUID(),
      characteristicId: "",
      value: "",
      delayMs: 1000,
      repeatCount: 1,
      running: false,
    },
  ]);

  const timersRef = useRef<Map<string, number>>(new Map());
  const remainingRef = useRef<Map<string, number>>(new Map());

  const canAddMore = rows.length < 4;

  const handleAddRow = () => {
    if (!canAddMore) return;
    setRows((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        characteristicId: "",
        value: "",
        delayMs: 1000,
        repeatCount: 1,
        running: false,
      },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    const t = timersRef.current.get(id);
    if (t) {
      clearInterval(t);
      timersRef.current.delete(id);
    }
    remainingRef.current.delete(id);
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRow = (id: string, patch: Partial<SendRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  // Helpers for encoding (currently only basic sanitization for hex)
  const normalizeHex = (input: string): string | null => {
    const cleaned = input
      .replace(/0x/gi, "")
      .replace(/[\s,;:_-]/g, "")
      .toLowerCase();
    if (!cleaned.length) return null;
    if (cleaned.length % 2 !== 0) return null;
    if (!/^[0-9a-f]*$/.test(cleaned)) return null;
    return cleaned;
  };

  const sendImmediate = (row: SendRow, mode: "hex" | "ascii") => {
    if (!row.characteristicId) return;
    const raw = row.value.trim();
    if (!raw) return;
    if (mode === "ascii") {
      onSend(selectedDevice, row.characteristicId, raw);
    } else {
      const hex = normalizeHex(raw);
      if (!hex) return;
      onSend(selectedDevice, row.characteristicId, hex);
    }
  };

  const startAuto = (row: SendRow, mode: "hex" | "ascii") => {
    if (row.running) return;
    if (!row.characteristicId) return;
    if (row.delayMs <= 0 || row.repeatCount <= 0) return;
    if (!row.value.trim()) return;

    // First send
    sendImmediate(row, mode);
    const remaining = row.repeatCount - 1;
    if (remaining <= 0) return;

    remainingRef.current.set(row.id, remaining);
    const intervalId = window.setInterval(() => {
      const left = remainingRef.current.get(row.id) ?? 0;
      if (left <= 0) {
        stopAuto(row);
        return;
      }
      sendImmediate(row, mode);
      const next = left - 1;
      if (next <= 0) {
        stopAuto(row);
      } else {
        remainingRef.current.set(row.id, next);
      }
    }, row.delayMs);
    timersRef.current.set(row.id, intervalId);
    updateRow(row.id, { running: true, runningMode: mode });
  };

  const stopAuto = (row: SendRow) => {
    const t = timersRef.current.get(row.id);
    if (t) {
      window.clearInterval(t);
      timersRef.current.delete(row.id);
    }
    remainingRef.current.delete(row.id);
    updateRow(row.id, { running: false, runningMode: undefined });
  };

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearInterval(t));
      timersRef.current.clear();
      remainingRef.current.clear();
    };
  }, []);

  const noDevice = !selectedDevice;
  const charOptions = writable;

  return (
    <div
      className={`flex flex-col gap-2 px-2 py-2 border-t text-xs ${
        isDark ? "bg-gray-900 border-gray-700" : "bg-gray-100 border-gray-300"
      }`}
      style={{ WebkitAppRegion: "no-drag" }}
    >
      <div className="flex items-center justify-between">
        <div className="opacity-70">Send</div>
        <button
          onClick={handleAddRow}
          disabled={!canAddMore}
          className={`px-2 py-0.5 rounded text-[11px] ${
            canAddMore
              ? "bg-gray-700 hover:bg-gray-600"
              : "bg-gray-700/50 cursor-not-allowed"
          }`}
          title={canAddMore ? "Add another send bar" : "Maximum 4 send bars"}
        >
          + Add
        </button>
      </div>

      {rows.map((row, idx) => {
        const disabledBase = noDevice || charOptions.length === 0;
        const baseInvalid = !row.characteristicId || !row.value.trim();
        const asciiDisabled = disabledBase || baseInvalid || row.running;
        const hexDisabled =
          disabledBase ||
          row.running ||
          !row.value.trim() ||
          !normalizeHex(row.value || "");

        return (
          <div key={row.id} className="flex flex-wrap items-center gap-2">
            {idx > 0 ? (
              <button
                onClick={() => handleRemoveRow(row.id)}
                disabled={row.running}
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  row.running
                    ? "bg-gray-700 opacity-50 cursor-not-allowed"
                    : "bg-red-700 hover:bg-red-600"
                }`}
                title="Remove this send bar"
              >
                -
              </button>
            ) : (
              <div className="w-6 flex justify-center opacity-40 text-[10px] select-none">
                #
              </div>
            )}

            <select
              className={`w-30 px-2 py-1 rounded border bg-transparent ${
                isDark
                  ? "border-gray-600 text-gray-200"
                  : "border-gray-400 text-gray-800"
              }`}
              value={row.characteristicId}
              onChange={(e) =>
                updateRow(row.id, { characteristicId: e.target.value })
              }
              disabled={disabledBase || row.running}
              title={noDevice ? "Select a device first" : undefined}
            >
              <option value="">Write characteristic</option>
              {charOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.uuid}
                </option>
              ))}
            </select>

            <input
              className={`flex-1 min-w-[140px] px-2 py-1 rounded border bg-transparent font-mono ${
                isDark
                  ? "border-gray-600 text-green-300 placeholder-gray-500"
                  : "border-gray-400 text-gray-800 placeholder-gray-500"
              }`}
              placeholder="Data (hex or ascii)..."
              value={row.value}
              onChange={(e) => updateRow(row.id, { value: e.target.value })}
              disabled={row.running}
            />

            {/* Instant send buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => sendImmediate(row, "hex")}
                disabled={hexDisabled}
                className={`px-2 py-1 rounded text-[11px] font-semibold ${
                  hexDisabled
                    ? "bg-gray-600 cursor-not-allowed opacity-50"
                    : "bg-purple-600 hover:bg-purple-500"
                }`}
                title="Send as raw hex bytes (pairs)"
              >
                Send Hex
              </button>
              <button
                onClick={() => sendImmediate(row, "ascii")}
                disabled={asciiDisabled}
                className={`px-2 py-1 rounded text-[11px] font-semibold ${
                  asciiDisabled
                    ? "bg-gray-600 cursor-not-allowed opacity-50"
                    : "bg-green-600 hover:bg-green-500"
                }`}
                title="Send as ASCII text"
              >
                Send Ascii
              </button>
            </div>

            {/* Timed controls for additional rows */}
            {idx > 0 && (
              <>
                <div className="flex items-center gap-1">
                  <label className="opacity-60 text-[10px]">Delay(ms)</label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={row.delayMs}
                    onChange={(e) =>
                      updateRow(row.id, {
                        delayMs: Math.max(1, Number(e.target.value || 0)),
                      })
                    }
                    disabled={row.running}
                    className={`w-15 px-2 py-1 rounded border bg-transparent ${
                      isDark
                        ? "border-gray-600 text-gray-200"
                        : "border-gray-400 text-gray-800"
                    }`}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <label className="opacity-60 text-[10px]">Repeat</label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={row.repeatCount}
                    onChange={(e) =>
                      updateRow(row.id, {
                        repeatCount: Math.max(1, Number(e.target.value || 0)),
                      })
                    }
                    disabled={row.running}
                    className={`w-10 px-2 py-1 rounded border bg-transparent ${
                      isDark
                        ? "border-gray-600 text-gray-200"
                        : "border-gray-400 text-gray-800"
                    }`}
                  />
                </div>

                {!row.running ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startAuto(row, "hex")}
                      disabled={
                        hexDisabled || row.delayMs <= 0 || row.repeatCount <= 0
                      }
                      className={`px-2 py-1 rounded text-[11px] font-semibold ${
                        hexDisabled || row.delayMs <= 0 || row.repeatCount <= 0
                          ? "bg-gray-600 cursor-not-allowed opacity-50"
                          : "bg-indigo-600 hover:bg-indigo-500"
                      }`}
                      title="Start timed hex sending"
                    >
                      StartHex
                    </button>
                    <button
                      onClick={() => startAuto(row, "ascii")}
                      disabled={
                        asciiDisabled ||
                        row.delayMs <= 0 ||
                        row.repeatCount <= 0
                      }
                      className={`px-2 py-1 rounded text-[11px] font-semibold ${
                        asciiDisabled ||
                        row.delayMs <= 0 ||
                        row.repeatCount <= 0
                          ? "bg-gray-600 cursor-not-allowed opacity-50"
                          : "bg-blue-600 hover:bg-blue-500"
                      }`}
                      title="Start timed ASCII sending"
                    >
                      StartAscii
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => stopAuto(row)}
                    className="px-3 py-1 rounded text-xs font-semibold bg-red-600 hover:bg-red-500"
                    title={`Stop (${row.runningMode || ""})`}
                  >
                    Stop
                  </button>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};
