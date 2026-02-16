// GET /api/game/history — Get user's game history
import { getUserFromRequest } from '../../lib/auth';
import type { Env } from '../../lib/db';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const user = await getUserFromRequest(request, env);
  if (!user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const result = await env.DB.prepare(
      'SELECT puzzle_id, date, won, score, guess_count, hints_used, difficulty FROM games WHERE user_id = ? ORDER BY date DESC LIMIT 50'
    ).bind(Number(user.sub)).all<{
      puzzle_id: string;
      date: string;
      won: number;
      score: number;
      guess_count: number;
      hints_used: number;
      difficulty: number | null;
    }>();

    const games = (result.results || []).map(g => ({
      puzzleId: g.puzzle_id,
      date: g.date,
      won: !!g.won,
      score: g.score,
      guessCount: g.guess_count,
      hintsUsed: g.hints_used,
      difficulty: g.difficulty,
    }));

    return Response.json({ games });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg }, { status: 500 });
  }
};
