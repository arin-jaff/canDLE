import { WRONG_GUESS_PENALTY } from '../lib/scoring';

interface GuessListProps {
  guesses: string[];
  correctTicker: string;
  won: boolean;
}

export function GuessList({ guesses, correctTicker, won }: GuessListProps) {
  if (guesses.length === 0) return null;

  return (
    <div className="space-y-0 mt-2 border border-terminal-border">
      {guesses.map((guess, i) => {
        const isCorrect = guess === correctTicker && i === guesses.length - 1 && won;
        return (
          <div
            key={`${guess}-${i}`}
            className={`
              flex items-center gap-3 px-3 py-1.5 text-xs font-mono
              border-b border-terminal-border last:border-b-0
              ${isCorrect ? 'bg-fin-green/10' : ''}
            `}
          >
            <span className={`w-4 ${isCorrect ? 'text-fin-green' : 'text-terminal-red'}`}>
              {isCorrect ? '\u2713' : '\u2717'}
            </span>
            <span className={`font-semibold ${isCorrect ? 'text-fin-green' : 'text-terminal-text'}`}>
              {guess}
            </span>
            {!isCorrect && (
              <span className="text-terminal-red/60 ml-auto">-{WRONG_GUESS_PENALTY}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
