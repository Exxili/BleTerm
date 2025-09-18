import { useMantineColorScheme } from "@mantine/core";
import { IconMinus, IconSquare, IconX } from "@tabler/icons-react";

/**
 * WindowsTitleBar
 * @description A component representing the Windows title bar of the application.
 * @returns A React component representing the Windows title bar.
 */
export const WindowsTitleBar: React.FC = () => {
  const { colorScheme } = useMantineColorScheme();

  /**
   * -----------------------------
   * Local state
   * -----------------------------
   */
  const isDark = colorScheme === "dark";

  /**
   * -----------------------------
   * Event Handlers
   * -----------------------------
   */

  /**
   * Handles the window minimize action.
   * @returns void
   */
  const handleMinimize = () => window.windowcontrol.minimize();

  /**
   * Handles the window maximize/unmaximize action.
   * @return void
   */
  const handleMaximize = async () => {
    // Check if the window is already maximized
    if (await window.windowcontrol.isMaximized()) {
      window.windowcontrol.unmaximize();
    } else {
      window.windowcontrol.maximize();
    }
  };

  /**
   * Handles the window close action.
   * @return void
   */
  const handleClose = () => window.windowcontrol.close();

  return (
    <div
      className={`
      flex items-center justify-between h-8 px-3
      ${
        isDark
          ? "bg-gray-800 border-gray-600 text-gray-100"
          : "bg-gray-50 border-gray-300 text-gray-900"
      }
      border-b select-none draggable
    `}
    >
      <div className="flex-1">
        <span className="text-sm font-normal">BleTerm</span>
      </div>

      <div className="flex undraggable">
        <button
          onClick={handleMinimize}
          className={`
            w-12 h-8 flex items-center justify-center transition-colors duration-100
            ${
              isDark
                ? "hover:bg-gray-700 text-gray-300 hover:text-gray-100"
                : "hover:bg-gray-200 text-gray-600 hover:text-gray-900"
            }
          `}
        >
          <IconMinus size={14} stroke={1.5} />
        </button>

        <button
          onClick={handleMaximize}
          className={`
            w-12 h-8 flex items-center justify-center transition-colors duration-100
            ${
              isDark
                ? "hover:bg-gray-700 text-gray-300 hover:text-gray-100"
                : "hover:bg-gray-200 text-gray-600 hover:text-gray-900"
            }
          `}
        >
          <IconSquare size={14} stroke={1.5} />
        </button>

        <button
          onClick={handleClose}
          className={`
            w-12 h-8 flex items-center justify-center transition-colors duration-100
            hover:bg-red-600 hover:text-white
            ${isDark ? "text-gray-300" : "text-gray-600"}
          `}
        >
          <IconX size={18} stroke={1.5} />
        </button>
      </div>
    </div>
  );
};
