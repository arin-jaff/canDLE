/**
 * GitHub API helper for committing file updates to the repo.
 * Used by admin endpoints to persist puzzle changes.
 */

const API = 'https://api.github.com';

interface FileInfo {
  sha: string;
  content: string;
}

/** Get a file's current content and SHA from the repo */
export async function getFile(repo: string, path: string, token: string): Promise<FileInfo | null> {
  const res = await fetch(`${API}/repos/${repo}/contents/${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'canDLE-admin',
    },
  });
  if (!res.ok) return null;
  const data = await res.json() as { sha: string; content: string };
  // Decode base64 properly (handles UTF-8 content)
  const raw = atob(data.content.replace(/[\n\r]/g, ''));
  const bytes = Uint8Array.from(raw, (c) => c.charCodeAt(0));
  const decoded = new TextDecoder().decode(bytes);
  return { sha: data.sha, content: decoded };
}

/** Commit an updated file to the repo */
export async function commitFile(
  repo: string,
  path: string,
  content: string,
  sha: string,
  message: string,
  token: string,
): Promise<boolean> {
  const res = await fetch(`${API}/repos/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'canDLE-admin',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      // Encode UTF-8 content to base64 properly
      content: btoa(String.fromCharCode(...new TextEncoder().encode(content))),
      sha,
      committer: { name: 'canDLE Bot', email: 'bot@candle.game' },
    }),
  });
  return res.ok;
}
