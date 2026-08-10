import { readFileSync } from 'node:fs';
import crypto from 'node:crypto';
import type { RowDataPacket } from 'mysql2';
import type { Pool, ResultSetHeader } from 'mysql2/promise';
import type { EnvConfig } from '../config/env';
import type { AuthSessionUser } from '../types/api';
import { UnauthorizedError, ValidationError } from './errors';

interface OAuthCredentialsFile {
  web?: {
    client_id?: string;
    client_secret?: string;
    redirect_uris?: string[];
    auth_uri?: string;
    token_uri?: string;
  };
  installed?: {
    client_id?: string;
    client_secret?: string;
    redirect_uris?: string[];
    auth_uri?: string;
    token_uri?: string;
  };
}

interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  authUri: string;
  tokenUri: string;
}

interface GoogleProfile {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

const SESSION_COOKIE_NAME = 'bambu_session';
const OAUTH_STATE_COOKIE_NAME = 'bambu_oauth_state';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const OAUTH_COOKIE_MAX_AGE_SECONDS = 60 * 10;

function base64Url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return Object.fromEntries(
    cookieHeader.split(';').map((part) => {
      const [name, ...rest] = part.trim().split('=');
      return [name, decodeURIComponent(rest.join('='))];
    }),
  );
}

function serializeCookie(
  name: string,
  value: string,
  options: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'lax' | 'strict' | 'none';
    path?: string;
    maxAge?: number;
    expires?: Date;
  },
): string {
  const segments = [`${name}=${encodeURIComponent(value)}`];

  if (options.path) {
    segments.push(`Path=${options.path}`);
  }

  if (options.maxAge !== undefined) {
    segments.push(`Max-Age=${options.maxAge}`);
  }

  if (options.expires) {
    segments.push(`Expires=${options.expires.toUTCString()}`);
  }

  if (options.httpOnly) {
    segments.push('HttpOnly');
  }

  if (options.secure) {
    segments.push('Secure');
  }

  if (options.sameSite) {
    segments.push(`SameSite=${options.sameSite}`);
  }

  return segments.join('; ');
}

function readGoogleCredentials(env: EnvConfig): GoogleOAuthConfig {
  if (env.googleClientId && env.googleClientSecret && env.googleCallbackUrl) {
    return {
      clientId: env.googleClientId,
      clientSecret: env.googleClientSecret,
      callbackUrl: env.googleCallbackUrl,
      authUri: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUri: 'https://oauth2.googleapis.com/token',
    };
  }

  if (!env.googleCredentialsPath) {
    throw new Error(
      'Google OAuth requires GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET/GOOGLE_CALLBACK_URL or GOOGLE_APPLICATION_CREDENTIALS',
    );
  }

  const raw = readFileSync(env.googleCredentialsPath, 'utf8');
  const parsed = JSON.parse(raw) as OAuthCredentialsFile;
  const client = parsed.web ?? parsed.installed;

  if (!client?.client_id || !client.client_secret) {
    throw new Error('Google OAuth credentials file is missing client_id or client_secret');
  }

  const callbackUrl = client.redirect_uris?.[0];

  if (!callbackUrl) {
    throw new Error('Google OAuth credentials file is missing a redirect URI');
  }

  return {
    clientId: client.client_id,
    clientSecret: client.client_secret,
    callbackUrl,
    authUri: client.auth_uri ?? 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUri: client.token_uri ?? 'https://oauth2.googleapis.com/token',
  };
}

function validateReturnTo(returnTo: string | undefined): string {
  if (!returnTo) {
    return '/';
  }

  if (!returnTo.startsWith('/')) {
    throw new ValidationError('returnTo must be a relative path');
  }

  return returnTo;
}

export interface AuthenticatedUser extends AuthSessionUser {}

export interface AuthService {
  getSessionUser(cookieHeader: string | undefined): Promise<AuthenticatedUser | null>;
  createLoginRedirect(returnTo?: string): { redirectUrl: string; cookies: string[] };
  handleGoogleCallback(input: {
    code: string;
    state: string;
    cookieHeader: string | undefined;
  }): Promise<{ redirectUrl: string; cookies: string[] }>;
  createLogoutCookies(cookieHeader: string | undefined): Promise<string[]>;
}

export function createAuthService(pool: Pool, env: EnvConfig): AuthService {
  const google = readGoogleCredentials(env);

  function buildStateCookie(returnTo: string) {
    const state = randomToken(24);
    const verifier = randomToken(48);
    const payload = base64Url(JSON.stringify({ state, verifier, returnTo }));

    return {
      state,
      verifier,
      cookie: serializeCookie(OAUTH_STATE_COOKIE_NAME, payload, {
        httpOnly: true,
        secure: env.authCookieSecure,
        sameSite: 'lax',
        path: '/',
        maxAge: OAUTH_COOKIE_MAX_AGE_SECONDS,
      }),
    };
  }

  async function loadUserBySessionToken(token: string): Promise<AuthenticatedUser | null> {
    const tokenHash = sha256(token);
    const [rows] = await pool.query<
      Array<
        RowDataPacket & {
          user_id: number;
          email: string;
          display_name: string;
          avatar_url: string | null;
        }
      >
    >(
      `
        SELECT u.id AS user_id, u.email, u.display_name, u.avatar_url
        FROM sessions s
        INNER JOIN users u ON u.id = s.user_id
        WHERE s.session_token_hash = ?
          AND s.expires_at > UTC_TIMESTAMP()
        LIMIT 1
      `,
      [tokenHash],
    );

    const user = rows[0];

    if (!user) {
      return null;
    }

    await pool.execute(
      'UPDATE sessions SET last_seen_at = UTC_TIMESTAMP() WHERE session_token_hash = ?',
      [tokenHash],
    );

    return {
      id: user.user_id,
      email: user.email,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
    };
  }

  async function persistGoogleLogin(profile: GoogleProfile) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [accountRowsTyped] = await connection.query<
        Array<RowDataPacket & { user_id: number }>
      >(
        `
          SELECT user_id
          FROM oauth_accounts
          WHERE provider = 'google' AND provider_account_id = ?
          LIMIT 1
        `,
        [profile.sub],
      );

      let userId = accountRowsTyped[0]?.user_id;

      if (!userId) {
        const [emailRows] = await connection.query<
          Array<RowDataPacket & { id: number }>
        >(
          'SELECT id FROM users WHERE email = ? LIMIT 1',
          [profile.email],
        );

        if (emailRows[0]) {
          userId = emailRows[0].id;
          await connection.execute(
            `
              UPDATE users
              SET display_name = ?, avatar_url = ?, updated_at = UTC_TIMESTAMP()
              WHERE id = ?
            `,
            [profile.name ?? profile.email, profile.picture ?? null, userId],
          );
        } else {
          const [result] = await connection.execute<ResultSetHeader>(
            `
              INSERT INTO users (email, display_name, avatar_url)
              VALUES (?, ?, ?)
            `,
            [profile.email, profile.name ?? profile.email, profile.picture ?? null],
          );
          userId = result.insertId;
        }
      } else {
        await connection.execute(
          `
            UPDATE users
            SET email = ?, display_name = ?, avatar_url = ?, updated_at = UTC_TIMESTAMP()
            WHERE id = ?
          `,
          [profile.email, profile.name ?? profile.email, profile.picture ?? null, userId],
        );
      }

      await connection.execute(
        `
          INSERT INTO oauth_accounts (
            user_id,
            provider,
            provider_account_id,
            email,
            display_name,
            avatar_url
          )
          VALUES (?, 'google', ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            user_id = VALUES(user_id),
            email = VALUES(email),
            display_name = VALUES(display_name),
            avatar_url = VALUES(avatar_url)
        `,
        [userId, profile.sub, profile.email, profile.name ?? null, profile.picture ?? null],
      );

      const sessionToken = randomToken(48);
      const sessionTokenHash = sha256(sessionToken);
      const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

      await connection.execute(
        `
          INSERT INTO sessions (user_id, session_token_hash, expires_at)
          VALUES (?, ?, ?)
        `,
        [userId, sessionTokenHash, expiresAt],
      );

      await connection.commit();

      return {
        userId,
        sessionToken,
        expiresAt,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async function exchangeCodeForProfile(code: string, verifier: string): Promise<GoogleProfile> {
    const body = new URLSearchParams({
      code,
      client_id: google.clientId,
      client_secret: google.clientSecret,
      redirect_uri: google.callbackUrl,
      grant_type: 'authorization_code',
      code_verifier: verifier,
    });

    const tokenResponse = await fetch(google.tokenUri, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!tokenResponse.ok) {
      throw new Error('Google OAuth token exchange failed');
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token?: string;
    };

    if (!tokenData.access_token) {
      throw new Error('Google OAuth token response did not include an access token');
    }

    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      throw new Error('Google OAuth profile lookup failed');
    }

    const profile = (await profileResponse.json()) as GoogleProfile;

    if (!profile.sub || !profile.email) {
      throw new Error('Google OAuth profile response was incomplete');
    }

    return profile;
  }

  return {
    async getSessionUser(cookieHeader) {
      const cookies = parseCookies(cookieHeader);
      const token = cookies[SESSION_COOKIE_NAME];

      if (!token) {
        return null;
      }

      return loadUserBySessionToken(token);
    },

    createLoginRedirect(returnTo = '/') {
      const safeReturnTo = validateReturnTo(returnTo);
      const stateData = buildStateCookie(safeReturnTo);
      const authUrl = new URL(google.authUri);

      authUrl.searchParams.set('client_id', google.clientId);
      authUrl.searchParams.set('redirect_uri', google.callbackUrl);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', 'openid email profile');
      authUrl.searchParams.set('state', stateData.state);
      authUrl.searchParams.set('code_challenge', base64Url(crypto.createHash('sha256').update(stateData.verifier).digest()));
      authUrl.searchParams.set('code_challenge_method', 'S256');
      authUrl.searchParams.set('access_type', 'online');
      authUrl.searchParams.set('prompt', 'select_account');

      return {
        redirectUrl: authUrl.toString(),
        cookies: [stateData.cookie],
      };
    },

    async handleGoogleCallback(input) {
      const cookies = parseCookies(input.cookieHeader);
      const statePayload = cookies[OAUTH_STATE_COOKIE_NAME];

      if (!statePayload) {
        throw new UnauthorizedError('Missing login state');
      }

      let parsed: {
        state: string;
        verifier: string;
        returnTo: string;
      };

      try {
        parsed = JSON.parse(Buffer.from(statePayload, 'base64url').toString('utf8')) as {
          state: string;
          verifier: string;
          returnTo: string;
        };
      } catch {
        throw new UnauthorizedError('Invalid login state');
      }

      if (parsed.state !== input.state) {
        throw new UnauthorizedError('Invalid login state');
      }

      const profile = await exchangeCodeForProfile(input.code, parsed.verifier);
      const session = await persistGoogleLogin(profile);
      const sessionCookie = serializeCookie(SESSION_COOKIE_NAME, session.sessionToken, {
        httpOnly: true,
        secure: env.authCookieSecure,
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_MAX_AGE_SECONDS,
      });
      const clearStateCookie = serializeCookie(OAUTH_STATE_COOKIE_NAME, '', {
        httpOnly: true,
        secure: env.authCookieSecure,
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });

      return {
        redirectUrl: parsed.returnTo,
        cookies: [sessionCookie, clearStateCookie],
      };
    },

    async createLogoutCookies(cookieHeader) {
      const cookies = parseCookies(cookieHeader);
      const token = cookies[SESSION_COOKIE_NAME];
      const clearedCookies = [
        serializeCookie(SESSION_COOKIE_NAME, '', {
          httpOnly: true,
          secure: env.authCookieSecure,
          sameSite: 'lax',
          path: '/',
          maxAge: 0,
        }),
      ];

      if (!token) {
        return clearedCookies;
      }

      await pool.execute(
        'DELETE FROM sessions WHERE session_token_hash = ?',
        [sha256(token)],
      );

      return clearedCookies;
    },
  };
}
