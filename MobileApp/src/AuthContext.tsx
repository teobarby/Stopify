/**
 * AuthContext.tsx
 * React context per lo stato di autenticazione globale.
 *
 * Espone: user, loading, login(), register(), logout(), refresh()
 * Al boot prova a leggere un token salvato e a chiamare /auth/me.
 */

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

import { api, AuthUser, tokens } from "./api";

interface AuthContextValue {
    user: AuthUser | null;
    loading: boolean;
    login: (usernameOrEmail: string, password: string) => Promise<void>;
    register: (
        username: string,
        email: string,
        password: string
    ) => Promise<void>;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    // Bootstrap: try to load /me using the saved access token
    const refresh = useCallback(async () => {
        try {
            const access = await tokens.getAccess();
            if (!access) {
                setUser(null);
                return;
            }
            const data = await api.me();
            setUser(data.user);
        } catch {
            await tokens.clear();
            setUser(null);
        }
    }, []);

    useEffect(() => {
        (async () => {
            await refresh();
            setLoading(false);
        })();
    }, [refresh]);

    const login = useCallback(
        async (usernameOrEmail: string, password: string) => {
            const session = await api.login(usernameOrEmail, password);
            setUser(session.user);
        },
        []
    );

    const register = useCallback(
        async (username: string, email: string, password: string) => {
            const session = await api.register({ username, email, password });
            setUser(session.user);
        },
        []
    );

    const logout = useCallback(async () => {
        await api.logout();
        setUser(null);
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({ user, loading, login, register, logout, refresh }),
        [user, loading, login, register, logout, refresh]
    );

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return ctx;
}
