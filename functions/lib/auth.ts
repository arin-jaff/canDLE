// JWT helpers using Web Crypto API (compatible with Cloudflare Workers runtime)

import type { Env } from './db';

interface JWTPayload {
  sub: string; // D1 user id
  email: string;
  name: string;
  picture: string;
  iat: number;
  exp: number;
}

function base64url(data: string | ArrayBuffer): string {
  const str = typeof data === 'string'
    ? btoa(data)
    : btoa(String.fromCharCode(...new Uint8Array(data)));
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str: string): string {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  return atob(padded);
}

async function getKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function signJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>, secret: string): Promise<string> {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + 30 * 24 * 60 * 60, // 30 days
  };
  const body = base64url(JSON.stringify(fullPayload));
  const data = `${header}.${body}`;

  const key = await getKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));

  return `${data}.${base64url(sig)}`;
}

export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const [header, body, sig] = token.split('.');
    if (!header || !body || !sig) return null;

    const key = await getKey(secret);
    const data = `${header}.${body}`;

    // Decode signature
    const sigStr = base64urlDecode(sig);
    const sigBuf = Uint8Array.from(sigStr, c => c.charCodeAt(0));

    const valid = await crypto.subtle.verify('HMAC', key, sigBuf, new TextEncoder().encode(data));
    if (!valid) return null;

    const payload: JWTPayload = JSON.parse(base64urlDecode(body));

    // Check expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

export async function verifyGoogleToken(idToken: string, clientId: string): Promise<{
  sub: string;
  email: string;
  name: string;
  picture: string;
} | null> {
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!res.ok) return null;

    const data = await res.json() as Record<string, string>;

    // Verify audience matches our client ID
    if (data.aud !== clientId) return null;

    return {
      sub: data.sub,
      email: data.email,
      name: data.name || data.email,
      picture: data.picture || '',
    };
  } catch {
    return null;
  }
}

export function getSessionCookie(token: string): string {
  return `candle_session=${token}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${30 * 24 * 60 * 60}`;
}

export function clearSessionCookie(): string {
  return `candle_session=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`;
}

export function parseCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? match[1] : null;
}

export async function getUserFromRequest(request: Request, env: Env): Promise<JWTPayload | null> {
  const cookie = request.headers.get('Cookie');
  const token = parseCookie(cookie, 'candle_session');
  if (!token) return null;
  return verifyJWT(token, env.JWT_SECRET);
}

export type { JWTPayload };
