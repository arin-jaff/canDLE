import { useEffect, useState } from 'react';

interface PuzzleInfo {
  file: string;
  ticker: string;
  name: string;
  description: string;
  difficulty: number | null;
}

export function TickerStatus() {
  const [puzzles, setPuzzles] = useState<PuzzleInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenning, setRegenning] = useState<Set<string>>(new Set());
  const [regenAllRunning, setRegenAllRunning] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchPuzzles = async () => {
    try {
      // Try dev API first
      const res = await fetch('/api/admin/puzzles');
      if (res.ok) {
        setPuzzles(await res.json());
        return;
      }
    } catch { /* dev API not available */ }

    // Fallback: read schedule and load each puzzle JSON
    try {
      const schedRes = await fetch('/schedule.json');
      if (!schedRes.ok) return;
      const schedule: Record<string, string> = await schedRes.json();
      const tickers = [...new Set(Object.values(schedule))];
      const results: PuzzleInfo[] = [];
      for (const ticker of tickers) {
        try {
          const pRes = await fetch(`/puzzles/${ticker.toLowerCase()}.json`);
          if (!pRes.ok) continue;
          const puzzle = await pRes.json();
          results.push({
            file: `${ticker.toLowerCase()}.json`,
            ticker: ticker.toUpperCase(),
            name: puzzle.answer?.name || ticker,
            description: puzzle.hints?.description || '',
            difficulty: puzzle.difficulty ?? null,
          });
        } catch { /* skip */ }
      }
      setPuzzles(results);
    } catch (e) {
      console.error('Failed to fetch puzzles:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPuzzles(); }, []);

  const regenDescription = async (ticker: string) => {
    setRegenning((prev) => new Set(prev).add(ticker));
    try {
      const res = await fetch(`/api/admin/regen-description?ticker=${ticker}`);
      const data = await res.json();
      if (data.error) {
        alert(`Error: ${data.error}`);
      } else {
        await fetchPuzzles();
      }
    } catch (e) {
      alert(`Failed: ${e}`);
    } finally {
      setRegenning((prev) => {
        const next = new Set(prev);
        next.delete(ticker);
        return next;
      });
    }
  };

  const regenAll = async () => {
    setRegenAllRunning(true);
    for (const p of puzzles) {
      await regenDescription(p.ticker);
    }
    setRegenAllRunning(false);
  };

  const startEdit = (ticker: string, description: string) => {
    setEditing(ticker);
    setEditText(description);
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditText('');
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/save-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: editing, description: editText }),
      });
      const data = await res.json();
      if (data.error) {
        alert(`Error: ${data.error}`);
      } else {
        setEditing(null);
        setEditText('');
        await fetchPuzzles();
      }
    } catch (e) {
      alert(`Failed: ${e}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-[10px] text-terminal-muted tracking-widest uppercase py-4 text-center">
        LOADING TICKER DATA...
      </div>
    );
  }

  return (
    <div className="border border-terminal-border">
      <div className="bg-terminal-dark px-3 py-2 border-b border-terminal-border">
        <span className="text-[10px] text-terminal-yellow tracking-widest uppercase font-medium">
          TICKER STATUS
        </span>
        <span className="text-[9px] text-terminal-muted ml-2">
          {puzzles.length} PUZZLES
        </span>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {puzzles.map((p) => (
          <div key={p.ticker} className="border-b border-terminal-border last:border-b-0 px-3 py-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-terminal-green">{p.ticker}</span>
                <span className="text-[10px] text-terminal-muted">{p.name}</span>
                {p.difficulty && (
                  <span className="text-[9px] text-terminal-muted font-mono">
                    [{'\u2588'.repeat(p.difficulty)}{'\u2591'.repeat(5 - p.difficulty)}]
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {editing !== p.ticker && (
                  <button
                    onClick={() => startEdit(p.ticker, p.description)}
                    className="text-[9px] uppercase tracking-wider px-2 py-1
                      border border-terminal-border text-terminal-muted
                      hover:border-terminal-text hover:text-terminal-text
                      transition-colors"
                  >
                    EDIT
                  </button>
                )}
                <button
                  onClick={() => regenDescription(p.ticker)}
                  disabled={regenning.has(p.ticker)}
                  className="text-[9px] uppercase tracking-wider px-2 py-1
                    border border-terminal-border text-terminal-muted
                    hover:border-terminal-yellow hover:text-terminal-yellow
                    disabled:opacity-40 disabled:cursor-wait
                    transition-colors"
                >
                  {regenning.has(p.ticker) ? 'GENERATING...' : 'REGEN'}
                </button>
              </div>
            </div>

            {editing === p.ticker ? (
              <div className="space-y-1">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={3}
                  className="w-full bg-terminal-panel border border-terminal-yellow text-[10px] text-terminal-text
                    p-2 leading-relaxed resize-y outline-none focus:border-terminal-yellow"
                />
                <div className="flex gap-1 justify-end">
                  <button
                    onClick={cancelEdit}
                    className="text-[9px] uppercase tracking-wider px-2 py-1
                      border border-terminal-border text-terminal-muted
                      hover:border-terminal-red hover:text-terminal-red
                      transition-colors"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={saveEdit}
                    disabled={saving}
                    className="text-[9px] uppercase tracking-wider px-2 py-1
                      border border-terminal-green text-terminal-green
                      hover:bg-terminal-green hover:text-terminal-black
                      disabled:opacity-40 disabled:cursor-wait
                      transition-colors"
                  >
                    {saving ? 'SAVING...' : 'SAVE'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-[10px] text-terminal-text leading-relaxed">
                {p.description || <span className="text-terminal-muted italic">No description</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-terminal-border px-3 py-2">
        <button
          onClick={regenAll}
          disabled={regenAllRunning}
          className="w-full px-3 py-2 text-[10px] uppercase tracking-widest
            border border-terminal-yellow text-terminal-yellow
            hover:bg-terminal-yellow hover:text-terminal-black
            disabled:opacity-40 disabled:cursor-wait
            transition-colors"
        >
          {regenAllRunning ? 'GENERATING ALL...' : 'GENERATE ALL DESCRIPTIONS'}
        </button>
      </div>
    </div>
  );
}
