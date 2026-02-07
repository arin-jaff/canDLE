import { STARTING_BANKROLL } from '../lib/scoring';

interface GameOverProps {
  won: boolean;
  bankroll: number;
  answer: { ticker: string; name: string };
  guessCount: number;
  hintsUsed: number;
}

export function GameOver({ won, bankroll, answer, guessCount, hintsUsed }: GameOverProps) {
  return (
    <div className="border border-terminal-border bg-terminal-panel p-4">
      <div className={`text-center mb-3 ${won ? 'text-terminal-green' : 'text-terminal-red'}`}>
        <div className="text-xs tracking-widest uppercase mb-1">
          {won ? '// CORRECT //' : '// GAME OVER //'}
        </div>
        <div className="text-2xl font-bold font-mono">
          {answer.ticker}
        </div>
        <div className="text-xs text-terminal-muted mt-1">
          {answer.name}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-[1px] bg-terminal-border text-center">
        <div className="bg-terminal-dark p-2">
          <div className="text-lg font-mono font-bold text-terminal-text">
            {won ? bankroll : 0}
          </div>
          <div className="text-[9px] text-terminal-muted tracking-widest uppercase">
            SCORE/{STARTING_BANKROLL}
          </div>
        </div>
        <div className="bg-terminal-dark p-2">
          <div className="text-lg font-mono font-bold text-terminal-text">
            {guessCount}
          </div>
          <div className="text-[9px] text-terminal-muted tracking-widest uppercase">
            GUESSES
          </div>
        </div>
        <div className="bg-terminal-dark p-2">
          <div className="text-lg font-mono font-bold text-terminal-text">
            {hintsUsed}
          </div>
          <div className="text-[9px] text-terminal-muted tracking-widest uppercase">
            HINTS
          </div>
        </div>
      </div>
    </div>
  );
}
