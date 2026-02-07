interface HeaderProps {
  onShowStats: () => void;
  onShowHelp: () => void;
  onShowAdmin: () => void;
}

export function Header({ onShowStats, onShowHelp, onShowAdmin }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-terminal-border px-4 py-3 shrink-0">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-mono font-bold tracking-wider">
          <span className="text-terminal-text">can</span>
          <span className="text-terminal-green">DLE</span>
        </h1>
        <span className="text-[10px] text-terminal-muted tracking-widest uppercase ml-2 hidden sm:inline">
          DAILY STOCK CHART GAME
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onShowAdmin}
          className="w-8 h-8 flex items-center justify-center text-terminal-border hover:text-terminal-yellow text-xs border border-transparent hover:border-terminal-yellow transition-colors"
          title="Admin Panel (`)"
        >
          {'\u2318'}
        </button>
        <button
          onClick={onShowHelp}
          className="w-8 h-8 flex items-center justify-center text-terminal-muted hover:text-terminal-green text-sm border border-terminal-border hover:border-terminal-green-dim transition-colors"
        >
          ?
        </button>
        <button
          onClick={onShowStats}
          className="w-8 h-8 flex items-center justify-center text-terminal-muted hover:text-terminal-green text-sm border border-terminal-border hover:border-terminal-green-dim transition-colors"
        >
          {'\u2261'}
        </button>
      </div>
    </header>
  );
}
