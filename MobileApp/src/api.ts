/**
 * api.ts
 * Hook e utility per tutte le chiamate al backend Flask.
 */

import { storage } from "./storage";
import { sha256 } from "./sha256";

import Constants from "expo-constants";
const PRIMARY_URL =
    Constants.expoConfig?.extra?.apiBaseUrl
    ?? "http://localhost:5000";
const FALLBACK_URL = "http://localhost:5000";
// ─── Tipi ─────────────────────────────────────────────────────────────────────

export interface SyncedLine {
  time: number;
  line: string;
}

export interface ExploreResult {
  songs: LrclibSong[];
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
  is_admin: boolean;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
}

const TOKEN_KEY = "stopify.access";

// ─── Token storage helpers ───────────────────────────────────────────────────

export const tokens = {
  async getAccess(): Promise<string | null> {
    return storage.get(TOKEN_KEY);
  },
  async save(accessToken: string): Promise<void> {
    await storage.set(TOKEN_KEY, accessToken);
  },
  async clear(): Promise<void> {
    await storage.del(TOKEN_KEY);
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

async function fetchWithFallback(url: string, init: RequestInit): Promise<Response> {
  if (!url.startsWith(PRIMARY_URL) || PRIMARY_URL === FALLBACK_URL) {
    return fetch(url, init);
  }
  try {
    const res = await fetch(url, init);
    return res;
  } catch {
    const fallbackUrl = url.replace(PRIMARY_URL, FALLBACK_URL);
    return fetch(fallbackUrl, init);
  }
}

async function request<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const headers: Record<string, string> = { ...(opts.headers || {}) };

  if (opts.body) {
    headers["Content-Type"] = "application/json";
  }

  if (opts.authed) {
    const access = await tokens.getAccess();
    if (access) headers["Authorization"] = `Bearer ${access}`;
  }

  const res = await fetchWithFallback(`${PRIMARY_URL}${path}`, {
    method: opts.method || "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 401 && opts.authed) {
    await tokens.clear();
  }

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }

  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `HTTP ${res.status}`;
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
  /** GET /api/health */
  health: () => get<{ status: string }>("/api/health"),

  /** GET /api/search?q=&track_name=&artist_name=&album_name= */
  search: (params: { q?: string; title?: string; artist?: string; album?: string }) => {
    const mapped: Record<string, string> = {};
    if (params.q)      mapped.q           = params.q;
    if (params.title)  mapped.track_name  = params.title;
    if (params.artist) mapped.artist_name = params.artist;
    if (params.album)  mapped.album_name  = params.album;
    const qs = new URLSearchParams(mapped).toString();
    return get<LrclibSong[]>(`/api/search?${qs}`);
  },

  /** GET /api/explore?page=&limit=&sort= */
  explore: (page = 1, sort = "recent", limit = 20) =>
    get<ExploreResult>(`/api/explore?page=${page}&limit=${limit}&sort=${sort}`),

  /** GET /api/get/:id */
  getSong: (id: number) => get<LrclibSong>(`/api/get/${id}`),

  /**
   * GET /api/get?track_name=&artist_name=&album_name=&duration=
   * Lookup LRCLIB per signature. Ritorna il brano se esiste, `null` se non
   * trovato (404) o in caso di errore — così il chiamante non viene bloccato.
   */
  async getBySignature(params: {
    trackName: string;
    artistName: string;
    albumName?: string;
    duration?: number;
  }): Promise<LrclibSong | null> {
    const mapped: Record<string, string> = {
      track_name: params.trackName,
      artist_name: params.artistName,
    };
    if (params.albumName) mapped.album_name = params.albumName;
    if (params.duration != null) mapped.duration = String(params.duration);
    const qs = new URLSearchParams(mapped).toString();
    try {
      return await get<LrclibSong>(`/api/get?${qs}`);
    } catch {
      return null;
    }
  },

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

  /** POST /auth/register → user + access (auto-saves token) */
  async register(body: { username: string; email: string; password: string }): Promise<AuthSession> {
    const data = await post<AuthSession>("/auth/register", body);
    await tokens.save(data.accessToken);
    return data;
  },

  /** POST /auth/login → user + access (auto-saves token) */
  async login(usernameOrEmail: string, password: string): Promise<AuthSession> {
    const data = await post<AuthSession>("/auth/login", { usernameOrEmail, password });
    await tokens.save(data.accessToken);
    return data;
  },

  /** GET /auth/me → user (richiede access token) */
  me: () => request<{ user: AuthUser }>("/auth/me", { authed: true }),

  // ── Admin (richiede JWT + is_admin) ───────────────────────────────────────

  /**
   * GET /admin/songs → lista LrclibSong (intero catalogo, anche anonimi).
   * Filtri opzionali: q (titolo/artista), anonymous (solo anonimi), userId.
   */
  adminListSongs: (opts: { q?: string; anonymous?: boolean; userId?: number } = {}) => {
    const params = new URLSearchParams();
    if (opts.q) params.set("q", opts.q);
    if (opts.anonymous) params.set("anonymous", "true");
    if (opts.userId != null) params.set("user_id", String(opts.userId));
    const qs = params.toString();
    return request<LrclibSong[]>(
      `/admin/songs${qs ? `?${qs}` : ""}`,
      { authed: true }
    );
  },

  /** Logout client-side (cancella i token; non chiama il server) */
  async logout() {
    await tokens.clear();
  },
};

// ─── Proof of Work solver (client-side) ───────────────────────────────────────

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
