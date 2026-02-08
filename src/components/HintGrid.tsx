import { useState } from 'react';
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

const CATEGORIES: { key: string; label: string; ids: string[] }[] = [
  { key: 'all', label: 'ALL', ids: [] },
  { key: 'technical', label: 'TECHNICAL', ids: ['1y', '5y', '10y', 'high52w', 'priceAxis'] },
  { key: 'fundamental', label: 'FUNDAMENTAL', ids: ['sector', 'industry', 'marketCapRange', 'ipoYear'] },
  { key: 'company', label: 'COMPANY', ids: ['hqCountry', 'description'] },
];

export function HintGrid({ puzzle, revealedHints, bankroll, disabled, onBuyHint }: HintGridProps) {
  const [activeTab, setActiveTab] = useState('all');

  const filtered = activeTab === 'all'
    ? HINT_DEFINITIONS
    : HINT_DEFINITIONS.filter((h) => {
        const cat = CATEGORIES.find((c) => c.key === activeTab);
        return cat?.ids.includes(h.id);
      });

  return (
    <div>
      {/* Category tabs */}
      <div className="flex border-b border-terminal-border mb-0">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveTab(cat.key)}
            className={`
              px-3 py-1.5 text-[10px] uppercase tracking-wider transition-colors
              ${activeTab === cat.key
                ? 'text-terminal-green border-b-2 border-terminal-green bg-terminal-green-dark/30'
                : 'text-terminal-muted hover:text-terminal-text'
              }
            `}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Data table */}
      <div className="border border-terminal-border border-t-0">
        {/* Table header */}
        <div className="flex items-center px-3 py-1.5 bg-terminal-dark border-b border-terminal-border">
          <span className="flex-1 text-[9px] text-terminal-muted uppercase tracking-widest">Metric</span>
          <span className="w-20 text-right text-[9px] text-terminal-muted uppercase tracking-widest">Cost</span>
        </div>

        {/* Rows */}
        {filtered.map((hint) => (
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
    </div>
  );
}
