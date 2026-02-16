// POST /api/auth/google — Exchange Google ID token for session
import { verifyGoogleToken, signJWT, getSessionCookie } from '../../lib/auth';
import type { Env } from '../../lib/db';

interface GoogleAuthBody {
  idToken: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body = await request.json() as GoogleAuthBody;
    if (!body.idToken) {
      return Response.json({ error: 'Missing idToken' }, { status: 400 });
    }

    const googleUser = await verifyGoogleToken(body.idToken, env.GOOGLE_CLIENT_ID);
    if (!googleUser) {
      return Response.json({ error: 'Invalid Google token' }, { status: 401 });
    }

    // Upsert user
    const existing = await env.DB.prepare(
      'SELECT id FROM users WHERE google_id = ?'
    ).bind(googleUser.sub).first<{ id: number }>();

    let userId: number;

    if (existing) {
      userId = existing.id;
      await env.DB.prepare(
        "UPDATE users SET email = ?, name = ?, picture = ?, last_login = datetime('now') WHERE id = ?"
      ).bind(googleUser.email, googleUser.name, googleUser.picture, userId).run();
    } else {
      const result = await env.DB.prepare(
        'INSERT INTO users (google_id, email, name, picture) VALUES (?, ?, ?, ?)'
      ).bind(googleUser.sub, googleUser.email, googleUser.name, googleUser.picture).run();
      userId = result.meta.last_row_id as number;
    }

    const jwt = await signJWT({
      sub: String(userId),
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
    }, env.JWT_SECRET);

    return new Response(JSON.stringify({
      user: {
        id: String(userId),
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
      },
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': getSessionCookie(jwt),
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg }, { status: 500 });
  }
};
