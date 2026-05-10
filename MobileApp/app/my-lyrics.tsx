/**
 * my-lyrics.tsx
 * Schermata "Le mie pubblicazioni": lista dei brani caricati dall'utente
 * autenticato, con possibilità di editare o cancellare ognuno.
 */

import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { api, LrclibSong } from "../src/api";
import { useAuth } from "../src/AuthContext";
import { showAlert, showConfirm } from "../src/dialog";

const PRIMARY = "#4A90E2";

export default function MyLyricsScreen() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [songs, setSongs] = useState<LrclibSong[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSongs = useCallback(async () => {
        setError(null);
        try {
            const data = await api.getMyLyrics();
            setSongs(data);
        } catch (e: any) {
            setError(e.message || "Impossibile caricare i tuoi brani");
        }
    }, []);

    // Re-fetch when the screen comes back into focus (e.g. after edit)
    useFocusEffect(
        useCallback(() => {
            (async () => {
                setLoading(true);
                await fetchSongs();
                setLoading(false);
            })();
        }, [fetchSongs])
    );

    // Redirect non-auth users to /login
    useEffect(() => {
        if (!authLoading && !user) {
            router.replace("/login");
        }
    }, [authLoading, user, router]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchSongs();
        setRefreshing(false);
    };

    const handleDelete = async (song: LrclibSong) => {
        const ok = await showConfirm(
            "Cancella brano",
            `Vuoi davvero cancellare "${song.trackName}" di ${song.artistName}? L'operazione è irreversibile.`,
            { confirmLabel: "Cancella", cancelLabel: "Annulla", destructive: true }
        );
        if (!ok) return;

        try {
            await api.deleteLyrics(song.id);
            setSongs((prev) => prev.filter((s) => s.id !== song.id));
        } catch (e: any) {
            showAlert("Errore", e.message || "Cancellazione fallita.");
        }
    };

    const renderItem = ({ item }: { item: LrclibSong }) => (
        <BlurView intensity={30} tint="dark" style={styles.card}>
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push(`/song/${item.id}`)}
                style={styles.cardBody}
            >
                <LinearGradient
                    colors={[PRIMARY, "#7C3AED"]}
                    style={styles.iconBox}
                >
                    <Ionicons name="musical-notes" size={20} color="white" />
                </LinearGradient>

                <View style={{ flex: 1 }}>
                    <ThemedText style={styles.title} numberOfLines={1}>
                        {item.trackName}
                    </ThemedText>
                    <ThemedText style={styles.artist} numberOfLines={1}>
                        {item.artistName}
                    </ThemedText>
                    {item.albumName ? (
                        <ThemedText style={styles.album} numberOfLines={1}>
                            {item.albumName}
                        </ThemedText>
                    ) : null}
                </View>
            </TouchableOpacity>

            <View style={styles.actions}>
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => router.push(`/edit-song/${item.id}`)}
                    style={styles.actionBtn}
                >
                    <Ionicons name="create-outline" size={18} color={PRIMARY} />
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleDelete(item)}
                    style={[styles.actionBtn, styles.deleteBtn]}
                >
                    <Ionicons name="trash-outline" size={18} color="#FCA5A5" />
                </TouchableOpacity>
            </View>
        </BlurView>
    );

    return (
        <LinearGradient
            colors={["#020617", "#0F172A", "#111827"]}
            style={styles.container}
        >
            <View style={styles.glowOne} />
            <View style={styles.glowTwo} />

            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <Ionicons name="chevron-back" size={22} color="white" />
                </TouchableOpacity>

                <ThemedText style={styles.h1}>I miei testi</ThemedText>
                <ThemedText style={styles.subtitle}>
                    {songs.length === 0
                        ? "Non hai ancora pubblicato nessun brano."
                        : `${songs.length} brano${songs.length === 1 ? "" : "i"} pubblicato${songs.length === 1 ? "" : "i"}`}
                </ThemedText>
            </View>

            {error ? (
                <BlurView intensity={25} tint="dark" style={styles.errorBox}>
                    <Ionicons name="warning-outline" size={18} color="#FCA5A5" />
                    <ThemedText style={styles.errorText}>{error}</ThemedText>
                </BlurView>
            ) : null}

            {loading ? (
                <ActivityIndicator
                    color={PRIMARY}
                    size="large"
                    style={{ marginTop: 60 }}
                />
            ) : (
                <FlatList
                    data={songs}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={PRIMARY}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <LinearGradient
                                colors={["#1E293B", "#0F172A"]}
                                style={styles.emptyIcon}
                            >
                                <Ionicons
                                    name="cloud-upload-outline"
                                    size={42}
                                    color="#CBD5E1"
                                />
                            </LinearGradient>
                            <ThemedText style={styles.emptyTitle}>
                                Niente da mostrare
                            </ThemedText>
                            <ThemedText style={styles.emptySub}>
                                Pubblica il tuo primo brano dalla schermata
                                Publish.
                            </ThemedText>
                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => router.push("/publish")}
                                style={{ marginTop: 18 }}
                            >
                                <LinearGradient
                                    colors={[PRIMARY, "#2563EB"]}
                                    style={styles.cta}
                                >
                                    <Ionicons
                                        name="add"
                                        size={18}
                                        color="white"
                                    />
                                    <ThemedText style={styles.ctaText}>
                                        Pubblica
                                    </ThemedText>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 70 },

    glowOne: {
        position: "absolute",
        width: 280,
        height: 280,
        borderRadius: 280,
        backgroundColor: "#2563EB22",
        top: -90,
        right: -70,
    },
    glowTwo: {
        position: "absolute",
        width: 240,
        height: 240,
        borderRadius: 240,
        backgroundColor: "#7C3AED22",
        bottom: -70,
        left: -60,
    },

    header: {
        paddingHorizontal: 24,
        marginBottom: 18,
    },

    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#FFFFFF10",
        borderWidth: 1,
        borderColor: "#ffffff15",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },

    h1: {
        fontSize: 36,
        lineHeight: 42,
        fontWeight: "800",
        color: "white",
        letterSpacing: -1,
        paddingVertical: 4,
        includeFontPadding: false,
    },

    subtitle: {
        color: "#94A3B8",
        marginTop: 4,
        fontSize: 13,
    },

    list: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },

    card: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        padding: 14,
        marginBottom: 12,
        borderRadius: 22,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#ffffff10",
    },

    cardBody: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        gap: 14,
    },

    iconBox: {
        width: 46,
        height: 46,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },

    title: {
        color: "white",
        fontSize: 15,
        fontWeight: "700",
    },

    artist: {
        color: "#CBD5E1",
        marginTop: 2,
        fontSize: 12,
    },

    album: {
        color: "#64748B",
        marginTop: 2,
        fontSize: 11,
    },

    actions: {
        flexDirection: "row",
        gap: 6,
    },

    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFFFF08",
        borderWidth: 1,
        borderColor: "#ffffff10",
    },

    deleteBtn: {
        backgroundColor: "#7F1D1D22",
        borderColor: "#FCA5A533",
    },

    errorBox: {
        marginHorizontal: 24,
        marginBottom: 14,
        padding: 12,
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#FCA5A555",
    },

    errorText: {
        flex: 1,
        color: "#FCA5A5",
        fontSize: 12,
    },

    empty: {
        alignItems: "center",
        marginTop: 60,
        paddingHorizontal: 24,
    },

    emptyIcon: {
        width: 110,
        height: 110,
        borderRadius: 32,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 22,
    },

    emptyTitle: {
        color: "white",
        fontSize: 22,
        fontWeight: "700",
    },

    emptySub: {
        color: "#94A3B8",
        textAlign: "center",
        marginTop: 8,
        fontSize: 13,
        lineHeight: 19,
    },

    cta: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 16,
        shadowColor: PRIMARY,
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
    },

    ctaText: {
        color: "white",
        fontWeight: "700",
        fontSize: 14,
    },
});
