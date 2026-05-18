/**
 * api.ts
 * Hook e utility per tutte le chiamate al backend Flask.
 */

import { storage } from "./storage";

import Constants from "expo-constants";
const BASE_URL =
    Constants.expoConfig?.extra?.apiBaseUrl
    ?? "http://localhost:5000";
// ─── Tipi ─────────────────────────────────────────────────────────────────────

export interface Artist {
  id: number;
  name: string;
}

export interface Album {
  id: number;
  title: string;
  year: number | null;
  artist_id: number;
}

export interface Song {
  id: number;
  title: string;
  artist: string;
  artist_id: number;
  album: string | null;
  album_id: number | null;
  created_at: string;
}

export interface SongDetail extends Song {
  lyrics: string;
  synced_lyrics: string | null; // JSON string → [{time, line}]
}

export interface SyncedLine {
  time: number;
  line: string;
}

export interface SearchResult {
  results: Song[];
  count: number;
}

export interface ExploreResult {
  songs: Song[];
  total: number;
  page: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// ── Auth types ───────────────────────────────────────────────────────────────

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

const TOKEN_KEY = "stopify.access";
const REFRESH_KEY = "stopify.refresh";

// ─── Token storage helpers ───────────────────────────────────────────────────

export const tokens = {
  async getAccess(): Promise<string | null> {
    return storage.get(TOKEN_KEY);
  },
  async getRefresh(): Promise<string | null> {
    return storage.get(REFRESH_KEY);
  },
  async save(accessToken: string, refreshToken?: string): Promise<void> {
    await storage.set(TOKEN_KEY, accessToken);
    if (refreshToken) {
      await storage.set(REFRESH_KEY, refreshToken);
    }
  },
  async clear(): Promise<void> {
    await storage.del(TOKEN_KEY);
    await storage.del(REFRESH_KEY);
  },
};

// ─── Fetch helpers ────────────────────────────────────────────────────────────

interface FetchOptions {
  method?: string;
  body?: object;
  headers?: Record<string, string>;
  /** se true allega Authorization: Bearer <access> */
  authed?: boolean;
}

async function request<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(opts.headers || {}),
  };

  if (opts.body) {
    headers["Content-Type"] = "application/json";
  }

  if (opts.authed) {
    const access = await tokens.getAccess();
    if (access) {
      headers["Authorization"] = `Bearer ${access}`;
    }
  }

  const init: RequestInit = {
    method: opts.method || "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  };

  let res = await fetch(`${BASE_URL}${path}`, init);

  // Auto-refresh on 401 if we have a refresh token
  if (res.status === 401 && opts.authed) {
    const refresh = await tokens.getRefresh();
    if (refresh) {
      const r = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { Authorization: `Bearer ${refresh}` },
      });
      if (r.ok) {
        const data = await r.json();
        await tokens.save(data.accessToken);
        headers["Authorization"] = `Bearer ${data.accessToken}`;
        res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
      } else {
        // Refresh failed → logout
        await tokens.clear();
      }
    }
  }

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }

  if (!res.ok) {
    const msg =
        (data && (data.message || data.error)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data as T;
}

async function get<T>(path: string): Promise<T> {
  return request<T>(path);
}

async function post<T>(path: string, body: object): Promise<T> {
  return request<T>(path, { method: "POST", body });
}

// ─── LRCLIB-shaped record (camelCase) ─────────────────────────────────────────

export interface LrclibSong {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string | null;
  duration: number | null;
  instrumental: boolean;
  plainLyrics: string;
  syncedLyrics: string | null;
  submittedBy: string | null;
}

export interface LrclibPublishBody {
  trackName: string;
  artistName: string;
  plainLyrics: string;
  albumName?: string;
  duration?: number;
  syncedLyrics?: string;
  instrumental?: boolean;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const api = {
  /** GET /health */
  health: () => get<{ status: string }>("/health"),

  /** GET /search?q=&title=&artist=&album= */
  search: (params: { q?: string; title?: string; artist?: string; album?: string }) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v) as [string, string][]
    ).toString();
    return get<SearchResult>(`/search?${qs}`);
  },

  /** GET /explore?page=&limit=&sort= */
  explore: (page = 1, sort = "recent", limit = 20) =>
    get<ExploreResult>(`/explore?page=${page}&limit=${limit}&sort=${sort}`),

  /** GET /songs/:id */
  getSong: (id: number) => get<SongDetail>(`/songs/${id}`),

  /** GET /artists */
  getArtists: () => get<Artist[]>("/artists"),

  /** GET /albums?artist_id= */
  getAlbums: (artistId?: number) =>
    get<Album[]>(`/albums${artistId ? `?artist_id=${artistId}` : ""}`),

  // ── LRCLIB-spec ───────────────────────────────────────────────────────────

  /** POST /api/request-challenge → { prefix, target } */
  requestChallenge: () =>
    post<{ prefix: string; target: string }>("/api/request-challenge", {}),

  /**
   * POST /api/publish
   * Se `authed = true` invia Authorization Bearer (richiede login).
   * Altrimenti deve essere passato `xPublishToken: "prefix:nonce"`.
   */
  publishLRCLIB: async (
    body: LrclibPublishBody,
    opts: { authed?: boolean; xPublishToken?: string } = {}
  ) => {
    const headers: Record<string, string> = {};
    if (opts.xPublishToken) {
      headers["X-Publish-Token"] = opts.xPublishToken;
    }
    return request<LrclibSong>("/api/publish", {
      method: "POST",
      body,
      headers,
      authed: !!opts.authed,
    });
  },

  /** GET /api/get/<id> → LRCLIB shape */
  getLRCLIB: (id: number) => get<LrclibSong>(`/api/get/${id}`),

  // ── Gestione brani propri (richiedono JWT) ─────────────────────────────

  /** GET /api/me/songs → lista LrclibSong */
  getMyLyrics: () =>
    request<LrclibSong[]>("/api/me/songs", { authed: true }),

  /** PUT /api/songs/<id> */
  updateLyrics: (id: number, body: LrclibPublishBody) =>
    request<LrclibSong>(`/api/songs/${id}`, {
      method: "PUT",
      body,
      authed: true,
    }),

  /** DELETE /api/songs/<id> */
  deleteLyrics: (id: number) =>
    request<{ deleted: number }>(`/api/songs/${id}`, {
      method: "DELETE",
      authed: true,
    }),

  // ── Auth ──────────────────────────────────────────────────────────────────

  /** POST /auth/register → user + access + refresh (auto-saves tokens) */
  async register(body: { username: string; email: string; password: string }): Promise<AuthSession> {
    const data = await post<AuthSession>("/auth/register", body);
    await tokens.save(data.accessToken, data.refreshToken);
    return data;
  },

  /** POST /auth/login → user + access + refresh (auto-saves tokens) */
  async login(usernameOrEmail: string, password: string): Promise<AuthSession> {
    const data = await post<AuthSession>("/auth/login", { usernameOrEmail, password });
    await tokens.save(data.accessToken, data.refreshToken);
    return data;
  },

  /** GET /auth/me → user (richiede access token) */
  me: () => request<{ user: AuthUser }>("/auth/me", { authed: true }),

  /** Logout client-side (cancella i token; non chiama il server) */
  async logout() {
    await tokens.clear();
  },
};

// ─── Proof of Work solver (client-side) ───────────────────────────────────────

import { sha256 } from "./sha256";


/**
 * Risolve la PoW LRCLIB-style: trova un nonce tale che
 * SHA256(prefix + nonce) <= target  (lessicograficamente, hex).
 */
export async function solvePoWLRCLIB(prefix: string, target: string): Promise<string> {
  let nonce = 0;
  while (true) {
    const hash = sha256(prefix + nonce.toString());
    if (hash <= target) {
      return nonce.toString();
    }
    nonce++;
    if (nonce % 5000 === 0) {
      await new Promise((r) => setTimeout(r, 0));
    }
  }
}
