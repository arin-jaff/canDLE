import { STARTING_BANKROLL } from '../lib/scoring';

interface GameOverProps {
  won: boolean;
  bankroll: number;
  answer: { ticker: string; name: string };
  guessCount: number;
  hintsUsed: number;
  difficulty?: number;
}

export function GameOver({ won, bankroll, answer, guessCount, hintsUsed, difficulty }: GameOverProps) {
  return (
    <div className="border border-terminal-border bg-terminal-panel p-4">
      <div className={`text-center mb-3 ${won ? 'text-fin-green' : 'text-terminal-red'}`}>
        <div className="text-[10px] tracking-widest uppercase mb-1 text-terminal-muted">
          {won ? 'CORRECT' : 'GAME OVER'}
        </div>
        <div className="text-2xl font-bold font-mono text-terminal-green">
          {answer.ticker}
        </div>
        <div className="text-xs text-terminal-muted mt-1">
          {answer.name}
        </div>
      </div>

      <div className={`grid ${difficulty ? 'grid-cols-4' : 'grid-cols-3'} gap-px bg-terminal-border text-center`}>
        <div className="bg-terminal-dark p-2">
          <div className="text-lg font-mono font-bold text-terminal-green">
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
        {difficulty && (
          <div className="bg-terminal-dark p-2">
            <div className="text-lg font-mono font-bold text-terminal-text">
              {'\u2588'.repeat(difficulty)}<span className="text-terminal-border">{'\u2588'.repeat(5 - difficulty)}</span>
            </div>
            <div className="text-[9px] text-terminal-muted tracking-widest uppercase">
              DIFFICULTY
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
