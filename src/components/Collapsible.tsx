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
