import { useMantineColorScheme } from "@mantine/core";
import { useBleStore } from "../state/useBleStore";

/**
 * FooterBar
 * @description A component representing the footer bar of the application.
 * @returns A React component representing the footer bar.
 */
const FooterBar = (): React.JSX.Element => {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";
  const conn = useBleStore((s) => s.connected);

  return (
    <div
      className={`
        flex items-center justify-between h-6 px-3 text-xs
        ${
          isDark
            ? "bg-gray-800 border-gray-600 text-gray-300"
            : "bg-gray-50 border-gray-300 text-gray-700"
        }
        border-t
      `}
    >
      <div className="flex items-center gap-2">
        <span>{conn ? "Connected" : "Ready"}</span>
      </div>

      <div className="flex items-center gap-2 truncate">
        {conn ? (
          <>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 9999,
                backgroundColor: "#2f9e44",
                display: "inline-block",
              }}
            />
            <span className="truncate max-w-64" title={conn.name || conn.id}>
              {conn.name || conn.id}
            </span>
          </>
        ) : (
          <span className="opacity-70">Disconnected</span>
        )}
      </div>
    </div>
  );
};

export default FooterBar;
