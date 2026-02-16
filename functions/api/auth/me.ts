// GET /api/auth/me — Get current user from session cookie
import { getUserFromRequest } from '../../lib/auth';
import type { Env } from '../../lib/db';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const user = await getUserFromRequest(request, env);
  if (!user) {
    return Response.json({ user: null });
  }

  return Response.json({
    user: {
      id: user.sub,
      email: user.email,
      name: user.name,
      picture: user.picture,
    },
  });
};
