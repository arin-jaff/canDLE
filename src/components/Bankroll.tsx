import { STARTING_BANKROLL } from '../lib/scoring';

interface BankrollProps {
  bankroll: number;
}

export function Bankroll({ bankroll }: BankrollProps) {
  const pct = (bankroll / STARTING_BANKROLL) * 100;
  const isLow = pct < 30;

  return (
    <div className="border border-terminal-border bg-terminal-panel p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-terminal-muted tracking-widest uppercase">
          BANKROLL
        </span>
        <span className={`text-sm font-mono font-semibold ${isLow ? 'text-terminal-red' : 'text-terminal-green'}`}>
          {bankroll} / {STARTING_BANKROLL}
        </span>
      </div>
      <div className="w-full h-2 bg-terminal-black border border-terminal-border">
        <div
          className={`h-full transition-all duration-300 ${isLow ? 'bg-terminal-red' : 'bg-terminal-green'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
