import { useEffect, useRef, useState } from "react";
import {
  ActionIcon,
  Button,
  Collapse,
  Group,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
  Tooltip,
  Paper,
} from "@mantine/core";
import { IconPlus, IconMinus, IconPlayerPlay, IconPlayerStop, IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import type { ICharacteristic } from "../interfaces/ICharacteristic";

interface SendRow {
  id: string;
  characteristicId: string;
  value: string;
  delayMs: number;
  repeatCount: number;
  running: boolean;
  runningMode?: "hex" | "ascii";
  expanded?: boolean;
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
      expanded: false,
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
        expanded: false,
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
    <Paper radius={0} p="xs" withBorder style={{ WebkitAppRegion: "no-drag" }} className="shrink-0">
      <Group justify="space-between" mb={"xs"}>
        <Text size="xs" c="dimmed">
          Send
        </Text>
        <Tooltip label={canAddMore ? "Add another send bar" : "Maximum 4 send bars"}>
          <ActionIcon onClick={handleAddRow} disabled={!canAddMore} color="blue" variant="light" aria-label="Add row" size="md">
            <IconPlus size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>
      <Stack gap="xs">
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
            <Group key={row.id} wrap="wrap" gap="xs">
              {idx > 0 ? (
                <Tooltip label="Remove this send bar">
                  <ActionIcon
                    onClick={() => handleRemoveRow(row.id)}
                    disabled={row.running}
                    color="red"
                    variant="light"
                    size="md"
                    aria-label="Remove row"
                  >
                    <IconMinus size={16} />
                  </ActionIcon>
                </Tooltip>
              ) : (
                <ActionIcon size="md" variant="transparent" disabled aria-label="spacer" style={{ visibility: "hidden" }} />
              )}

              <Select
                placeholder="Write characteristic"
                size="xs"
                data={charOptions.map((c) => ({ value: c.id, label: c.uuid }))}
                value={row.characteristicId || null}
                onChange={(v) => updateRow(row.id, { characteristicId: v || "" })}
                disabled={disabledBase || row.running}
                w={220}
              />

              <TextInput
                placeholder="Data (hex or ascii)..."
                size="xs"
                value={row.value}
                onChange={(e) => updateRow(row.id, { value: e.currentTarget.value })}
                className="flex-1 min-w-[160px]"
                disabled={row.running}
              />

              <Group gap={4}>
                <Tooltip label="Send as raw hex bytes (pairs)">
                  <Button size="xs" variant="filled" color="grape" onClick={() => sendImmediate(row, "hex")} disabled={hexDisabled}>
                    Hex
                  </Button>
                </Tooltip>
                <Tooltip label="Send as ASCII text">
                  <Button size="xs" variant="filled" color="green" onClick={() => sendImmediate(row, "ascii")} disabled={asciiDisabled}>
                    Ascii
                  </Button>
                </Tooltip>
              </Group>

              {/* Advanced toggle for timed controls (only for extra rows) */}
              {idx > 0 && (
                <Tooltip label={row.expanded ? "Hide timed options" : "Show timed options"}>
                  <ActionIcon
                    size="md"
                    variant="subtle"
                    onClick={() => updateRow(row.id, { expanded: !row.expanded })}
                    aria-label="Toggle advanced"
                  >
                    {row.expanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                  </ActionIcon>
                </Tooltip>
              )}

              {idx > 0 && (
                <Collapse in={!!row.expanded} style={{ width: "100%" }}>
                  <Group gap={8} mt={4} wrap="wrap" align="center">
                    <Group gap={6} align="center">
                      <Text size="xs" c="dimmed">
                        Delay(ms)
                      </Text>
                      <NumberInput
                        size="xs"
                        min={1}
                        step={1}
                        value={row.delayMs}
                        onChange={(v) =>
                          updateRow(row.id, { delayMs: Math.max(1, Number(v || 0)) })
                        }
                        disabled={row.running}
                        w={90}
                      />
                    </Group>
                    <Group gap={6} align="center">
                      <Text size="xs" c="dimmed">
                        Repeat
                      </Text>
                      <NumberInput
                        size="xs"
                        min={1}
                        step={1}
                        value={row.repeatCount}
                        onChange={(v) =>
                          updateRow(row.id, { repeatCount: Math.max(1, Number(v || 0)) })
                        }
                        disabled={row.running}
                        w={80}
                      />
                    </Group>

                    {!row.running ? (
                      <Group gap={4}>
                        <Tooltip label="Start timed hex sending">
                          <Button
                            size="xs"
                            leftSection={<IconPlayerPlay size={14} />}
                            onClick={() => startAuto(row, "hex")}
                            disabled={hexDisabled || row.delayMs <= 0 || row.repeatCount <= 0}
                            color="indigo"
                          >
                            StartHex
                          </Button>
                        </Tooltip>
                        <Tooltip label="Start timed ASCII sending">
                          <Button
                            size="xs"
                            leftSection={<IconPlayerPlay size={14} />}
                            onClick={() => startAuto(row, "ascii")}
                            disabled={asciiDisabled || row.delayMs <= 0 || row.repeatCount <= 0}
                            color="blue"
                          >
                            StartAscii
                          </Button>
                        </Tooltip>
                      </Group>
                    ) : (
                      <Tooltip label={`Stop (${row.runningMode || ""})`}>
                        <Button
                          size="xs"
                          color="red"
                          leftSection={<IconPlayerStop size={14} />}
                          onClick={() => stopAuto(row)}
                        >
                          Stop
                        </Button>
                      </Tooltip>
                    )}
                  </Group>
                </Collapse>
              )}
            </Group>
          );
        })}
      </Stack>
    </Paper>
  );
};
