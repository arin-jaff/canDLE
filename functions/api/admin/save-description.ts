/**
 * POST /api/admin/save-description
 * Saves a manually edited description (and optional fun facts) to the puzzle JSON
 * by committing to GitHub (triggering a Cloudflare Pages redeploy).
 */
import type { Env } from '../../lib/db';
import { getFile, commitFile } from '../../lib/github';

interface RequestContext {
  request: Request;
  env: Env;
}

export const onRequestPost = async ({ request, env }: RequestContext) => {
  try {
    const body = await request.json() as {
      ticker: string;
      description?: string;
      funFact1?: string;
      funFact2?: string;
    };

    if (!body.ticker) {
      return Response.json({ error: 'Missing ticker' }, { status: 400 });
    }

    const sanitized = body.ticker.replace(/[^a-zA-Z0-9.]/g, '').toLowerCase();
    const filePath = `public/puzzles/${sanitized}.json`;

    // Read current file from GitHub
    const file = await getFile(env.GITHUB_REPO, filePath, env.GITHUB_TOKEN);
    if (!file) {
      return Response.json({ error: `Puzzle file not found: ${filePath}` }, { status: 404 });
    }

    const puzzle = JSON.parse(file.content);

    // Update whichever fields were provided
    if (body.description !== undefined) puzzle.hints.description = body.description;
    if (body.funFact1 !== undefined) puzzle.hints.funFact1 = body.funFact1;
    if (body.funFact2 !== undefined) puzzle.hints.funFact2 = body.funFact2;

    // Commit to GitHub
    const newContent = JSON.stringify(puzzle, null, 2);
    const committed = await commitFile(
      env.GITHUB_REPO,
      filePath,
      newContent,
      file.sha,
      `admin: update description for ${body.ticker.toUpperCase()}`,
      env.GITHUB_TOKEN,
    );

    if (!committed) {
      return Response.json({ error: 'Failed to commit to GitHub' }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
};
