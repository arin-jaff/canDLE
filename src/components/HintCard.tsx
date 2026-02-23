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
    case '1y': return 'Chart unlocked';
    case '5y': return 'Chart unlocked';
    case '10y': return 'Chart unlocked';
    default: return '';
  }
}

function getHintDescription(id: string): string {
  switch (id) {
    case 'hqCountry': return 'Country where the company is headquartered';
    case 'ipoYear': return 'Year the stock first went public';
    case 'sector': return 'Broad market sector (e.g. Technology, Healthcare)';
    case 'marketCapRange': return 'Market capitalization size range';
    case 'industry': return 'Specific industry within the sector';
    case 'high52w': return '52-week high and low stock prices';
    case 'description': return 'AI-generated company description with key names redacted';
    case '5y': return 'Unlock the 5-year price chart';
    case '10y': return 'Unlock the all-time price chart';
    default: return '';
  }
}

export function HintCard({ hint, revealed, puzzle, bankroll, disabled, onBuy }: HintCardProps) {
  const canAfford = bankroll >= hint.cost;
  const desc = getHintDescription(hint.id);

  if (revealed) {
    return (
      <div className="hint-reveal flex items-start gap-3 px-3 py-2.5 border-b border-terminal-border last:border-b-0 bg-terminal-green-dark/20">
        <span className="text-[10px] text-terminal-muted uppercase tracking-wider w-24 shrink-0 pt-0.5">
          {hint.label}
        </span>
        <span className="flex-1 text-xs font-mono text-terminal-green leading-snug">
          {formatHintValue(hint, puzzle)}
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={() => onBuy(hint.id)}
      disabled={disabled || !canAfford}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5
        border-b border-terminal-border last:border-b-0
        transition-colors duration-100 text-left
        ${disabled
          ? 'cursor-not-allowed opacity-40'
          : canAfford
            ? 'hover:bg-terminal-panel cursor-pointer'
            : 'cursor-not-allowed opacity-50'
        }
      `}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-terminal-muted uppercase tracking-wider w-24 shrink-0">
            {hint.label}
          </span>
          <span className="flex-1 text-xs text-terminal-border font-mono">
            {'\u2500'.repeat(6)}
          </span>
        </div>
        {desc && (
          <div className="text-[9px] text-terminal-border mt-0.5 pl-[104px]">{desc}</div>
        )}
      </div>
      <span className="text-[11px] text-terminal-red font-mono w-16 text-right shrink-0">
        -{hint.cost}
      </span>
    </button>
  );
}
