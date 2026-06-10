import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    TouchableOpacity,
    View,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { Screen } from "@/components/screen";
import { api, LrclibSong } from "../src/api";
import { useAuth } from "../src/AuthContext";
import { showAlert, showConfirm } from "../src/dialog";
import { PRIMARY, PRIMARY_DEEP, TEXT_SOFT } from "@/constants/theme";
import styles from '@/styles/my-lyrics.styles';

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
        <Screen style={styles.container}>
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
                    style={{ flex: 1 }}
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
                                    color={TEXT_SOFT}
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
                                    colors={[PRIMARY, PRIMARY_DEEP]}
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
        </Screen>
    );
}
