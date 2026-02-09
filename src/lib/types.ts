export interface PuzzleData {
  id: string;
  answer: {
    ticker: string;
    name: string;
  };
  basePrice: number;
  basePrices?: Record<string, number>;
  difficulty?: number;
  charts: {
    '1y': number[][];
    '1m': number[][];
    '5y': number[][];
    '10y': number[][];
  };
  hints: {
    sector: string;
    industry: string;
    marketCapRange: string;
    hqCountry: string;
    description: string;
    high52w: number;
    low52w: number;
    ipoYear: number;
  };
}

export interface GameState {
  puzzleId: string;
  bankroll: number;
  revealedHints: string[];
  guesses: string[];
  won: boolean;
  lost: boolean;
  activeChart: '1y' | '1m' | '5y' | '10y';
}

export interface Stats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  totalScore: number;
  scoreDistribution: number[];
}
