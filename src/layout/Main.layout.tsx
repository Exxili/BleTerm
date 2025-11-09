import TitleBarFactory from "../components/TitleBarFactory";
import FooterBar from "../components/FooterBar";
import TerminalLayout from "./Terminal.layout";
import { Box } from "@mantine/core";

/**
 * MainLayout
 * @description A layout component for the main application.
 * @returns A React component representing the main layout.
 */
const MainLayout = (): React.JSX.Element => {
  return (
    <Box className="w-full h-screen flex flex-col">
      <TitleBarFactory />
      <Box className="flex-1 overflow-hidden">
        <TerminalLayout />
      </Box>
      <FooterBar />
    </Box>
  );
};

export default MainLayout;
