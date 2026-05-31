import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
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
import { PRIMARY, PRIMARY_DEEP, BG_GRADIENT, TEXT_MUTED, TEXT_DIM, TEXT_SOFT } from "@/constants/theme";
import styles from '@/styles/admin.styles';

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
            colors={BG_GRADIENT}
            style={styles.container}
        >
            <View style={styles.glowOne} />
            <View style={styles.glowTwo} />

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

            <View style={styles.controls}>
                <BlurView intensity={25} tint="dark" style={styles.searchBox}>
                    <Ionicons name="search" size={16} color={TEXT_MUTED} />
                    <TextInput
                        value={query}
                        onChangeText={setQuery}
                        onSubmitEditing={() => fetchSongs()}
                        placeholder="Cerca per titolo o artista"
                        placeholderTextColor={TEXT_DIM}
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
                                color={TEXT_DIM}
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
                                    color={TEXT_SOFT}
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
