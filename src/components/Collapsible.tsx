/**
 * @component Collapsible
 * @description Simple collapsible container with a header row and optional
 * right‑side inline content. Keeps children mounted for state persistence.
 * @param {object} props
 * @param {string} props.title Section title
 * @param {boolean} props.open Whether the section is expanded
 * @param {() => void} props.onToggle Toggle callback
 * @param {boolean} props.isDark Whether dark theme is active
 * @param {React.ReactNode} [props.right] Optional right‑side content in header
 * @param {React.ReactNode} props.children Content of the section
 * @returns {JSX.Element}
 */
export const Collapsible = ({
  title,
  open,
  onToggle,
  isDark,
  right,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  isDark: boolean;
  right?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="border-b border-gray-700/40">
    <button
      onClick={onToggle}
      className={`w-full flex items-center justify-between px-3 h-9 text-xs font-semibold tracking-wide ${
        isDark
          ? "bg-gray-800 hover:bg-gray-750 text-gray-200"
          : "bg-gray-200 hover:bg-gray-300 text-gray-800"
      }`}
    >
      <span className="uppercase text-[10px] flex items-center gap-2">
        {title}
        {right && <span className="normal-case font-normal opacity-80">{right}</span>}
      </span>
      <span className="text-[11px]">{open ? "▾" : "▸"}</span>
    </button>
    <div
      className="px-3 pb-4 pt-3 text-xs space-y-4"
      style={{ display: open ? "block" : "none" }}
    >
      {children}
    </div>
  </div>
);
