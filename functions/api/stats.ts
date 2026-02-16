// GET /api/stats — Compute user stats from game history
import { getUserFromRequest } from '../lib/auth';
import type { Env } from '../lib/db';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const user = await getUserFromRequest(request, env);
  if (!user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const games = await env.DB.prepare(
      'SELECT won, score FROM games WHERE user_id = ? ORDER BY date ASC'
    ).bind(Number(user.sub)).all<{ won: number; score: number }>();

    const rows = games.results || [];

    if (rows.length === 0) {
      return Response.json({
        stats: {
          gamesPlayed: 0,
          gamesWon: 0,
          currentStreak: 0,
          maxStreak: 0,
          totalScore: 0,
          scoreDistribution: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        },
      });
    }

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
      stats: {
        gamesPlayed: rows.length,
        gamesWon,
        currentStreak,
        maxStreak,
        totalScore,
        scoreDistribution,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg }, { status: 500 });
  }
};
