import { useState, useEffect, useCallback } from 'react';
import type { PuzzleData } from '../lib/types';

function getTodayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

  // Load today's puzzle from schedule on mount
  useEffect(() => {
    const today = getTodayDate();

    fetch('/schedule.json')
      .then((res) => {
        if (!res.ok) throw new Error('No schedule');
        return res.json();
      })
      .then((schedule: Record<string, string>) => {
        const ticker = schedule[today];
        if (ticker) {
          return fetch(`/puzzles/${ticker.toLowerCase()}.json`);
        }
        // Fallback: load sample-0
        return fetch('/puzzles/sample-0.json');
      })
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

  return { puzzle, loading, error, loadPuzzleByTicker };
}
