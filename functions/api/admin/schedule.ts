/**
 * POST /api/admin/schedule
 * Saves the updated schedule.json by committing to GitHub
 * (triggering a Cloudflare Pages redeploy).
 */
import type { Env } from '../../lib/db';
import { getFile, commitFile } from '../../lib/github';

interface RequestContext {
  request: Request;
  env: Env;
}

export const onRequestPost = async ({ request, env }: RequestContext) => {
  try {
    const bodyText = await request.text();
    let newSchedule: Record<string, string>;
    try {
      newSchedule = JSON.parse(bodyText);
    } catch {
      return Response.json({ error: `Invalid JSON body: ${bodyText.slice(0, 100)}` }, { status: 400 });
    }

    if (!newSchedule || typeof newSchedule !== 'object') {
      return Response.json({ error: 'Invalid schedule data' }, { status: 400 });
    }

    const filePath = 'public/schedule.json';

    // Read current file from GitHub (need SHA for commit)
    const file = await getFile(env.GITHUB_REPO, filePath, env.GITHUB_TOKEN);
    if (!file) {
      return Response.json({ error: 'schedule.json not found in repo' }, { status: 404 });
    }

    // Commit updated schedule
    const newContent = JSON.stringify(newSchedule, null, 2);
    const committed = await commitFile(
      env.GITHUB_REPO,
      filePath,
      newContent,
      file.sha,
      'admin: update schedule',
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
