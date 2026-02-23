import { useState } from 'react';

interface OnboardingGuideProps {
  onComplete: () => void;
}

const STEPS = [
  {
    title: 'WELCOME TO canDLE',
    subtitle: 'The daily stock chart guessing game',
    content: 'Every day, you get a mystery stock chart. Your goal is to figure out which company it belongs to using the chart patterns and purchaseable hints.',
    visual: (
      <div className="flex items-center justify-center py-6">
        <div className="text-5xl font-bold tracking-wider">
          <span className="text-terminal-text">can</span>
          <span className="text-terminal-green">DLE</span>
        </div>
      </div>
    ),
  },
  {
    title: 'THE CHART',
    subtitle: 'Your primary clue',
    content: 'You start with the 1-month and 1-year price charts with a real price axis. Study the chart patterns, price range, and volatility to narrow down the stock. You can also toggle between candlestick and line views.',
    visual: (
      <div className="border border-terminal-border p-4 bg-terminal-dark">
        <div className="flex gap-1.5 mb-3">
          {['1M', '1Y'].map(t => (
            <div key={t} className="px-4 py-1.5 text-xs font-mono text-terminal-green bg-terminal-green-dark/30 border border-terminal-green/30">{t}</div>
          ))}
          {['5Y', 'ALL'].map(t => (
            <div key={t} className="px-4 py-1.5 text-xs font-mono text-terminal-border border border-terminal-border">{t} {'\u25A0'}</div>
          ))}
        </div>
        <div className="h-20 flex items-end gap-px">
          {[30, 45, 40, 55, 50, 65, 60, 70, 55, 75, 80, 70].map((h, i) => (
            <div key={i} className="flex-1 bg-terminal-green/60" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    ),
  },
  {
    title: 'BUY HINTS',
    subtitle: 'Spend points to reveal clues',
    content: 'You start with 1,000 points. Click any hint row to purchase it and reveal data about the stock — sector, industry, HQ country, company description, and more. Cheaper hints give less info; expensive hints are more revealing.',
    visual: (
      <div className="border border-terminal-border bg-terminal-dark text-xs font-mono">
        {[
          { label: 'HQ COUNTRY', cost: 25, color: 'text-terminal-green', val: 'United States' },
          { label: 'SECTOR', cost: 75, color: 'text-terminal-muted', val: null },
          { label: 'DESCRIPTION', cost: 175, color: 'text-terminal-muted', val: null },
        ].map(h => (
          <div key={h.label} className={`flex items-center px-4 py-3 border-b border-terminal-border last:border-b-0 ${h.val ? 'bg-terminal-green-dark/20' : ''}`}>
            <span className="text-terminal-muted uppercase tracking-wider w-28">{h.label}</span>
            <span className={`flex-1 ${h.val ? h.color : 'text-terminal-border'}`}>
              {h.val || '\u2500\u2500\u2500\u2500\u2500\u2500'}
            </span>
            {!h.val && <span className="text-terminal-red">-{h.cost}</span>}
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'GUESS THE TICKER',
    subtitle: 'Type and submit your answer',
    content: 'Use the search box to find and submit a stock ticker. Each wrong guess costs 50 points. If your bankroll hits 0, you lose. Your final score is your remaining points when you guess correctly!',
    visual: (
      <div className="space-y-2">
        <div className="border border-terminal-border bg-terminal-panel px-4 py-3 text-sm font-mono text-terminal-muted flex items-center gap-2">
          <span className="text-terminal-border">{'>'}</span>
          <span>Search for a ticker...</span>
        </div>
        <div className="flex gap-2 text-xs font-mono">
          <div className="px-3 py-1.5 border border-terminal-red text-terminal-red">MSFT {'\u2718'}</div>
          <div className="px-3 py-1.5 border border-terminal-red text-terminal-red">GOOG {'\u2718'}</div>
          <div className="px-3 py-1.5 border border-terminal-green text-terminal-green">AAPL {'\u2714'}</div>
        </div>
      </div>
    ),
  },
  {
    title: 'READY TO PLAY',
    subtitle: 'Good luck, trader',
    content: 'A new puzzle drops every day. Sign in with Google to track your stats across devices and compete for the best scores. Tap the ? button anytime to revisit this guide.',
    visual: (
      <div className="flex items-center justify-center py-4">
        <div className="grid grid-cols-4 gap-px bg-terminal-border text-center">
          {[
            { v: '0', l: 'PLAYED' },
            { v: '0', l: 'WON' },
            { v: '0', l: 'STREAK' },
            { v: '1000', l: 'BANKROLL' },
          ].map(s => (
            <div key={s.l} className="bg-terminal-panel px-4 py-3">
              <div className="text-xl font-mono font-bold text-terminal-green">{s.v}</div>
              <div className="text-[9px] text-terminal-muted tracking-widest uppercase">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

export function OnboardingGuide({ onComplete }: OnboardingGuideProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80" onClick={onComplete}>
      <div
        className="w-full max-w-xl border border-terminal-yellow bg-terminal-black mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-terminal-yellow px-4 py-3 bg-terminal-dark">
          <div>
            <div className="text-sm text-terminal-yellow tracking-widest uppercase font-medium">
              {current.title}
            </div>
            <div className="text-[11px] text-terminal-muted tracking-wider">{current.subtitle}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-terminal-muted font-mono">{step + 1}/{STEPS.length}</span>
            <button onClick={onComplete} className="text-terminal-muted hover:text-terminal-yellow text-sm">[X]</button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {current.visual}

          <p className="text-sm text-terminal-muted leading-relaxed">
            {current.content}
          </p>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 py-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === step ? 'bg-terminal-yellow' : i < step ? 'bg-terminal-green' : 'bg-terminal-border'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 px-4 py-3 text-xs uppercase tracking-widest
                  border border-terminal-border text-terminal-muted
                  hover:border-terminal-text hover:text-terminal-text
                  transition-colors"
              >
                BACK
              </button>
            )}
            <button
              onClick={() => isLast ? onComplete() : setStep(step + 1)}
              className="flex-1 px-4 py-3 text-xs uppercase tracking-widest
                border border-terminal-yellow text-terminal-yellow
                hover:bg-terminal-yellow hover:text-terminal-black
                transition-colors"
            >
              {isLast ? 'START PLAYING' : 'NEXT'}
            </button>
          </div>

          {!isLast && (
            <button
              onClick={onComplete}
              className="w-full text-[9px] text-terminal-border hover:text-terminal-muted tracking-wider uppercase transition-colors"
            >
              SKIP TUTORIAL
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
