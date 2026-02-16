// API client for backend communication

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export interface Stats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  totalScore: number;
  scoreDistribution: number[];
}

export interface GameResult {
  puzzleId: string;
  date: string;
  won: boolean;
  score: number;
  guessCount: number;
  hintsUsed: number;
  difficulty?: number;
}

export interface GameHistoryEntry {
  puzzleId: string;
  date: string;
  won: boolean;
  score: number;
  guessCount: number;
  hintsUsed: number;
  difficulty: number | null;
}

export async function loginWithGoogle(idToken: string): Promise<UserInfo | null> {
  try {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user;
  } catch {
    return null;
  }
}

export async function fetchCurrentUser(): Promise<UserInfo | null> {
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) return null;
    const data = await res.json();
    return data.user;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch { /* ignore */ }
}

export async function submitGameResult(game: GameResult): Promise<Stats | null> {
  try {
    const res = await fetch('/api/game/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(game),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.stats;
  } catch {
    return null;
  }
}

export async function fetchStats(): Promise<Stats | null> {
  try {
    const res = await fetch('/api/stats');
    if (!res.ok) return null;
    const data = await res.json();
    return data.stats;
  } catch {
    return null;
  }
}

export async function fetchGameHistory(): Promise<GameHistoryEntry[]> {
  try {
    const res = await fetch('/api/game/history');
    if (!res.ok) return [];
    const data = await res.json();
    return data.games || [];
  } catch {
    return [];
  }
}
