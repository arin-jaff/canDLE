import { WRONG_GUESS_PENALTY } from '../lib/scoring';

interface GuessListProps {
  guesses: string[];
  correctTicker: string;
  won: boolean;
}

export function GuessList({ guesses, correctTicker, won }: GuessListProps) {
  if (guesses.length === 0) return null;

  return (
    <div className="space-y-1 mt-2">
      {guesses.map((guess, i) => {
        const isCorrect = guess === correctTicker && i === guesses.length - 1 && won;
        return (
          <div
            key={`${guess}-${i}`}
            className={`
              flex items-center gap-3 px-3 py-1.5 text-xs font-mono
              ${isCorrect
                ? 'text-terminal-green'
                : 'text-terminal-red'
              }
            `}
          >
            <span className="w-4">{isCorrect ? '\u2713' : '\u2717'}</span>
            <span className="font-semibold">{guess}</span>
            {!isCorrect && (
              <span className="text-terminal-muted">(-{WRONG_GUESS_PENALTY})</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
