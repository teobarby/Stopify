import { StyleSheet } from 'react-native';
import { PRIMARY, TEXT_MUTED, TEXT_DIM, TEXT_SOFT } from '@/constants/theme';

export default StyleSheet.create({
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
        color: TEXT_MUTED,
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
        color: TEXT_SOFT,
        marginTop: 2,
        fontSize: 12,
    },

    album: {
        color: TEXT_DIM,
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
        color: TEXT_MUTED,
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
