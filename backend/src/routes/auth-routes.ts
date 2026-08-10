import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { AuthService } from '../services/auth-service';
import type { AuthSessionResponse } from '../types/api';

export function registerAuthRoutes(app: FastifyInstance, authService: AuthService) {
  app.get('/api/auth/session', async (request, reply) => {
    const response: AuthSessionResponse = {
      authenticated: Boolean(request.user),
      user: request.user
        ? {
            id: request.user.id,
            email: request.user.email,
            displayName: request.user.displayName,
            avatarUrl: request.user.avatarUrl,
          }
        : null,
    };

    reply.status(200).send(response);
  });

  app.get('/api/auth/google/start', async (request, reply) => {
    const returnTo =
      typeof request.query === 'object' && request.query && 'returnTo' in request.query
        ? String((request.query as { returnTo?: string }).returnTo ?? '/')
        : '/';
    const { redirectUrl, cookies } = authService.createLoginRedirect(returnTo);

    reply.header('Set-Cookie', cookies);
    reply.status(302).header('Location', redirectUrl).send();
  });

  const handleGoogleCallback = async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as { code?: string; state?: string };

    if (!query.code || !query.state) {
      reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing OAuth callback parameters',
        },
      });
      return;
    }

    const result = await authService.handleGoogleCallback({
      code: query.code,
      state: query.state,
      cookieHeader: request.headers.cookie,
    });

    reply.header('Set-Cookie', result.cookies);
    reply.status(302).header('Location', result.redirectUrl).send();
  };

  app.get('/api/auth/google/callback', handleGoogleCallback);
  app.get('/api/auth/callback/google', handleGoogleCallback);

  app.get('/api/auth/logout', async (request, reply) => {
    const cookies = await authService.createLogoutCookies(request.headers.cookie);

    reply.header('Set-Cookie', cookies);
    reply.status(302).header('Location', '/login').send();
  });
}
