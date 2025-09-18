/** ------------------------------
 * Electron State Management
 * -------------------------------
 */

let MainWindow: Electron.BrowserWindow | null = null;

/** ------------------------------
 *  Main Window Accessors
 * -------------------------------
 */

/**
 * Sets the main application window.
 * @param window - The main application window to set
 */
export const SetMainWindow = (window: Electron.BrowserWindow | null): void => {
  MainWindow = window;
};

/**
 * Gets the main application window.
 * @returns The main application window
 */
export const GetMainWindow = (): Electron.BrowserWindow | null => {
  return MainWindow;
};
