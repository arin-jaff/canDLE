import { HINT_DEFINITIONS } from '../lib/scoring';
import type { PuzzleData } from '../lib/types';
import { HintCard } from './HintCard';

interface HintGridProps {
  puzzle: PuzzleData;
  revealedHints: string[];
  bankroll: number;
  disabled: boolean;
  onBuyHint: (hintId: string) => void;
}

export function HintGrid({ puzzle, revealedHints, bankroll, disabled, onBuyHint }: HintGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-[1px] bg-terminal-border">
      {HINT_DEFINITIONS.map((hint) => (
        <HintCard
          key={hint.id}
          hint={hint}
          revealed={revealedHints.includes(hint.id)}
          puzzle={puzzle}
          bankroll={bankroll}
          disabled={disabled}
          onBuy={onBuyHint}
        />
      ))}
    </div>
  );
}
