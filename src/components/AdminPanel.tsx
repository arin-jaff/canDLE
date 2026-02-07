import { useState } from 'react';

interface AdminPanelProps {
  currentPuzzleId: string;
  onLoadPuzzle: (index: number) => void;
  onLoadTicker: (ticker: string) => void;
  onReset: () => void;
  onClose: () => void;
}

const SAMPLE_PUZZLES = [
  { index: 0, label: 'NVDA — NVIDIA' },
  { index: 1, label: 'TSLA — Tesla' },
  { index: 2, label: 'AAPL — Apple' },
];

export function AdminPanel({ currentPuzzleId, onLoadPuzzle, onLoadTicker, onReset, onClose }: AdminPanelProps) {
  const [customTicker, setCustomTicker] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState('');

  const handleGenerate = async () => {
    const ticker = customTicker.trim().toUpperCase();
    if (!ticker) return;

    setGenerating(true);
    setGenStatus(`FETCHING ${ticker}...`);

    try {
      // Call the Python script via a dev endpoint, or generate client-side
      // For now, we'll generate a minimal puzzle JSON client-side using a proxy approach
      // In dev, we use the admin API endpoint
      const res = await fetch(`/api/admin/generate?ticker=${ticker}`);
      if (res.ok) {
        setGenStatus(`LOADED ${ticker}`);
        onLoadTicker(ticker);
      } else {
        // Fallback: try loading from puzzles directory
        setGenStatus('USE PYTHON SCRIPT TO GENERATE');
      }
    } catch {
      setGenStatus('RUN: python3 scripts/generate_puzzles.py');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80" onClick={onClose}>
      <div
        className="w-full max-w-md border border-terminal-yellow bg-terminal-black mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-terminal-yellow px-4 py-3">
          <span className="text-xs text-terminal-yellow tracking-widest uppercase">
            ADMIN PANEL
          </span>
          <div className="flex items-center gap-3">
            <span className="text-[9px] text-terminal-muted">` TO TOGGLE</span>
            <button onClick={onClose} className="text-terminal-muted hover:text-terminal-yellow text-sm">
              [X]
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Current state */}
          <div>
            <div className="text-[10px] text-terminal-muted tracking-widest uppercase mb-1">
              CURRENT PUZZLE
            </div>
            <div className="text-xs font-mono text-terminal-text">
              {currentPuzzleId}
            </div>
          </div>

          {/* Quick load sample puzzles */}
          <div>
            <div className="text-[10px] text-terminal-muted tracking-widest uppercase mb-2">
              LOAD SAMPLE PUZZLE
            </div>
            <div className="space-y-1">
              {SAMPLE_PUZZLES.map(({ index, label }) => (
                <button
                  key={index}
                  onClick={() => onLoadPuzzle(index)}
                  className="w-full text-left px-3 py-2 text-xs font-mono
                    border border-terminal-border bg-terminal-panel
                    hover:border-terminal-yellow hover:text-terminal-yellow
                    text-terminal-text transition-colors"
                >
                  [{index}] {label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom ticker */}
          <div>
            <div className="text-[10px] text-terminal-muted tracking-widest uppercase mb-2">
              TEST CUSTOM TICKER
            </div>
            <div className="flex border border-terminal-border">
              <span className="px-3 py-2 text-terminal-yellow text-xs bg-terminal-panel border-r border-terminal-border">
                $
              </span>
              <input
                type="text"
                value={customTicker}
                onChange={(e) => setCustomTicker(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                placeholder="MSFT, AMZN, etc."
                className="flex-1 bg-terminal-black text-terminal-text text-xs px-3 py-2
                  font-mono placeholder:text-terminal-border outline-none"
              />
              <button
                onClick={handleGenerate}
                disabled={generating || !customTicker.trim()}
                className="px-4 py-2 text-[10px] font-mono uppercase tracking-wider
                  border-l border-terminal-border
                  bg-terminal-panel text-terminal-yellow
                  hover:bg-terminal-yellow hover:text-terminal-black
                  disabled:opacity-40 disabled:cursor-not-allowed
                  transition-colors"
              >
                {generating ? '...' : 'FETCH'}
              </button>
            </div>
            {genStatus && (
              <div className="text-[10px] font-mono text-terminal-muted mt-1">
                {genStatus}
              </div>
            )}
            <div className="text-[10px] font-mono text-terminal-border mt-1">
              TIP: Run scripts/generate_puzzles.py to add stocks
            </div>
          </div>

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
              Clears today's progress and reloads the puzzle
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
