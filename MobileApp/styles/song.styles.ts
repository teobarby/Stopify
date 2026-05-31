import { StyleSheet, Dimensions } from 'react-native';
import { PRIMARY, TEXT_MUTED, TEXT_DIM, TEXT_SOFT } from '@/constants/theme';

const SCREEN_W = Dimensions.get('window').width;

export default StyleSheet.create({
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

    iconBtnPlaceholder: {
        width: 40,
        height: 40,
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
        color: TEXT_MUTED,
        fontSize: 12,
        letterSpacing: 1.5,
        textTransform: "uppercase",
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
        color: TEXT_MUTED,
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
        color: TEXT_SOFT,
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
        color: TEXT_MUTED,
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
        color: TEXT_DIM,
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
        color: TEXT_DIM,
        fontSize: 10,
        fontWeight: "700",
        fontVariant: ["tabular-nums"],
    },

    timeTextActive: {
        color: "white",
    },

    syncText: {
        flex: 1,
        color: TEXT_MUTED,
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
        color: TEXT_MUTED,
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
