import { Tabs, Paper, Text, Box, Group } from "@mantine/core";
import { useEffect, useState } from "react";
import type { ITerminalTab } from "../interfaces/ITerminalTab";

export const TerminalTabs = ({
  isDark,
  tabs,
  activeTab,
  onSelectTab,
  capture,
  content,
  activity,
}: {
  isDark: boolean;
  tabs: ITerminalTab[];
  activeTab: string;
  onSelectTab: (id: string) => void;
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
        <Tabs.List>
          {tabs.map((t) => (
            <Tabs.Tab key={t.id} value={t.id}>
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
              </Group>
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>

      <div
        className="min-h-0 overflow-auto"
        style={{ backgroundColor: isDark ? "#000" : "#fff" }}
      >
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
      </div>
    </Box>
  );
};
