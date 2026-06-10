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
    ScrollView,
    View,
    TouchableOpacity,
    ActivityIndicator,
    Animated,
    Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { Screen } from "@/components/screen";
import { api, LrclibSong, SyncedLine } from "../../src/api";
import { PRIMARY, PRIMARY_DEEP, BG_GRADIENT, TEXT_MUTED, TEXT_SOFT } from "@/constants/theme";
import styles from '@/styles/song.styles';

type TabMode = "plain" | "synced";

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

function parseLRC(lrc: string | null): SyncedLine[] {
    if (!lrc) return [];
    return lrc.split("\n").flatMap((line) => {
        const m = line.match(/\[(\d{2}):(\d{2}\.\d+)\]\s*(.*)/);
        if (!m) return [];
        return [{ time: parseInt(m[1], 10) * 60 + parseFloat(m[2]), line: m[3] }];
    });
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function SongDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const [song, setSong] = useState<LrclibSong | null>(null);
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
        return parseLRC(song?.syncedLyrics ?? null);
    }, [song?.syncedLyrics]);

    const totalDuration = useMemo(() => {
        if (synced.length === 0) return 0;
        return synced[synced.length - 1].time + 4;
    }, [synced]);

    const verses = useMemo(
        () => splitVerses(song?.plainLyrics || ""),
        [song?.plainLyrics]
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
                colors={BG_GRADIENT}
                style={styles.center}
            >
                <ActivityIndicator color={PRIMARY} size="large" />
            </LinearGradient>
        );
    }

    if (!song) {
        return (
            <LinearGradient
                colors={BG_GRADIENT}
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

    const artGradient = gradientFromString(`${song.artistName}-${song.trackName}`);
    const progress =
        totalDuration > 0
            ? Math.min(elapsed / totalDuration, 1)
            : 0;

    return (
        <Screen style={styles.container}>
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

                {/* Spacer per mantenere il titolo perfettamente centrato */}
                <View style={styles.iconBtnPlaceholder} />
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
                    style={{ flex: 1 }}
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
                            {song.trackName}
                        </ThemedText>

                        <TouchableOpacity activeOpacity={0.8}>
                            <ThemedText style={styles.artist}>
                                {song.artistName}
                            </ThemedText>
                        </TouchableOpacity>

                        {song.albumName ? (
                            <View style={styles.albumPill}>
                                <Ionicons
                                    name="disc-outline"
                                    size={13}
                                    color={TEXT_MUTED}
                                />
                                <ThemedText style={styles.albumText}>
                                    {song.albumName}
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
                                        color={TEXT_SOFT}
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
                                        color={TEXT_SOFT}
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
        </Screen>
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
                        color={disabled ? "#475569" : TEXT_MUTED}
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
