import { useMantineColorScheme } from "@mantine/core";

/**
 * FooterBar
 * @description A component representing the footer bar of the application.
 * @returns A React component representing the footer bar.
 */
const FooterBar = (): React.JSX.Element => {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

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
        <span>Ready</span>
      </div>

      <div className="flex items-center gap-4">
        <span>Connected</span>
      </div>
    </div>
  );
};

export default FooterBar;
