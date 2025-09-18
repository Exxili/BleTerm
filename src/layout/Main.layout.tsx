import TitleBarFactory from "../components/TitleBarFactory";

/**
 * MainLayout
 * @description A layout component for the main application.
 * @returns A React component representing the main layout.
 */
const MainLayout = (): React.JSX.Element => {
  return (
    <div className="w-full h-full flex flex-col items-stretch justify-between">
      <TitleBarFactory />
    </div>
  );
};
export default MainLayout;
