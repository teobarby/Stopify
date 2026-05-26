import { Platform } from "react-native";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const SecureStore = Platform.OS !== "web" ? require("expo-secure-store") : null;

const ls = typeof window !== "undefined" ? window.localStorage : null;

export const storage = {
    get: (key: string): Promise<string | null> =>
        SecureStore
            ? SecureStore.getItemAsync(key)
            : Promise.resolve(ls?.getItem(key) ?? null),

    set: (key: string, value: string): Promise<void> =>
        SecureStore
            ? SecureStore.setItemAsync(key, value)
            : Promise.resolve(void ls?.setItem(key, value)),

    del: (key: string): Promise<void> =>
        SecureStore
            ? SecureStore.deleteItemAsync(key)
            : Promise.resolve(void ls?.removeItem(key)),
};
