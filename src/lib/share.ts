import { STARTING_BANKROLL } from './scoring';

export function generateShareText(
  puzzleNumber: number,
  score: number,
  hintsUsed: number,
  guessCount: number,
  won: boolean
): string {
  const filled = Math.round((score / STARTING_BANKROLL) * 10);
  const bar = won
    ? '\u2593'.repeat(filled) + '\u2591'.repeat(10 - filled)
    : '\u2591'.repeat(10);

  const lines = [
    `canDLE #${puzzleNumber} \u2014 ${won ? score : 'X'}/${STARTING_BANKROLL}`,
    bar,
    `Hints: ${hintsUsed} | Guesses: ${guessCount}`,
    'candle.game',
  ];

  return lines.join('\n');
}
