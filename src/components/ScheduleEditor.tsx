import { useState, useEffect, useCallback } from 'react';

interface ScheduleEditorProps {
  onPreviewPuzzle: (ticker: string) => void;
}

interface PuzzleInfo {
  file: string;
  ticker: string;
  name: string;
}

function getDateRange(days: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().split('T')[0];
}

export function ScheduleEditor({ onPreviewPuzzle }: ScheduleEditorProps) {
  const [schedule, setSchedule] = useState<Record<string, string>>({});
  const [available, setAvailable] = useState<PuzzleInfo[]>([]);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [generating, setGenerating] = useState<string | null>(null);

  const dates = getDateRange(30);

  const loadData = useCallback(async () => {
    try {
      const [schedRes, puzzlesRes] = await Promise.all([
        fetch('/api/admin/schedule'),
        fetch('/api/admin/puzzles'),
      ]);
      if (schedRes.ok) setSchedule(await schedRes.json());
      if (puzzlesRes.ok) setAvailable(await puzzlesRes.json());
    } catch {
      setStatus('ERR: FAILED TO LOAD');
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const saveSchedule = async (newSchedule: Record<string, string>) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSchedule),
      });
      if (res.ok) {
        setSchedule(newSchedule);
        setStatus('SAVED');
        setTimeout(() => setStatus(''), 2000);
      } else {
        setStatus('ERR: SAVE FAILED');
      }
    } catch {
      setStatus('ERR: NETWORK');
    } finally {
      setSaving(false);
    }
  };

  const handleSetTicker = (date: string, ticker: string) => {
    const t = ticker.trim().toUpperCase();
    if (!t) return;
    const newSched = { ...schedule, [date]: t };
    setEditingDate(null);
    setEditValue('');
    saveSchedule(newSched);
  };

  const handleGenerateAndSet = async (date: string, ticker: string) => {
    const t = ticker.trim().toUpperCase();
    if (!t) return;
    setGenerating(date);
    setStatus(`GENERATING ${t}...`);
    try {
      const res = await fetch(`/api/admin/generate?ticker=${t}`);
      if (res.ok) {
        handleSetTicker(date, t);
        // Refresh available list
        const puzzlesRes = await fetch('/api/admin/puzzles');
        if (puzzlesRes.ok) setAvailable(await puzzlesRes.json());
        setStatus(`${t} READY`);
        setTimeout(() => setStatus(''), 2000);
      } else {
        setStatus(`ERR: FAILED TO GENERATE ${t}`);
      }
    } catch {
      setStatus('ERR: NETWORK');
    } finally {
      setGenerating(null);
    }
  };

  const availableTickers = available.map(p => p.ticker);

  const hasPuzzle = (ticker: string) =>
    availableTickers.some(t => t.toUpperCase() === ticker.toUpperCase());

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-terminal-muted tracking-widest uppercase">
          30-DAY SCHEDULE
        </div>
        {status && (
          <div className={`text-[10px] font-mono tracking-wider ${status.startsWith('ERR') ? 'text-terminal-red' : 'text-terminal-green'}`}>
            {status}
          </div>
        )}
      </div>

      <div className="border border-terminal-border max-h-[400px] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center text-[9px] text-terminal-muted tracking-widest uppercase
          border-b border-terminal-border bg-terminal-panel sticky top-0 z-10">
          <div className="w-24 px-2 py-1.5 border-r border-terminal-border">DATE</div>
          <div className="flex-1 px-2 py-1.5 border-r border-terminal-border">TICKER</div>
          <div className="w-28 px-2 py-1.5 text-center">ACTIONS</div>
        </div>

        {dates.map((date) => {
          const ticker = schedule[date] || '';
          const isEditing = editingDate === date;
          const today = isToday(date);
          const puzzleExists = ticker && hasPuzzle(ticker);
          const isGen = generating === date;
          const dayLabel = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });

          return (
            <div
              key={date}
              className={`
                flex items-center text-xs font-mono
                border-b border-terminal-border last:border-b-0
                ${today ? 'bg-terminal-green-dark/30' : 'bg-terminal-black'}
                ${isGen ? 'opacity-60' : ''}
              `}
            >
              {/* Date */}
              <div className={`w-24 px-2 py-1.5 border-r border-terminal-border shrink-0 ${today ? 'text-terminal-green' : 'text-terminal-muted'}`}>
                <div>{date.slice(5)}</div>
                <div className="text-[8px]">{dayLabel}{today ? ' \u25C0' : ''}</div>
              </div>

              {/* Ticker */}
              <div className="flex-1 px-2 py-1.5 border-r border-terminal-border">
                {isEditing ? (
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const t = editValue.trim().toUpperCase();
                          if (hasPuzzle(t)) {
                            handleSetTicker(date, t);
                          } else if (t) {
                            handleGenerateAndSet(date, t);
                          }
                        }
                        if (e.key === 'Escape') {
                          setEditingDate(null);
                          setEditValue('');
                        }
                      }}
                      autoFocus
                      placeholder="TICKER"
                      className="w-20 bg-terminal-dark text-terminal-text text-xs px-1.5 py-0.5
                        border border-terminal-green font-mono outline-none placeholder:text-terminal-border"
                    />
                    <button
                      onClick={() => {
                        const t = editValue.trim().toUpperCase();
                        if (hasPuzzle(t)) {
                          handleSetTicker(date, t);
                        } else if (t) {
                          handleGenerateAndSet(date, t);
                        }
                      }}
                      className="text-[9px] text-terminal-green hover:text-terminal-black
                        hover:bg-terminal-green px-1.5 border border-terminal-green transition-colors"
                    >
                      OK
                    </button>
                    <button
                      onClick={() => { setEditingDate(null); setEditValue(''); }}
                      className="text-[9px] text-terminal-muted hover:text-terminal-red px-1"
                    >
                      X
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {ticker ? (
                      <>
                        <span className={puzzleExists ? 'text-terminal-green' : 'text-terminal-yellow'}>
                          {ticker}
                        </span>
                        {!puzzleExists && (
                          <span className="text-[8px] text-terminal-red">NO DATA</span>
                        )}
                      </>
                    ) : (
                      <span className="text-terminal-border">---</span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="w-28 px-1.5 py-1 flex items-center gap-1 justify-center shrink-0">
                <button
                  onClick={() => { setEditingDate(date); setEditValue(ticker); }}
                  disabled={saving || isGen}
                  className="text-[9px] text-terminal-muted hover:text-terminal-yellow
                    border border-terminal-border hover:border-terminal-yellow
                    px-1.5 py-0.5 transition-colors disabled:opacity-30"
                >
                  EDIT
                </button>
                {ticker && puzzleExists && (
                  <button
                    onClick={() => onPreviewPuzzle(ticker)}
                    className="text-[9px] text-terminal-muted hover:text-terminal-green
                      border border-terminal-border hover:border-terminal-green
                      px-1.5 py-0.5 transition-colors"
                  >
                    TEST
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Available tickers legend */}
      <div>
        <div className="text-[9px] text-terminal-muted tracking-widest uppercase mb-1">
          AVAILABLE PUZZLES ({available.length})
        </div>
        <div className="flex flex-wrap gap-1">
          {available.map((p) => (
            <span
              key={p.ticker}
              className="text-[9px] font-mono text-terminal-green bg-terminal-dark
                border border-terminal-border px-1.5 py-0.5"
            >
              {p.ticker}
            </span>
          ))}
        </div>
        <div className="text-[8px] text-terminal-border mt-1">
          Editing a date with a new ticker auto-fetches from Yahoo Finance
        </div>
      </div>
    </div>
  );
}
