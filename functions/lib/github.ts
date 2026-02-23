/**
 * GitHub API helper for committing file updates to the repo.
 * Used by admin endpoints to persist puzzle changes.
 */

const API = 'https://api.github.com';

interface FileInfo {
  sha: string;
  content: string;
}

const headers = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github.v3+json',
  'User-Agent': 'canDLE-admin',
});

/** Get a file's current content and SHA from the repo */
export async function getFile(repo: string, path: string, token: string): Promise<FileInfo | null> {
  // Get SHA from the contents API
  const metaRes = await fetch(`${API}/repos/${repo}/contents/${path}`, {
    headers: headers(token),
  });
  if (!metaRes.ok) return null;
  const meta = await metaRes.json() as { sha: string; download_url: string };

  // Get raw content via download_url (avoids base64 decoding issues)
  const rawRes = await fetch(meta.download_url);
  if (!rawRes.ok) return null;
  const content = await rawRes.text();

  return { sha: meta.sha, content };
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
  // Encode content to base64 in chunks (avoids stack overflow on large files)
  const encoded = new TextEncoder().encode(content);
  let binStr = '';
  const chunkSize = 8192;
  for (let i = 0; i < encoded.length; i += chunkSize) {
    const chunk = encoded.subarray(i, i + chunkSize);
    binStr += String.fromCharCode(...chunk);
  }
  const b64 = btoa(binStr);

  const res = await fetch(`${API}/repos/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      ...headers(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      content: b64,
      sha,
      committer: { name: 'canDLE Bot', email: 'bot@candle.game' },
    }),
  });
  return res.ok;
}
