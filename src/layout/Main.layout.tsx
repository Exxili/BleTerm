import TitleBarFactory from "../components/TitleBarFactory";
import FooterBar from "../components/FooterBar";
import TerminalLayout from "./Terminal.layout";

/**
 * MainLayout
 * @description A layout component for the main application.
 * @returns A React component representing the main layout.
 */
const MainLayout = (): React.JSX.Element => {
  return (
    <div className="w-full h-screen flex flex-col">
      <TitleBarFactory />
      <div className="flex-1 overflow-hidden">
        <TerminalLayout />
      </div>
      <FooterBar />
    </div>
  );
};

export default MainLayout;
