import { create } from 'zustand';
import type { GameState, Stats } from '../lib/types';
import { STARTING_BANKROLL, WRONG_GUESS_PENALTY, HINT_DEFINITIONS } from '../lib/scoring';

function getTodayKey(): string {
  const d = new Date();
  return `candle-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function loadDailyState(): GameState | null {
  try {
    const raw = localStorage.getItem(getTodayKey());
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveDailyState(state: GameState) {
  try {
    localStorage.setItem(getTodayKey(), JSON.stringify(state));
  } catch { /* ignore */ }
}

function loadStats(): Stats {
  try {
    const raw = localStorage.getItem('candle-stats');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    totalScore: 0,
    scoreDistribution: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  };
}

function saveStats(stats: Stats) {
  try {
    localStorage.setItem('candle-stats', JSON.stringify(stats));
  } catch { /* ignore */ }
}

interface GameStore {
  state: GameState;
  stats: Stats;
  init: (puzzleId: string) => void;
  reset: (puzzleId: string) => void;
  buyHint: (hintId: string) => boolean;
  submitGuess: (ticker: string, correctTicker: string) => 'correct' | 'wrong' | 'lost';
  setActiveChart: (chart: '1y' | '1m' | '5y' | '10y') => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  state: {
    puzzleId: '',
    bankroll: STARTING_BANKROLL,
    revealedHints: [],
    guesses: [],
    won: false,
    lost: false,
    activeChart: '1y',
  },
  stats: loadStats(),

  init: (puzzleId: string) => {
    const saved = loadDailyState();
    if (saved && saved.puzzleId === puzzleId) {
      set({ state: saved });
    } else {
      const fresh: GameState = {
        puzzleId,
        bankroll: STARTING_BANKROLL,
        revealedHints: [],
        guesses: [],
        won: false,
        lost: false,
        activeChart: '1y',
      };
      set({ state: fresh });
      saveDailyState(fresh);
    }
  },

  reset: (puzzleId: string) => {
    try {
      localStorage.removeItem(getTodayKey());
    } catch { /* ignore */ }
    const fresh: GameState = {
      puzzleId,
      bankroll: STARTING_BANKROLL,
      revealedHints: [],
      guesses: [],
      won: false,
      lost: false,
      activeChart: '1y',
    };
    set({ state: fresh });
    saveDailyState(fresh);
  },

  buyHint: (hintId: string) => {
    const { state } = get();
    if (state.won || state.lost) return false;
    if (state.revealedHints.includes(hintId)) return false;

    const hint = HINT_DEFINITIONS.find((h) => h.id === hintId);
    if (!hint) return false;
    if (state.bankroll < hint.cost) return false;

    const newState: GameState = {
      ...state,
      bankroll: state.bankroll - hint.cost,
      revealedHints: [...state.revealedHints, hintId],
    };

    if (newState.bankroll <= 0) {
      newState.lost = true;
      newState.bankroll = 0;
    }

    set({ state: newState });
    saveDailyState(newState);
    return true;
  },

  submitGuess: (ticker: string, correctTicker: string) => {
    const { state, stats } = get();
    if (state.won || state.lost) return 'lost';

    const isCorrect = ticker.toUpperCase() === correctTicker.toUpperCase();
    const newGuesses = [...state.guesses, ticker.toUpperCase()];

    if (isCorrect) {
      const newState: GameState = {
        ...state,
        guesses: newGuesses,
        won: true,
      };
      const newStats: Stats = {
        ...stats,
        gamesPlayed: stats.gamesPlayed + 1,
        gamesWon: stats.gamesWon + 1,
        currentStreak: stats.currentStreak + 1,
        maxStreak: Math.max(stats.maxStreak, stats.currentStreak + 1),
        totalScore: stats.totalScore + state.bankroll,
        scoreDistribution: [...stats.scoreDistribution],
      };
      const bucket = Math.min(9, Math.floor(state.bankroll / 100));
      newStats.scoreDistribution[bucket]++;

      set({ state: newState, stats: newStats });
      saveDailyState(newState);
      saveStats(newStats);
      return 'correct';
    }

    const newBankroll = state.bankroll - WRONG_GUESS_PENALTY;
    const isLost = newBankroll <= 0;

    const newState: GameState = {
      ...state,
      guesses: newGuesses,
      bankroll: Math.max(0, newBankroll),
      lost: isLost,
    };

    if (isLost) {
      const newStats: Stats = {
        ...stats,
        gamesPlayed: stats.gamesPlayed + 1,
        currentStreak: 0,
        scoreDistribution: [...stats.scoreDistribution],
      };
      newStats.scoreDistribution[0]++;
      set({ state: newState, stats: newStats });
      saveStats(newStats);
    } else {
      set({ state: newState });
    }

    saveDailyState(newState);
    return isLost ? 'lost' : 'wrong';
  },

  setActiveChart: (chart) => {
    const { state } = get();
    const chartHints = ['1m', '5y', '10y'];
    if (chart !== '1y' && !state.revealedHints.includes(chart) && chartHints.includes(chart)) {
      return;
    }
    const newState = { ...state, activeChart: chart };
    set({ state: newState });
    saveDailyState(newState);
  },
}));
