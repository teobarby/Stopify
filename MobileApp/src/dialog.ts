/**
 * dialog.ts
 * Wrapper cross-platform per alert e conferme.
 *
 * `Alert.alert(...)` di react-native NON funziona su react-native-web:
 * il popup non appare. Su web usiamo i nativi `window.alert` /
 * `window.confirm`. Su iOS/Android continuiamo a usare il modulo Alert.
 */

import { Alert, Platform } from "react-native";

/**
 * Mostra un messaggio di solo "OK" (info / errori).
 */
export function showAlert(title: string, message?: string): void {
    if (Platform.OS === "web") {
        if (typeof window !== "undefined") {
            window.alert(message ? `${title}\n\n${message}` : title);
        }
        return;
    }
    Alert.alert(title, message);
}

/**
 * Chiede una conferma sì/no all'utente. Restituisce una Promise<boolean>:
 *   - true  → l'utente ha confermato
 *   - false → l'utente ha annullato
 *
 * @param opts.confirmLabel etichetta del bottone di conferma (default "OK")
 * @param opts.cancelLabel  etichetta del bottone di annullamento (default "Annulla")
 * @param opts.destructive  se true, su iOS il bottone di conferma è in rosso
 */
export function showConfirm(
    title: string,
    message: string,
    opts: {
        confirmLabel?: string;
        cancelLabel?: string;
        destructive?: boolean;
    } = {}
): Promise<boolean> {
    const {
        confirmLabel = "OK",
        cancelLabel = "Annulla",
        destructive = false,
    } = opts;

    if (Platform.OS === "web") {
        if (typeof window === "undefined") {
            return Promise.resolve(false);
        }
        // window.confirm offre solo OK/Cancel — i label custom non sono
        // supportati ma comunichiamo l'azione nel testo del messaggio.
        const ok = window.confirm(`${title}\n\n${message}`);
        return Promise.resolve(ok);
    }

    return new Promise((resolve) => {
        Alert.alert(title, message, [
            {
                text: cancelLabel,
                style: "cancel",
                onPress: () => resolve(false),
            },
            {
                text: confirmLabel,
                style: destructive ? "destructive" : "default",
                onPress: () => resolve(true),
            },
        ]);
    });
}
