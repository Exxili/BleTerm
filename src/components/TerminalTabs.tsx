import { Tabs, Paper, Text, Box, Group, ThemeIcon, Stack, ActionIcon } from "@mantine/core";
import { useEffect, useState } from "react";
import type { ITerminalTab } from "../interfaces/ITerminalTab";

/**
 * @component TerminalTabs
 * @description Displays terminal tabs and a compact activity indicator that
 * flashes green briefly on incoming data, then returns to red before hiding
 * after a short timeout.
 * @param {object} props React props
 * @param {boolean} props.isDark Whether the UI is in dark mode
 * @param {ITerminalTab[]} props.tabs List of tabs to render
 * @param {string} props.activeTab Currently selected tab id
 * @param {(id: string) => void} props.onSelectTab Callback when a tab is selected
 * @param {{ enabled: boolean; format: string; path: string }} props.capture Capture settings summary
 * @param {string[]} props.content Lines to render in the active tab content area
 * @param {Record<string, { ts: number; count: number }>} [props.activity] Recent activity timestamps by tab id
 * @returns {JSX.Element}
 */
export const TerminalTabs = ({
  isDark,
  tabs,
  activeTab,
  onSelectTab,
  onReorder,
  onCloseTab,
  capture,
  content,
  activity,
}: {
  isDark: boolean;
  tabs: ITerminalTab[];
  activeTab: string;
  onSelectTab: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onCloseTab: (id: string) => void;
  capture: { enabled: boolean; format: string; path: string };
  content: string[];
  activity?: Record<string, { ts: number; count: number }>;
}) => {
  const ACTIVE_MS = 1200;
  const FLASH_MS = 180;
  const [, setTick] = useState(0); // forces re-render for flash back-to-red

  // Drive re-render while any tab has recent activity so the flash can revert
  useEffect(() => {
    const hasActive = () =>
      Object.values(activity || {}).some((a) => Date.now() - a.ts < ACTIVE_MS);

    if (!hasActive()) return;
    const id = setInterval(() => {
      // stop when no more active entries
      if (!hasActive()) {
        clearInterval(id);
        return;
      }
      setTick((t) => t + 1);
    }, 100);
    return () => clearInterval(id);
  }, [activity]);
  return (
    <Box style={{ WebkitAppRegion: "no-drag" }} className="h-full min-h-0 grid grid-rows-[auto_1fr]">
      <Tabs value={activeTab} onChange={(v) => v && onSelectTab(v)}>
        {tabs.length > 0 && (
        <Tabs.List>
          {tabs.map((t, index) => (
            <Tabs.Tab
              key={t.id}
              value={t.id}
              draggable
              onDragStart={(e) => {
                try {
                  e.dataTransfer.setData("text/plain", String(index));
                } catch {}
                // For Firefox
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDrop={(e) => {
                e.preventDefault();
                const data = e.dataTransfer.getData("text/plain");
                const from = Number.parseInt(data, 10);
                const to = index;
                if (!Number.isNaN(from) && from !== to) {
                  onReorder(from, to);
                }
              }}
            >
              <Group gap={6} align="center">
                <span>{t.label}</span>
                {(() => {
                  const a = activity?.[t.id];
                  const elapsed = a ? Date.now() - a.ts : Infinity;
                  if (elapsed >= ACTIVE_MS) return null; // only show briefly after activity
                  const color = elapsed <= FLASH_MS ? "#2f9e44" : "#e03131"; // flash green then return to red
                  return (
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 9999,
                        backgroundColor: color,
                        display: "inline-block",
                      }}
                    />
                  );
                })()}
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  color="gray"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onCloseTab(t.id);
                  }}
                  title="Close tab"
                >
                  ×
                </ActionIcon>
              </Group>
            </Tabs.Tab>
          ))}
        </Tabs.List>
        )}
      </Tabs>

      <div
        className="min-h-0 overflow-auto"
        style={{ backgroundColor: isDark ? "#000" : "#fff" }}
      >
        {tabs.length === 0 ? (
          <div className="h-full w-full grid place-items-center p-6" style={{ minHeight: "100%" }}>
            <Paper
              withBorder
              shadow="sm"
              p="lg"
              radius="md"
              style={{
                maxWidth: 680,
                width: "100%",
                backgroundColor: isDark ? "#0b0b0b" : "#fafafa",
                borderColor: isDark ? "#2a2a2a" : "#e6e6e6",
              }}
            >
              <Stack gap="xs">
                <Group gap={10} align="center">
                  <ThemeIcon size="lg" radius="xl" variant="gradient" gradient={{ from: "blue", to: "grape" }}>
                    📡
                  </ThemeIcon>
                  <Text size="sm" fw={700}>Welcome</Text>
                </Group>
                <Text size="sm" c="dimmed">
                  Scan for devices in the BLE sidebar, connect to a device, then choose a characteristic and open a Watch tab to stream notifications. You can also Read a characteristic for a one-time value.
                </Text>
                <ul className="list-disc pl-5 text-xs opacity-80">
                  <li>Use Scan to discover nearby peripherals</li>
                  <li>Connect and view services/characteristics</li>
                  <li>Open <span className="font-semibold">Watch</span> to monitor notifications or <span className="font-semibold">Read</span> for a one-time fetch</li>
                </ul>
                <Text size="xs" c="dimmed" style={{ marginTop: 6 }}>
                  Tip: Drag tabs to reorder once created.
                </Text>
              </Stack>
            </Paper>
          </div>
        ) : (
          <Paper
            radius="0"
            p="xs"
            className="font-mono text-xs"
            c="green.5"
            style={{ minHeight: "100%", width: "100%", backgroundColor: isDark ? "#000" : "#fff" }}
          >
            <Text size="xs" c="dimmed" mb="xs">
              Tab: {activeTab} | Capture: {capture.enabled ? "on" : "off"} ({capture.format}) → {capture.path}
            </Text>
            <div>
              {content && content.length ? (
                content.map((line, idx) => (
                  <pre key={idx} className="m-0">
                    {line}
                  </pre>
                ))
              ) : (
                <Text size="xs">
                  Placeholder terminal output...
                  <br />
                  Future streaming data will appear here.
                </Text>
              )}
            </div>
          </Paper>
        )}
      </div>
    </Box>
  );
};
