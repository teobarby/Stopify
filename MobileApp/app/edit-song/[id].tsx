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
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { api, LrclibSong } from "../../src/api";
import { PRIMARY, PRIMARY_DEEP, BG_GRADIENT, TEXT_MUTED, TEXT_DIM, TEXT_SOFT } from "@/constants/theme";
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
    const [plainLyrics, setPlainLyrics] = useState("");
    const [syncedLyrics, setSyncedLyrics] = useState("");

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
                setPlainLyrics(s.plainLyrics || "");
                setSyncedLyrics(s.syncedLyrics || "");
            } catch (e: any) {
                setLoadError(e.message || "Brano non trovato");
            } finally {
                setLoading(false);
            }
        })();
    }, [songId]);

    const validate = (): string | null => {
        if (!trackName.trim()) return "Inserisci il titolo.";
        if (!artistName.trim()) return "Inserisci l'artista.";
        if (!plainLyrics.trim()) return "Inserisci il testo.";
        if (plainLyrics.trim().length < 20) return "Il testo è troppo breve.";
        if (duration && isNaN(Number(duration)))
            return "La durata deve essere numerica.";
        return null;
    };

    const handleSave = async () => {
        const v = validate();
        if (v) {
            setError(v);
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            await api.updateLyrics(songId, {
                trackName: trackName.trim(),
                artistName: artistName.trim(),
                albumName: albumName.trim() || undefined,
                duration: duration ? Number(duration) : undefined,
                plainLyrics: plainLyrics.trim(),
                syncedLyrics: syncedLyrics.trim() || undefined,
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
        <LinearGradient
            colors={BG_GRADIENT}
            style={styles.container}
        >
            <View style={styles.glowOne} />
            <View style={styles.glowTwo} />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
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
                        <Field
                            label="Titolo"
                            icon="musical-note"
                            value={trackName}
                            onChangeText={setTrackName}
                        />
                        <Field
                            label="Artista"
                            icon="person"
                            value={artistName}
                            onChangeText={setArtistName}
                        />
                        <Field
                            label="Album"
                            icon="albums"
                            value={albumName}
                            onChangeText={setAlbumName}
                            placeholder="opzionale"
                        />
                        <Field
                            label="Durata (secondi)"
                            icon="time"
                            value={duration}
                            onChangeText={setDuration}
                            placeholder="opzionale"
                            keyboardType="numeric"
                        />

                        <View style={styles.field}>
                            <ThemedText style={styles.label}>
                                Testo
                            </ThemedText>
                            <View style={styles.inputWrapper}>
                                <Ionicons
                                    name="document-text"
                                    size={18}
                                    color={TEXT_MUTED}
                                />
                                <TextInput
                                    value={plainLyrics}
                                    onChangeText={setPlainLyrics}
                                    placeholder="Testo del brano…"
                                    placeholderTextColor={TEXT_DIM}
                                    multiline
                                    textAlignVertical="top"
                                    style={styles.textArea}
                                />
                            </View>
                        </View>

                        <View style={styles.field}>
                            <ThemedText style={styles.label}>
                                Testo sincronizzato (formato LRC)
                            </ThemedText>
                            <View style={styles.inputWrapper}>
                                <Ionicons
                                    name="pulse"
                                    size={18}
                                    color={TEXT_MUTED}
                                />
                                <TextInput
                                    value={syncedLyrics}
                                    onChangeText={setSyncedLyrics}
                                    placeholder={"[00:00.00] prima riga\n[00:04.50] seconda riga"}
                                    placeholderTextColor={TEXT_DIM}
                                    multiline
                                    textAlignVertical="top"
                                    style={styles.textAreaSmall}
                                />
                            </View>
                            <ThemedText style={styles.hint}>
                                Lascia vuoto se non hai timestamp.
                            </ThemedText>
                        </View>

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
        </LinearGradient>
    );
}

function Field({ label, icon, value, onChangeText, placeholder, ...rest }: any) {
    return (
        <View style={styles.field}>
            <ThemedText style={styles.label}>{label}</ThemedText>
            <View style={styles.inputWrapper}>
                <Ionicons name={icon} size={18} color={TEXT_MUTED} />
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={TEXT_DIM}
                    style={styles.input}
                    {...rest}
                />
            </View>
        </View>
    );
}
