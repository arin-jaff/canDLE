/**
 * POST /api/admin/generate
 * Triggers the GitHub Actions workflow to generate a puzzle for a specific ticker.
 * The workflow runs Python + yfinance to fetch stock data, then commits the puzzle JSON.
 */
import type { Env } from '../../lib/db';

interface RequestContext {
  request: Request;
  env: Env;
}

export const onRequestPost = async ({ request, env }: RequestContext) => {
  try {
    const { ticker } = await request.json() as { ticker: string };
    if (!ticker) {
      return Response.json({ error: 'Missing ticker' }, { status: 400 });
    }

    const sanitized = ticker.replace(/[^a-zA-Z0-9.]/g, '').toUpperCase();

    // Trigger the daily-puzzle workflow via GitHub API with the specific ticker
    const res = await fetch(
      `https://api.github.com/repos/${env.GITHUB_REPO}/actions/workflows/daily-puzzle.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'canDLE-admin',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: { ticker: sanitized },
        }),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      return Response.json(
        { error: `GitHub API error (${res.status}): ${text.slice(0, 200)}` },
        { status: 500 },
      );
    }

    // GitHub returns 204 No Content on success
    return Response.json({
      ok: true,
      ticker: sanitized,
      message: `Workflow triggered for ${sanitized}. Puzzle will be generated and deployed in ~2-3 minutes.`,
    });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
};
