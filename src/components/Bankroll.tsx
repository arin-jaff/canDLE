import { STARTING_BANKROLL } from '../lib/scoring';

interface BankrollProps {
  bankroll: number;
}

export function Bankroll({ bankroll }: BankrollProps) {
  const pct = (bankroll / STARTING_BANKROLL) * 100;
  const isLow = pct < 30;

  return (
    <div className="flex items-center gap-3 px-4 py-3 border border-terminal-border bg-terminal-dark">
      <span className="text-xs text-terminal-muted uppercase tracking-widest shrink-0">
        CAPITAL
      </span>
      <div className="flex-1 h-2 bg-terminal-black rounded-sm overflow-hidden">
        <div
          className={`h-full transition-all duration-300 rounded-sm ${isLow ? 'bg-terminal-red' : 'bg-terminal-green'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-sm font-mono font-semibold tabular-nums ${isLow ? 'text-terminal-red' : 'text-terminal-green'}`}>
        {bankroll}
        <span className="text-terminal-muted text-[10px] font-normal"> / {STARTING_BANKROLL}</span>
      </span>
    </div>
  );
}
