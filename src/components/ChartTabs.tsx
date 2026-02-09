import { useGameStore } from '../hooks/useGameState';

type Timeframe = '1m' | '1y' | '5y' | '10y';

const TABS: { key: Timeframe; label: string }[] = [
  { key: '1m', label: '1M' },
  { key: '1y', label: '1Y' },
  { key: '5y', label: '5Y' },
  { key: '10y', label: '10Y' },
];

export function ChartTabs() {
  const { state, setActiveChart } = useGameStore();
  const { activeChart, revealedHints } = state;

  const gameOver = state.won || state.lost;
  const isUnlocked = (key: Timeframe) => gameOver || key === '1m' || revealedHints.includes(key);

  return (
    <div className="flex gap-0 border border-terminal-border border-t-0 bg-terminal-dark">
      {TABS.map(({ key, label }) => {
        const unlocked = isUnlocked(key);
        const active = activeChart === key;

        return (
          <button
            key={key}
            onClick={() => unlocked && setActiveChart(key)}
            disabled={!unlocked}
            className={`
              flex-1 py-2 px-3 text-xs font-mono uppercase tracking-wider
              border-r border-terminal-border last:border-r-0
              transition-colors duration-100
              ${active
                ? 'bg-terminal-green-dark text-terminal-green border-b-2 border-b-terminal-green'
                : unlocked
                  ? 'text-terminal-muted hover:text-terminal-green hover:bg-terminal-panel'
                  : 'text-terminal-border cursor-not-allowed'
              }
            `}
          >
            {unlocked ? label : `${label} \u25A0`}
          </button>
        );
      })}
    </div>
  );
}
