import { useEffect, useState } from "react";

/**
 * TitleBar
 * @description A component representing the title bar of the application.
 * @returns A React component representing the title bar.
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

const WindowsTitleBar = (): React.JSX.Element => {
  return (
    <div className="w-full h-8 bg-blue-600 text-white flex items-center px-4">
      Windows Title Bar
    </div>
  );
};

const MacOSTitleBar = (): React.JSX.Element => {
  return (
    <div className="w-full h-8 bg-gray-200 text-black flex items-center px-4">
      macOS Title Bar
    </div>
  );
};
const LinuxTitleBar = (): React.JSX.Element => {
  return (
    <div className="w-full h-8 bg-green-600 text-white flex items-center px-4">
      Linux Title Bar
    </div>
  );
};
