/**
 * storage.ts
 * Wrapper minimale per persistere il JWT, multi-piattaforma.
 *
 * Strategia:
 *   • Web (browser)              → window.localStorage
 *   • iOS / Android (con lib)    → expo-secure-store (Keychain / Keystore)
 *   • Fallback (lib non installata o piattaforma sconosciuta) → in memoria
 *
 * `expo-secure-store` è una libreria nativa — non funziona su web.
 * Per attivare la persistenza sicura su mobile:
 *     npx expo install expo-secure-store
 */

import { Platform } from "react-native";

type Backend = {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string) => Promise<void>;
    del: (key: string) => Promise<void>;
};

// ── Backend in memoria (fallback) ────────────────────────────────────────────
const memoryBackend: Backend = (() => {
    const map = new Map<string, string>();
    return {
        get: async (k) => map.get(k) ?? null,
        set: async (k, v) => {
            map.set(k, v);
        },
        del: async (k) => {
            map.delete(k);
        },
    };
})();

// ── Backend localStorage (web) ───────────────────────────────────────────────
function createWebBackend(): Backend | null {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return {
        get: async (k) => {
            try {
                return window.localStorage.getItem(k);
            } catch {
                return null;
            }
        },
        set: async (k, v) => {
            try {
                window.localStorage.setItem(k, v);
            } catch {
                /* quota exceeded, private mode, ecc. */
            }
        },
        del: async (k) => {
            try {
                window.localStorage.removeItem(k);
            } catch {
                /* idem */
            }
        },
    };
}

// ── Backend SecureStore (nativo) ─────────────────────────────────────────────
function createSecureStoreBackend(): Backend | null {
    try {
        // require dinamico così il bundler non si lamenta se manca il pacchetto
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const SecureStore = require("expo-secure-store");
        // Verifica che le funzioni esistano effettivamente: su alcune
        // piattaforme la libreria si carica ma le funzioni native sono
        // assenti (es. web). In quel caso si torna null e si scende al
        // fallback successivo.
        if (
            typeof SecureStore.getItemAsync !== "function" ||
            typeof SecureStore.setItemAsync !== "function" ||
            typeof SecureStore.deleteItemAsync !== "function"
        ) {
            return null;
        }
        return {
            get: (k) => SecureStore.getItemAsync(k),
            set: (k, v) => SecureStore.setItemAsync(k, v),
            del: (k) => SecureStore.deleteItemAsync(k),
        };
    } catch {
        return null;
    }
}

// ── Selezione del backend in base alla piattaforma ───────────────────────────
const backend: Backend = (() => {
    if (Platform.OS === "web") {
        return createWebBackend() ?? memoryBackend;
    }
    return createSecureStoreBackend() ?? memoryBackend;
})();

export const storage = backend;
