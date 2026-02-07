import { useState, useEffect, useCallback } from 'react';
import type { PuzzleData } from '../lib/types';

function getTodayPuzzleIndex(): number {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  return seed % 3;
}

export function getPuzzleNumber(): number {
  const epoch = new Date('2025-01-01');
  const today = new Date();
  const diff = today.getTime() - epoch.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function usePuzzle() {
  const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPuzzle = useCallback((index: number) => {
    setLoading(true);
    setError(null);
    fetch(`/puzzles/sample-${index}.json`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load puzzle');
        return res.json();
      })
      .then((data: PuzzleData) => {
        setPuzzle(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const loadPuzzleByTicker = useCallback((ticker: string) => {
    setLoading(true);
    setError(null);
    fetch(`/puzzles/${ticker.toLowerCase()}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`No puzzle found for ${ticker}`);
        return res.json();
      })
      .then((data: PuzzleData) => {
        setPuzzle(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Load today's puzzle on mount
  useEffect(() => {
    const idx = getTodayPuzzleIndex();
    loadPuzzle(idx);
  }, [loadPuzzle]);

  return { puzzle, loading, error, loadPuzzle, loadPuzzleByTicker };
}
