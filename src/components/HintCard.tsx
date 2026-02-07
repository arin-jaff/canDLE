import type { HintDef } from '../lib/scoring';
import type { PuzzleData } from '../lib/types';

interface HintCardProps {
  hint: HintDef;
  revealed: boolean;
  puzzle: PuzzleData;
  bankroll: number;
  disabled: boolean;
  onBuy: (hintId: string) => void;
}

function formatHintValue(hint: HintDef, puzzle: PuzzleData): string {
  const h = puzzle.hints;
  switch (hint.id) {
    case 'sector': return h.sector;
    case 'marketCapRange': return h.marketCapRange;
    case 'hqCountry': return h.hqCountry;
    case 'description': return h.description;
    case 'high52w': return `H: $${h.high52w.toFixed(2)} / L: $${h.low52w.toFixed(2)}`;
    case 'industry': return h.industry;
    case 'ipoYear': return String(h.ipoYear);
    case '1m': return 'Chart unlocked';
    case '5y': return 'Chart unlocked';
    case '10y': return 'Chart unlocked';
    case 'priceAxis': return 'Price axis revealed';
    default: return '';
  }
}

export function HintCard({ hint, revealed, puzzle, bankroll, disabled, onBuy }: HintCardProps) {
  const canAfford = bankroll >= hint.cost;

  if (revealed) {
    return (
      <div className="hint-reveal border border-terminal-green-dark bg-terminal-dark p-3">
        <div className="text-[10px] text-terminal-green tracking-widest uppercase mb-1">
          {hint.label}
        </div>
        <div className="text-xs text-terminal-text leading-snug">
          {formatHintValue(hint, puzzle)}
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => onBuy(hint.id)}
      disabled={disabled || !canAfford}
      className={`
        w-full text-left border p-3
        transition-colors duration-100
        ${disabled
          ? 'border-terminal-border bg-terminal-black cursor-not-allowed opacity-40'
          : canAfford
            ? 'border-terminal-border bg-terminal-panel hover:border-terminal-green-dim hover:bg-terminal-dark cursor-pointer'
            : 'border-terminal-border bg-terminal-black cursor-not-allowed opacity-60'
        }
      `}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-terminal-muted tracking-widest uppercase">
          {hint.label}
        </span>
        <span className="text-[10px] text-terminal-red font-mono">
          -{hint.cost}
        </span>
      </div>
      <div className="mt-1 text-xs text-terminal-border">
        {'\u25A0'.repeat(8)}
      </div>
    </button>
  );
}
