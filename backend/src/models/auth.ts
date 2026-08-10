export interface AppUser {
  id: number;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OAuthAccount {
  id: number;
  userId: number;
  provider: string;
  providerAccountId: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface SessionRecord {
  id: number;
  userId: number;
  sessionTokenHash: string;
  expiresAt: string;
  createdAt: string;
  lastSeenAt: string;
}
