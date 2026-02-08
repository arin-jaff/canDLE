import { useState, useRef, useEffect } from 'react';
import tickers from '../data/tickers.json';

interface GuessInputProps {
  onSubmit: (ticker: string) => void;
  disabled: boolean;
  previousGuesses: string[];
}

export function GuessInput({ onSubmit, disabled, previousGuesses }: GuessInputProps) {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtered = query.length > 0
    ? tickers
        .filter(
          (t) =>
            !previousGuesses.includes(t.ticker) &&
            (t.ticker.toLowerCase().includes(query.toLowerCase()) ||
              t.name.toLowerCase().includes(query.toLowerCase()))
        )
        .slice(0, 8)
    : [];

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSubmit = (ticker?: string) => {
    const value = ticker || (filtered.length > 0 ? filtered[selectedIndex]?.ticker : query);
    if (!value) return;
    const match = tickers.find(
      (t) => t.ticker.toLowerCase() === value.toLowerCase()
    );
    if (match) {
      onSubmit(match.ticker);
      setQuery('');
      setShowDropdown(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex border border-terminal-border bg-terminal-dark">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => query.length > 0 && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? 'GAME OVER' : 'Search ticker or company...'}
          className={`
            flex-1 bg-transparent text-terminal-text text-sm px-3 py-2.5
            font-mono placeholder:text-terminal-border
            outline-none
            ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
          `}
        />
        <button
          onClick={() => handleSubmit()}
          disabled={disabled || filtered.length === 0}
          className={`
            px-5 py-2.5 text-xs font-semibold uppercase tracking-wider
            border-l border-terminal-border
            transition-colors duration-100
            ${disabled || filtered.length === 0
              ? 'bg-terminal-panel text-terminal-border cursor-not-allowed'
              : 'bg-terminal-green-dark text-terminal-green hover:bg-terminal-green hover:text-terminal-black'
            }
          `}
        >
          SUBMIT
        </button>
      </div>

      {showDropdown && filtered.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 top-full left-0 right-0 border border-terminal-border border-t-0 bg-terminal-panel max-h-64 overflow-y-auto"
        >
          {filtered.map((t, i) => (
            <button
              key={t.ticker}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSubmit(t.ticker);
              }}
              className={`
                w-full text-left px-3 py-2 text-xs font-mono flex items-center gap-3
                border-b border-terminal-border last:border-b-0
                ${i === selectedIndex
                  ? 'bg-terminal-green-dark text-terminal-green'
                  : 'text-terminal-text hover:bg-terminal-dark'
                }
              `}
            >
              <span className="text-terminal-green font-semibold w-14 shrink-0">
                {t.ticker}
              </span>
              <span className="text-terminal-muted truncate">
                {t.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
