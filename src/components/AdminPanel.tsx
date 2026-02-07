import { ScheduleEditor } from './ScheduleEditor';

interface AdminPanelProps {
  currentPuzzleId: string;
  onLoadTicker: (ticker: string) => void;
  onReset: () => void;
  onClose: () => void;
}

export function AdminPanel({ currentPuzzleId, onLoadTicker, onReset, onClose }: AdminPanelProps) {
  const handlePreview = (ticker: string) => {
    onLoadTicker(ticker);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center bg-black/80 overflow-y-auto py-8" onClick={onClose}>
      <div
        className="w-full max-w-xl border border-terminal-yellow bg-terminal-black mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-terminal-yellow px-4 py-3 sticky top-0 bg-terminal-black z-10">
          <div className="flex items-center gap-3">
            <span className="text-xs text-terminal-yellow tracking-widest uppercase">
              ADMIN PANEL
            </span>
            <span className="text-[9px] text-terminal-muted font-mono">
              ACTIVE: {currentPuzzleId.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[9px] text-terminal-muted">` TO TOGGLE</span>
            <button onClick={onClose} className="text-terminal-muted hover:text-terminal-yellow text-sm">
              [X]
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Schedule Editor */}
          <ScheduleEditor onPreviewPuzzle={handlePreview} />

          {/* Reset */}
          <div className="border-t border-terminal-border pt-4">
            <button
              onClick={onReset}
              className="w-full px-4 py-2.5 text-xs font-mono uppercase tracking-widest
                border border-terminal-red text-terminal-red
                hover:bg-terminal-red hover:text-terminal-black
                transition-colors"
            >
              RESET GAME — PLAY AGAIN
            </button>
            <div className="text-[10px] font-mono text-terminal-border mt-1 text-center">
              Clears today's progress and reloads the current puzzle
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
