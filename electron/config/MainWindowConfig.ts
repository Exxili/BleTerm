/**
 * Generate the configuration for the main application window.
 * @param iconPath the path to the icon
 * @param preloadPath the path to the preload script
 * @returns the configuration object for the main application window
 */
export const GenerateMainWindowConfig = (
  iconPath: string,
  preloadPath: string
): Electron.BrowserWindowConstructorOptions => {
  return {
    autoHideMenuBar: true,
    frame: false,
    minWidth: 1150,
    minHeight: 600,
    width: 1150,
    height: 768,
    icon: iconPath,
    webPreferences: {
      preload: preloadPath,
    },
  };
};
