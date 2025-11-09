import { useEffect, useState } from "react";
import { WindowsTitleBar } from "./WindowsTitleBar";
import pkg from "../../package.json";

/**
 * @component TitleBarFactory
 * @description Detects platform and renders an appropriate title bar.
 * @returns {JSX.Element}
 */
const TitleBarFactory = (): React.JSX.Element => {
  const [platform, setPlatform] = useState<string>("");

  useEffect(() => {
    window.platform.getPlatform().then(setPlatform);
  }, []);

  switch (platform) {
    case "win32":
      return <WindowsTitleBar />;
    case "darwin":
      return <MacOSTitleBar />;
    case "linux":
      return <LinuxTitleBar />;
    default:
      return <div>Loading...</div>;
  }
};

export default TitleBarFactory;

/**
 * @component MacOSTitleBar
 * @description Placeholder macOS title bar.
 * @returns {JSX.Element}
 */
const MacOSTitleBar = (): React.JSX.Element => {
  return (
    <div className="w-full h-8 bg-gray-200 text-black flex items-center justify-between px-4 select-none">
      <span>macOS Title Bar</span>
      <span className="text-xs opacity-70">v{pkg.version}</span>
    </div>
  );
};
/**
 * @component LinuxTitleBar
 * @description Placeholder Linux title bar.
 * @returns {JSX.Element}
 */
const LinuxTitleBar = (): React.JSX.Element => {
  return (
    <div className="w-full h-8 bg-green-600 text-white flex items-center justify-between px-4 select-none">
      <span>Linux Title Bar</span>
      <span className="text-xs opacity-80">v{pkg.version}</span>
    </div>
  );
};
