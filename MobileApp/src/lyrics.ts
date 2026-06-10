/**
 * lyrics.ts
 * Helper condivisi per parsing e validazione dei testi lato client,
 * usati dalle schermate di pubblicazione e modifica brano.
 */

const LRC_LINE = /^\[\d{1,3}:\d{1,2}(\.\d+)?\]/;

export interface ParsedLyrics {
    plainLyrics: string;
    syncedLyrics: string | undefined;
}

/**
 * Rileva automaticamente i timestamp LRC [mm:ss.xx]:
 *  - se presenti, restituisce sia il testo semplice (senza timestamp) sia
 *    quello sincronizzato originale;
 *  - altrimenti `syncedLyrics` è undefined.
 */
export function parseLyrics(raw: string): ParsedLyrics {
    const trimmed = raw.trim();
    const lines = trimmed.split("\n");
    const isLRC = lines.some((l) => LRC_LINE.test(l.trim()));
    if (isLRC) {
        const plain = lines
            .map((l) => l.replace(/^\[\d{1,3}:\d{1,2}(\.\d+)?\]\s*/, ""))
            .filter(Boolean)
            .join("\n");
        return { plainLyrics: plain, syncedLyrics: trimmed };
    }
    return { plainLyrics: trimmed, syncedLyrics: undefined };
}

/**
 * Valida i campi comuni di un brano. Restituisce un messaggio d'errore
 * (in italiano) o `null` se tutto è valido.
 */
export function validateSong(fields: {
    title: string;
    artist: string;
    lyrics: string;
    duration?: string;
}): string | null {
    if (!fields.title.trim()) return "Inserisci il titolo.";
    if (!fields.artist.trim()) return "Inserisci l'artista.";
    if (!fields.lyrics.trim()) return "Inserisci il testo del brano.";
    if (fields.lyrics.trim().length < 20) return "Il testo è troppo breve.";
    if (fields.duration && isNaN(Number(fields.duration)))
        return "La durata deve essere numerica.";
    return null;
}
