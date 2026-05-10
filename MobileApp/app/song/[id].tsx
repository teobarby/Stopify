/**
 * song/[id].tsx
 * Modern Song Detail Screen.
 * - Hero card with gradient artwork
 * - Segmented tabs (Lyrics / Synced)
 * - Verse-aware reading layout
 * - Synced view with auto-scroll to current line + floating player
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
    StyleSheet,
    ScrollView,
    View,
    TouchableOpacity,
    ActivityIndicator,
    Animated,
    Easing,
    Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { api, SongDetail, SyncedLine } from "../../src/api";

type TabMode = "plain" | "synced";

const PRIMARY = "#4A90E2";
const PRIMARY_DEEP = "#2563EB";
const { width: SCREEN_W } = Dimensions.get("window");

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(t: number) {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
}

/** Splits plain lyrics into "verses" using blank lines as separators. */
function splitVerses(text: string): string[] {
    if (!text) return [];
    return text
        .replace(/\r\n/g, "\n")
        .split(/\n\s*\n/)
        .map((v) => v.trim())
        .filter(Boolean);
}

/** Deterministic gradient from a string – used for artwork placeholders. */
function gradientFromString(seed: string): [string, string] {
    const palette: [string, string][] = [
        ["#4A90E2", "#2563EB"],
        ["#7C3AED", "#4338CA"],
        ["#EC4899", "#BE185D"],
        ["#F59E0B", "#B45309"],
        ["#10B981", "#047857"],
        ["#06B6D4", "#0E7490"],
        ["#EF4444", "#991B1B"],
    ];
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
        h = (h * 31 + seed.charCodeAt(i)) | 0;
    }
    return palette[Math.abs(h) % palette.length];
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function SongDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const [song, setSong] = useState<SongDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<TabMode>("plain");
    const [currentLine, setCurrentLine] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [elapsed, setElapsed] = useState(0);

    const timerRef = useRef<any>(null);
    const startRef = useRef(0);
    const elapsedRef = useRef(0);
    const scrollRef = useRef<ScrollView>(null);
    const lineYs = useRef<Record<number, number>>({});
    const lineHs = useRef<Record<number, number>>({});
    const syncedTop = useRef(0); // offset of synced container inside ScrollView content
    const viewportH = useRef(0);
    // Reserve room for the floating player so the center is visually correct
    const PLAYER_RESERVE = 130;

    const fadeAnim = useRef(new Animated.Value(0)).current;

    // ── Data fetching ────────────────────────────────────────────────────────
    useEffect(() => {
        if (!id) return;
        setLoading(true);

        api.getSong(Number(id))
            .then((data) => {
                setSong(data);
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 350,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }).start();
            })
            .finally(() => setLoading(false));

        return () => stopPlayback();
    }, [id]);

    // ── Synced lyrics parsing (memoized) ─────────────────────────────────────
    const synced: SyncedLine[] = useMemo(() => {
        if (!song?.synced_lyrics) return [];
        try {
            const parsed = JSON.parse(song.synced_lyrics);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }, [song?.synced_lyrics]);

    const totalDuration = useMemo(() => {
        if (synced.length === 0) return 0;
        return synced[synced.length - 1].time + 4;
    }, [synced]);

    const verses = useMemo(
        () => splitVerses(song?.lyrics || ""),
        [song?.lyrics]
    );

    // ── Playback ─────────────────────────────────────────────────────────────
    const startPlayback = () => {
        if (synced.length === 0) return;
        setPlaying(true);
        startRef.current = Date.now() - elapsedRef.current * 1000;

        timerRef.current = setInterval(() => {
            const t = (Date.now() - startRef.current) / 1000;
            elapsedRef.current = t;
            setElapsed(t);

            let idx = 0;
            for (let i = 0; i < synced.length; i++) {
                if (synced[i].time <= t) idx = i;
            }
            if (idx !== currentLine) setCurrentLine(idx);

            if (t >= totalDuration) {
                stopPlayback();
            }
        }, 200);
    };

    const pausePlayback = () => {
        setPlaying(false);
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const stopPlayback = () => {
        pausePlayback();
        elapsedRef.current = 0;
        setElapsed(0);
        setCurrentLine(0);
    };

    // ── Auto-scroll: center the active line in the visible area ─────────────
    useEffect(() => {
        if (tab !== "synced" || !playing) return;

        const yRel = lineYs.current[currentLine];
        const h = lineHs.current[currentLine] ?? 44;
        const vh = viewportH.current;

        if (typeof yRel !== "number" || vh <= 0 || !scrollRef.current) return;

        // Convert row's parent-relative y to absolute scroll y
        const yAbs = syncedTop.current + yRel;

        // Effective viewport excludes the floating player area at the bottom
        const effectiveH = Math.max(vh - PLAYER_RESERVE, 200);

        // Target = put the line's vertical centre at the centre of effectiveH
        const target = Math.max(0, yAbs + h / 2 - effectiveH / 2);

        scrollRef.current.scrollTo({ y: target, animated: true });
    }, [currentLine, tab, playing]);

    // ── Loading / error states ───────────────────────────────────────────────
    if (loading) {
        return (
            <LinearGradient
                colors={["#020617", "#0F172A"]}
                style={styles.center}
            >
                <ActivityIndicator color={PRIMARY} size="large" />
            </LinearGradient>
        );
    }

    if (!song) {
        return (
            <LinearGradient
                colors={["#020617", "#0F172A"]}
                style={styles.center}
            >
                <Ionicons name="alert-circle-outline" size={42} color="#FCA5A5" />
                <ThemedText style={styles.errorText}>Brano non trovato</ThemedText>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.errorBtn}
                >
                    <ThemedText style={styles.errorBtnText}>Indietro</ThemedText>
                </TouchableOpacity>
            </LinearGradient>
        );
    }

    const artGradient = gradientFromString(`${song.artist}-${song.title}`);
    const progress =
        totalDuration > 0
            ? Math.min(elapsed / totalDuration, 1)
            : 0;

    return (
        <LinearGradient
            colors={["#020617", "#0F172A", "#111827"]}
            style={styles.container}
        >
            {/* Ambient glows */}
            <View
                style={[styles.glow, { backgroundColor: `${artGradient[0]}33` }]}
            />
            <View
                style={[
                    styles.glowTwo,
                    { backgroundColor: `${artGradient[1]}22` },
                ]}
            />

            {/* Top bar */}
            <View style={styles.topBar}>
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => router.back()}
                    style={styles.iconBtn}
                >
                    <Ionicons name="chevron-back" size={22} color="white" />
                </TouchableOpacity>

                <ThemedText style={styles.topBarTitle} numberOfLines={1}>
                    In ascolto
                </ThemedText>

                <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn}>
                    <Ionicons name="ellipsis-horizontal" size={20} color="white" />
                </TouchableOpacity>
            </View>

            <Animated.View
                style={{
                    flex: 1,
                    opacity: fadeAnim,
                    transform: [
                        {
                            translateY: fadeAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [12, 0],
                            }),
                        },
                    ],
                }}
            >
                <ScrollView
                    ref={scrollRef}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    scrollEventThrottle={16}
                    onLayout={(e) => {
                        viewportH.current = e.nativeEvent.layout.height;
                    }}
                >
                    {/* HERO */}
                    <View style={styles.hero}>
                        <LinearGradient
                            colors={artGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.artwork}
                        >
                            <Ionicons
                                name="musical-notes"
                                size={56}
                                color="#ffffffcc"
                            />
                        </LinearGradient>

                        <ThemedText style={styles.title} numberOfLines={2}>
                            {song.title}
                        </ThemedText>

                        <TouchableOpacity activeOpacity={0.8}>
                            <ThemedText style={styles.artist}>
                                {song.artist}
                            </ThemedText>
                        </TouchableOpacity>

                        {song.album ? (
                            <View style={styles.albumPill}>
                                <Ionicons
                                    name="disc-outline"
                                    size={13}
                                    color="#94A3B8"
                                />
                                <ThemedText style={styles.albumText}>
                                    {song.album}
                                </ThemedText>
                            </View>
                        ) : null}

                        {/* Stat row */}
                        <View style={styles.statRow}>
                            <View style={styles.stat}>
                                <Ionicons
                                    name="text-outline"
                                    size={15}
                                    color={PRIMARY}
                                />
                                <ThemedText style={styles.statText}>
                                    {verses.length || 1} strof
                                    {verses.length === 1 ? "a" : "e"}
                                </ThemedText>
                            </View>

                            <View style={styles.statDivider} />

                            <View style={styles.stat}>
                                <Ionicons
                                    name="pulse-outline"
                                    size={15}
                                    color={PRIMARY}
                                />
                                <ThemedText style={styles.statText}>
                                    {synced.length > 0
                                        ? `${synced.length} righe sincronizzate`
                                        : "Solo testo"}
                                </ThemedText>
                            </View>
                        </View>
                    </View>

                    {/* TABS */}
                    <View style={styles.tabsWrapper}>
                        <BlurView
                            intensity={30}
                            tint="dark"
                            style={styles.tabs}
                        >
                            <Tab
                                label="Testo"
                                icon="document-text-outline"
                                active={tab === "plain"}
                                onPress={() => setTab("plain")}
                            />
                            <Tab
                                label="Sincronizzato"
                                icon="pulse"
                                active={tab === "synced"}
                                onPress={() => setTab("synced")}
                                disabled={synced.length === 0}
                            />
                        </BlurView>
                    </View>

                    {/* CONTENT */}
                    {tab === "plain" ? (
                        <View style={styles.plainContent}>
                            {verses.length === 0 ? (
                                <ThemedText style={styles.muted}>
                                    Testo non disponibile.
                                </ThemedText>
                            ) : (
                                verses.map((v, i) => (
                                    <View key={i} style={styles.verseBlock}>
                                        <ThemedText style={styles.verseLabel}>
                                            Strofa {i + 1}
                                        </ThemedText>
                                        <ThemedText style={styles.verseText}>
                                            {v}
                                        </ThemedText>
                                    </View>
                                ))
                            )}
                        </View>
                    ) : (
                        <View
                            style={styles.syncedContent}
                            onLayout={(e) => {
                                syncedTop.current = e.nativeEvent.layout.y;
                            }}
                        >
                            {synced.length === 0 ? (
                                <ThemedText style={styles.muted}>
                                    Nessun testo sincronizzato per questo brano.
                                </ThemedText>
                            ) : (
                                synced.map((l, i) => {
                                    const active = i === currentLine && playing;
                                    const past = i < currentLine && playing;
                                    return (
                                        <View
                                            key={i}
                                            onLayout={(e) => {
                                                lineYs.current[i] =
                                                    e.nativeEvent.layout.y;
                                                lineHs.current[i] =
                                                    e.nativeEvent.layout.height;
                                            }}
                                            style={[
                                                styles.syncRow,
                                                active && styles.syncRowActive,
                                            ]}
                                        >
                                            <View
                                                style={[
                                                    styles.timePill,
                                                    active && styles.timePillActive,
                                                ]}
                                            >
                                                <ThemedText
                                                    style={[
                                                        styles.timeText,
                                                        active && styles.timeTextActive,
                                                    ]}
                                                >
                                                    {formatTime(l.time)}
                                                </ThemedText>
                                            </View>
                                            <ThemedText
                                                style={[
                                                    styles.syncText,
                                                    past && styles.syncTextPast,
                                                    active && styles.syncTextActive,
                                                ]}
                                            >
                                                {l.line}
                                            </ThemedText>
                                        </View>
                                    );
                                })
                            )}
                        </View>
                    )}

                    {/* Footer spacer to clear the floating player */}
                    {tab === "synced" && synced.length > 0 ? (
                        <View style={{ height: 110 }} />
                    ) : (
                        <View style={{ height: 32 }} />
                    )}
                </ScrollView>

                {/* FLOATING PLAYER (Synced tab only) */}
                {tab === "synced" && synced.length > 0 ? (
                    <BlurView
                        intensity={40}
                        tint="dark"
                        style={styles.player}
                    >
                        <View style={styles.progressTrack}>
                            <View
                                style={[
                                    styles.progressFill,
                                    { width: `${progress * 100}%` },
                                ]}
                            />
                        </View>

                        <View style={styles.playerRow}>
                            <ThemedText style={styles.playerTime}>
                                {formatTime(elapsed)}
                            </ThemedText>

                            <View style={styles.playerControls}>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={stopPlayback}
                                    style={styles.smallBtn}
                                >
                                    <Ionicons
                                        name="stop"
                                        size={16}
                                        color="#CBD5E1"
                                    />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    onPress={() =>
                                        playing ? pausePlayback() : startPlayback()
                                    }
                                >
                                    <LinearGradient
                                        colors={[PRIMARY, PRIMARY_DEEP]}
                                        style={styles.playBtn}
                                    >
                                        <Ionicons
                                            name={playing ? "pause" : "play"}
                                            size={20}
                                            color="white"
                                        />
                                    </LinearGradient>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => {
                                        const next = Math.min(
                                            currentLine + 1,
                                            synced.length - 1
                                        );
                                        setCurrentLine(next);
                                        elapsedRef.current = synced[next].time;
                                        setElapsed(synced[next].time);
                                        startRef.current =
                                            Date.now() - synced[next].time * 1000;
                                    }}
                                    style={styles.smallBtn}
                                >
                                    <Ionicons
                                        name="play-skip-forward"
                                        size={16}
                                        color="#CBD5E1"
                                    />
                                </TouchableOpacity>
                            </View>

                            <ThemedText style={styles.playerTime}>
                                {formatTime(totalDuration)}
                            </ThemedText>
                        </View>
                    </BlurView>
                ) : null}
            </Animated.View>
        </LinearGradient>
    );
}

// ─── Tab component ───────────────────────────────────────────────────────────

function Tab({
    label,
    icon,
    active,
    onPress,
    disabled,
}: {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    active: boolean;
    onPress: () => void;
    disabled?: boolean;
}) {
    return (
        <TouchableOpacity
            disabled={disabled}
            activeOpacity={0.85}
            onPress={onPress}
            style={{ flex: 1 }}
        >
            {active ? (
                <LinearGradient
                    colors={[PRIMARY, PRIMARY_DEEP]}
                    style={styles.tabActive}
                >
                    <Ionicons name={icon} size={15} color="white" />
                    <ThemedText style={styles.tabTextActive}>{label}</ThemedText>
                </LinearGradient>
            ) : (
                <View
                    style={[
                        styles.tabInactive,
                        disabled && { opacity: 0.4 },
                    ]}
                >
                    <Ionicons
                        name={icon}
                        size={15}
                        color={disabled ? "#475569" : "#94A3B8"}
                    />
                    <ThemedText
                        style={[
                            styles.tabText,
                            disabled && { color: "#475569" },
                        ]}
                    >
                        {label}
                    </ThemedText>
                </View>
            )}
        </TouchableOpacity>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1 },

    glow: {
        position: "absolute",
        width: 320,
        height: 320,
        borderRadius: 320,
        top: -120,
        right: -90,
    },

    glowTwo: {
        position: "absolute",
        width: 260,
        height: 260,
        borderRadius: 260,
        bottom: -90,
        left: -80,
    },

    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
    },

    errorText: {
        color: "#FCA5A5",
        marginTop: 6,
        fontSize: 16,
        fontWeight: "600",
    },

    errorBtn: {
        marginTop: 12,
        paddingHorizontal: 22,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: "#FFFFFF10",
        borderWidth: 1,
        borderColor: "#ffffff15",
    },

    errorBtnText: {
        color: "white",
        fontWeight: "600",
    },

    // Top bar
    topBar: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 6,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },

    topBarTitle: {
        flex: 1,
        textAlign: "center",
        color: "#94A3B8",
        fontSize: 12,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        fontWeight: "700",
    },

    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#FFFFFF10",
        borderWidth: 1,
        borderColor: "#ffffff15",
        alignItems: "center",
        justifyContent: "center",
    },

    scrollContent: {
        paddingBottom: 24,
    },

    // Hero
    hero: {
        alignItems: "center",
        paddingHorizontal: 24,
        paddingTop: 18,
        paddingBottom: 24,
    },

    artwork: {
        width: SCREEN_W * 0.55,
        height: SCREEN_W * 0.55,
        maxWidth: 240,
        maxHeight: 240,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 24,
        shadowColor: "#000",
        shadowOpacity: 0.5,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 16 },
        elevation: 12,
    },

    title: {
        color: "white",
        fontSize: 28,
        lineHeight: 34,
        fontWeight: "800",
        textAlign: "center",
        letterSpacing: -0.6,
        paddingVertical: 2,
        includeFontPadding: false,
    },

    artist: {
        marginTop: 6,
        color: PRIMARY,
        fontSize: 15,
        fontWeight: "600",
    },

    albumPill: {
        marginTop: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 14,
        backgroundColor: "#FFFFFF08",
        borderWidth: 1,
        borderColor: "#ffffff10",
    },

    albumText: {
        color: "#94A3B8",
        fontSize: 12,
        fontWeight: "500",
    },

    statRow: {
        marginTop: 22,
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 18,
        backgroundColor: "#FFFFFF06",
        borderWidth: 1,
        borderColor: "#ffffff10",
    },

    stat: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },

    statText: {
        color: "#CBD5E1",
        fontSize: 12,
        fontWeight: "600",
    },

    statDivider: {
        width: 1,
        height: 16,
        backgroundColor: "#ffffff15",
    },

    // Tabs
    tabsWrapper: {
        paddingHorizontal: 20,
        marginBottom: 18,
    },

    tabs: {
        flexDirection: "row",
        borderRadius: 16,
        padding: 5,
        gap: 4,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#ffffff10",
    },

    tabActive: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 10,
        borderRadius: 12,
    },

    tabInactive: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 10,
        borderRadius: 12,
    },

    tabText: {
        color: "#94A3B8",
        fontSize: 13,
        fontWeight: "600",
    },

    tabTextActive: {
        color: "white",
        fontSize: 13,
        fontWeight: "700",
    },

    // Plain lyrics
    plainContent: {
        paddingHorizontal: 24,
        gap: 22,
    },

    verseBlock: {
        padding: 18,
        borderRadius: 22,
        backgroundColor: "#FFFFFF05",
        borderWidth: 1,
        borderColor: "#ffffff10",
    },

    verseLabel: {
        color: PRIMARY,
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 1.5,
        textTransform: "uppercase",
        marginBottom: 10,
    },

    verseText: {
        color: "#E2E8F0",
        fontSize: 16,
        lineHeight: 28,
        fontWeight: "400",
    },

    muted: {
        color: "#64748B",
        fontSize: 14,
        textAlign: "center",
        marginTop: 30,
    },

    // Synced
    syncedContent: {
        paddingHorizontal: 20,
        gap: 4,
    },

    syncRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 14,
    },

    syncRowActive: {
        backgroundColor: "#4A90E218",
        borderWidth: 1,
        borderColor: "#4A90E255",
    },

    timePill: {
        marginTop: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        backgroundColor: "#FFFFFF08",
        borderWidth: 1,
        borderColor: "#ffffff10",
        minWidth: 44,
        alignItems: "center",
    },

    timePillActive: {
        backgroundColor: PRIMARY,
        borderColor: PRIMARY,
    },

    timeText: {
        color: "#64748B",
        fontSize: 10,
        fontWeight: "700",
        fontVariant: ["tabular-nums"],
    },

    timeTextActive: {
        color: "white",
    },

    syncText: {
        flex: 1,
        color: "#94A3B8",
        fontSize: 16,
        lineHeight: 24,
    },

    syncTextPast: {
        color: "#475569",
    },

    syncTextActive: {
        color: "white",
        fontSize: 18,
        lineHeight: 26,
        fontWeight: "700",
    },

    // Floating player
    player: {
        position: "absolute",
        left: 16,
        right: 16,
        bottom: 24,
        borderRadius: 24,
        padding: 14,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#ffffff15",
        backgroundColor: "#0F172AAA",
    },

    progressTrack: {
        height: 3,
        borderRadius: 3,
        backgroundColor: "#ffffff15",
        overflow: "hidden",
        marginBottom: 12,
    },

    progressFill: {
        height: 3,
        backgroundColor: PRIMARY,
        borderRadius: 3,
    },

    playerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
    },

    playerTime: {
        color: "#94A3B8",
        fontSize: 11,
        fontWeight: "700",
        fontVariant: ["tabular-nums"],
        width: 38,
        textAlign: "center",
    },

    playerControls: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
    },

    smallBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFFFF08",
        borderWidth: 1,
        borderColor: "#ffffff10",
    },

    playBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: PRIMARY,
        shadowOpacity: 0.5,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8,
    },
});
