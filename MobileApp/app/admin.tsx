/**
 * admin.tsx
 * Pannello amministratore: lista completa di tutte le canzoni (anche
 * anonime), con possibilità di modificare o cancellare ognuna.
 *
 * Visibile solo agli utenti con `is_admin = true`. Non-admin vengono
 * reindirizzati alla home.
 */

import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    TextInput,
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
const DANGER = "#FCA5A5";

type Filter = "all" | "anonymous";

export default function AdminScreen() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [songs, setSongs] = useState<LrclibSong[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState<Filter>("all");

    const fetchSongs = useCallback(async () => {
        setError(null);
        try {
            const data = await api.adminListSongs({
                q: query.trim() || undefined,
                anonymous: filter === "anonymous",
            });
            setSongs(data);
        } catch (e: any) {
            setError(e.message || "Impossibile caricare il catalogo");
        }
    }, [query, filter]);

    // Re-fetch on focus (es. ritorno dopo edit)
    useFocusEffect(
        useCallback(() => {
            (async () => {
                setLoading(true);
                await fetchSongs();
                setLoading(false);
            })();
        }, [fetchSongs])
    );

    // Gate: solo admin
    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.replace("/login");
            return;
        }
        if (!user.is_admin) {
            router.replace("/");
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

    const renderItem = ({ item }: { item: LrclibSong }) => {
        const anonymous = !item.submittedBy;
        return (
            <BlurView intensity={30} tint="dark" style={styles.card}>
                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => router.push(`/song/${item.id}`)}
                    style={styles.cardBody}
                >
                    <LinearGradient
                        colors={
                            anonymous ? ["#475569", "#1E293B"] : [PRIMARY, "#7C3AED"]
                        }
                        style={styles.iconBox}
                    >
                        <Ionicons
                            name={anonymous ? "help-outline" : "musical-notes"}
                            size={20}
                            color="white"
                        />
                    </LinearGradient>

                    <View style={{ flex: 1 }}>
                        <ThemedText style={styles.title} numberOfLines={1}>
                            {item.trackName}
                        </ThemedText>
                        <ThemedText style={styles.artist} numberOfLines={1}>
                            {item.artistName}
                        </ThemedText>
                        <ThemedText style={styles.author} numberOfLines={1}>
                            {anonymous
                                ? "Pubblicato anonimo (PoW)"
                                : `Pubblicato da @${item.submittedBy}`}
                        </ThemedText>
                    </View>
                </TouchableOpacity>

                <View style={styles.actions}>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => router.push(`/edit-song/${item.id}`)}
                        style={styles.actionBtn}
                    >
                        <Ionicons
                            name="create-outline"
                            size={18}
                            color={PRIMARY}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleDelete(item)}
                        style={[styles.actionBtn, styles.deleteBtn]}
                    >
                        <Ionicons name="trash-outline" size={18} color={DANGER} />
                    </TouchableOpacity>
                </View>
            </BlurView>
        );
    };

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

                <View style={styles.adminBadge}>
                    <Ionicons
                        name="shield-checkmark"
                        size={14}
                        color="#FCD34D"
                    />
                    <ThemedText style={styles.adminBadgeText}>
                        Pannello admin
                    </ThemedText>
                </View>

                <ThemedText style={styles.h1}>Catalogo</ThemedText>
                <ThemedText style={styles.subtitle}>
                    {songs.length === 0
                        ? "Nessun brano nel catalogo."
                        : `${songs.length} brano${songs.length === 1 ? "" : "i"} totali`}
                </ThemedText>
            </View>

            {/* SEARCH + FILTERS */}
            <View style={styles.controls}>
                <BlurView intensity={25} tint="dark" style={styles.searchBox}>
                    <Ionicons name="search" size={16} color="#94A3B8" />
                    <TextInput
                        value={query}
                        onChangeText={setQuery}
                        onSubmitEditing={() => fetchSongs()}
                        placeholder="Cerca per titolo o artista"
                        placeholderTextColor="#64748B"
                        style={styles.searchInput}
                        returnKeyType="search"
                    />
                    {query ? (
                        <TouchableOpacity
                            onPress={() => {
                                setQuery("");
                                fetchSongs();
                            }}
                        >
                            <Ionicons
                                name="close-circle"
                                size={16}
                                color="#64748B"
                            />
                        </TouchableOpacity>
                    ) : null}
                </BlurView>

                <View style={styles.filterRow}>
                    <TouchableOpacity
                        onPress={() => setFilter("all")}
                        style={[
                            styles.chip,
                            filter === "all" && styles.chipActive,
                        ]}
                        activeOpacity={0.8}
                    >
                        <ThemedText
                            style={[
                                styles.chipText,
                                filter === "all" && styles.chipTextActive,
                            ]}
                        >
                            Tutti
                        </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setFilter("anonymous")}
                        style={[
                            styles.chip,
                            filter === "anonymous" && styles.chipActive,
                        ]}
                        activeOpacity={0.8}
                    >
                        <ThemedText
                            style={[
                                styles.chipText,
                                filter === "anonymous" && styles.chipTextActive,
                            ]}
                        >
                            Solo anonimi
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            </View>

            {error ? (
                <BlurView intensity={25} tint="dark" style={styles.errorBox}>
                    <Ionicons name="warning-outline" size={18} color={DANGER} />
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
                                    name="albums-outline"
                                    size={42}
                                    color="#CBD5E1"
                                />
                            </LinearGradient>
                            <ThemedText style={styles.emptyTitle}>
                                Catalogo vuoto
                            </ThemedText>
                            <ThemedText style={styles.emptySub}>
                                Nessun brano corrisponde ai filtri attuali.
                            </ThemedText>
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
        backgroundColor: "#FCD34D22",
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
        marginBottom: 14,
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

    adminBadge: {
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#FCD34D15",
        borderColor: "#FCD34D55",
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        marginBottom: 10,
    },

    adminBadgeText: {
        color: "#FCD34D",
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 0.3,
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

    controls: {
        paddingHorizontal: 24,
        marginBottom: 14,
        gap: 10,
    },

    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#ffffff15",
    },

    searchInput: {
        flex: 1,
        color: "white",
        fontSize: 14,
        padding: 0,
    },

    filterRow: {
        flexDirection: "row",
        gap: 8,
    },

    chip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: "#FFFFFF08",
        borderWidth: 1,
        borderColor: "#ffffff10",
    },

    chipActive: {
        backgroundColor: PRIMARY + "33",
        borderColor: PRIMARY + "77",
    },

    chipText: {
        color: "#94A3B8",
        fontSize: 12,
        fontWeight: "600",
    },

    chipTextActive: {
        color: "white",
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

    author: {
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
        color: DANGER,
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
});
