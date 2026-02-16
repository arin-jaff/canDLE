// POST /api/game/complete — Save game result + compute stats
import { getUserFromRequest } from '../../lib/auth';
import type { Env } from '../../lib/db';

interface GameResult {
  puzzleId: string;
  date: string;
  won: boolean;
  score: number;
  guessCount: number;
  hintsUsed: number;
  difficulty?: number;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const user = await getUserFromRequest(request, env);
  if (!user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const game = await request.json() as GameResult;
    const userId = Number(user.sub);

    // Check duplicate
    const existing = await env.DB.prepare(
      'SELECT id FROM games WHERE user_id = ? AND puzzle_id = ?'
    ).bind(userId, game.puzzleId).first();

    if (existing) {
      return Response.json({ ok: true, duplicate: true });
    }

    // Insert game
    await env.DB.prepare(
      'INSERT INTO games (user_id, puzzle_id, date, won, score, guess_count, hints_used, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(userId, game.puzzleId, game.date, game.won ? 1 : 0, game.score, game.guessCount, game.hintsUsed, game.difficulty ?? null).run();

    // Compute stats from all games
    const games = await env.DB.prepare(
      'SELECT won, score FROM games WHERE user_id = ? ORDER BY date ASC'
    ).bind(userId).all<{ won: number; score: number }>();

    const rows = games.results || [];
    let gamesPlayed = rows.length;
    let gamesWon = 0;
    let totalScore = 0;
    let currentStreak = 0;
    let maxStreak = 0;
    let streak = 0;
    const scoreDistribution = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    for (const g of rows) {
      if (g.won) {
        gamesWon++;
        streak++;
        maxStreak = Math.max(maxStreak, streak);
        totalScore += g.score;
        const bucket = Math.min(9, Math.floor(g.score / 100));
        scoreDistribution[bucket]++;
      } else {
        streak = 0;
        scoreDistribution[0]++;
      }
    }
    currentStreak = streak;

    return Response.json({
      ok: true,
      stats: { gamesPlayed, gamesWon, currentStreak, maxStreak, totalScore, scoreDistribution },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg }, { status: 500 });
  }
};
