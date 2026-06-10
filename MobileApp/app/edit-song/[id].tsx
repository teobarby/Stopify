/**
 * edit-song/[id].tsx
 * Schermata di modifica di un brano pubblicato dall'utente.
 * I campi sono precompilati con i valori attuali (recuperati da /api/get/<id>)
 * e il salvataggio chiama PUT /api/songs/<id>.
 */

import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
    View,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { Screen } from "@/components/screen";
import { FormField } from "@/components/form-field";
import { api, LrclibSong } from "../../src/api";
import { parseLyrics, validateSong } from "../../src/lyrics";
import { PRIMARY, PRIMARY_DEEP, BG_GRADIENT } from "@/constants/theme";
import styles from '@/styles/edit-song.styles';

export default function EditSongScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const songId = Number(id);

    const [song, setSong] = useState<LrclibSong | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [trackName, setTrackName] = useState("");
    const [artistName, setArtistName] = useState("");
    const [albumName, setAlbumName] = useState("");
    const [duration, setDuration] = useState("");
    const [lyrics, setLyrics] = useState("");

    // ── Load current values ──────────────────────────────────────────────────
    useEffect(() => {
        if (!songId) return;
        (async () => {
            try {
                const s = await api.getSong(songId);
                setSong(s);
                setTrackName(s.trackName || "");
                setArtistName(s.artistName || "");
                setAlbumName(s.albumName || "");
                setDuration(s.duration ? String(s.duration) : "");
                setLyrics(s.syncedLyrics || s.plainLyrics || "");
            } catch (e: any) {
                setLoadError(e.message || "Brano non trovato");
            } finally {
                setLoading(false);
            }
        })();
    }, [songId]);

    const handleSave = async () => {
        const v = validateSong({ title: trackName, artist: artistName, lyrics, duration });
        if (v) {
            setError(v);
            return;
        }

        const { plainLyrics, syncedLyrics } = parseLyrics(lyrics);

        setSubmitting(true);
        setError(null);
        try {
            await api.updateLyrics(songId, {
                trackName: trackName.trim(),
                artistName: artistName.trim(),
                albumName: albumName.trim() || undefined,
                duration: duration ? Number(duration) : undefined,
                plainLyrics,
                syncedLyrics,
            });
            router.back();
        } catch (e: any) {
            setError(e.message || "Salvataggio fallito.");
        } finally {
            setSubmitting(false);
        }
    };

    // ── Loading / error ──────────────────────────────────────────────────────
    if (loading) {
        return (
            <LinearGradient
                colors={BG_GRADIENT}
                style={styles.center}
            >
                <ActivityIndicator color={PRIMARY} size="large" />
            </LinearGradient>
        );
    }

    if (loadError || !song) {
        return (
            <LinearGradient
                colors={BG_GRADIENT}
                style={styles.center}
            >
                <Ionicons
                    name="alert-circle-outline"
                    size={42}
                    color="#FCA5A5"
                />
                <ThemedText style={styles.errorTitle}>
                    {loadError || "Brano non trovato"}
                </ThemedText>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backCta}
                >
                    <ThemedText style={styles.backCtaText}>
                        Torna indietro
                    </ThemedText>
                </TouchableOpacity>
            </LinearGradient>
        );
    }

    return (
        <Screen style={styles.container}>
            <View style={styles.glowOne} />
            <View style={styles.glowTwo} />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* HEADER */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => router.back()}
                            style={styles.backButton}
                        >
                            <Ionicons
                                name="chevron-back"
                                size={22}
                                color="white"
                            />
                        </TouchableOpacity>

                        <ThemedText style={styles.title}>
                            Modifica brano
                        </ThemedText>
                        <ThemedText style={styles.subtitle}>
                            Aggiorna i campi e salva. Il brano sarà visibile
                            con i nuovi valori.
                        </ThemedText>
                    </View>

                    {/* FORM */}
                    <BlurView intensity={30} tint="dark" style={styles.formCard}>
                        <FormField
                            label="Titolo"
                            icon="musical-note"
                            value={trackName}
                            onChangeText={setTrackName}
                        />
                        <FormField
                            label="Artista"
                            icon="person"
                            value={artistName}
                            onChangeText={setArtistName}
                        />
                        <FormField
                            label="Album"
                            icon="albums"
                            value={albumName}
                            onChangeText={setAlbumName}
                            placeholder="opzionale"
                        />
                        <FormField
                            label="Durata (secondi)"
                            icon="time"
                            value={duration}
                            onChangeText={setDuration}
                            placeholder="opzionale"
                            keyboardType="numeric"
                        />

                        <FormField
                            label="Testo"
                            icon="document-text"
                            value={lyrics}
                            onChangeText={setLyrics}
                            placeholder={"Testo semplice, oppure con timestamp LRC:\n[00:00.00] prima riga\n[00:04.50] seconda riga"}
                            multiline
                            hint="I timestamp [mm:ss.xx] vengono rilevati automaticamente."
                        />

                        {error ? (
                            <View style={styles.errorBox}>
                                <Ionicons
                                    name="warning-outline"
                                    size={16}
                                    color="#FCA5A5"
                                />
                                <ThemedText style={styles.errorBoxText}>
                                    {error}
                                </ThemedText>
                            </View>
                        ) : null}

                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={handleSave}
                            disabled={submitting}
                        >
                            <LinearGradient
                                colors={[PRIMARY, PRIMARY_DEEP]}
                                style={[
                                    styles.primaryBtn,
                                    submitting && { opacity: 0.7 },
                                ]}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <>
                                        <Ionicons
                                            name="save"
                                            size={20}
                                            color="white"
                                        />
                                        <ThemedText
                                            style={styles.primaryBtnText}
                                        >
                                            Salva modifiche
                                        </ThemedText>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </BlurView>
                </ScrollView>
            </KeyboardAvoidingView>
        </Screen>
    );
}
