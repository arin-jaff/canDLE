/**
 * POST /api/admin/regen-description
 * Regenerates description, fun facts, and difficulty for a puzzle via Gemini,
 * then commits the updated puzzle JSON to GitHub (triggering a Cloudflare Pages redeploy).
 */
import type { Env } from '../../lib/db';
import { getFile, commitFile } from '../../lib/github';
import { generateDescription, generateDifficulty } from '../../lib/gemini';

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

    const sanitized = ticker.replace(/[^a-zA-Z0-9.]/g, '').toLowerCase();
    const filePath = `public/puzzles/${sanitized}.json`;

    // Read the current puzzle from GitHub
    const file = await getFile(env.GITHUB_REPO, filePath, env.GITHUB_TOKEN);
    if (!file) {
      return Response.json({ error: `Puzzle file not found: ${filePath}` }, { status: 404 });
    }

    let puzzle;
    try {
      puzzle = JSON.parse(file.content);
    } catch (parseErr) {
      return Response.json({ error: `Failed to parse puzzle JSON for ${sanitized}: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}` }, { status: 500 });
    }
    const name = puzzle.answer?.name || ticker.toUpperCase();
    const hints = puzzle.hints || {};

    // Generate new description + fun facts via Gemini
    const result = await generateDescription(
      env.GEMINI_API_KEY,
      ticker.toUpperCase(),
      name,
      hints.sector || 'Unknown',
      hints.industry || 'Unknown',
    );

    if (result) {
      puzzle.hints.description = result.description;
      puzzle.hints.funFact1 = result.funFact1;
      puzzle.hints.funFact2 = result.funFact2;
    } else {
      return Response.json({ error: 'Gemini API failed to generate description' }, { status: 500 });
    }

    // Generate difficulty rating
    const difficulty = await generateDifficulty(
      env.GEMINI_API_KEY,
      ticker.toUpperCase(),
      name,
      hints.sector || 'Unknown',
      hints.industry || 'Unknown',
    );
    puzzle.difficulty = difficulty;

    // Commit updated puzzle to GitHub
    const newContent = JSON.stringify(puzzle, null, 2);
    const committed = await commitFile(
      env.GITHUB_REPO,
      filePath,
      newContent,
      file.sha,
      `admin: regen description for ${ticker.toUpperCase()}`,
      env.GITHUB_TOKEN,
    );

    if (!committed) {
      return Response.json({ error: 'Failed to commit to GitHub' }, { status: 500 });
    }

    return Response.json({
      ok: true,
      ticker: ticker.toUpperCase(),
      description: result.description,
      funFact1: result.funFact1,
      funFact2: result.funFact2,
      difficulty,
    });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
};
