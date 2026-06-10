import { StyleSheet } from 'react-native';
import { PRIMARY, TEXT_MUTED } from '@/constants/theme';

export default StyleSheet.create({
    container: { flex: 1 },

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

    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
    },
    errorTitle: {
        color: "#FCA5A5",
        fontSize: 16,
        fontWeight: "600",
        marginTop: 6,
    },
    backCta: {
        marginTop: 12,
        paddingHorizontal: 22,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: "#FFFFFF10",
        borderWidth: 1,
        borderColor: "#ffffff15",
    },
    backCtaText: { color: "white", fontWeight: "600" },

    scroll: {
        padding: 24,
        paddingTop: 70,
        paddingBottom: 40,
    },

    header: { marginBottom: 24 },

    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#FFFFFF10",
        borderWidth: 1,
        borderColor: "#ffffff15",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },

    title: {
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
        marginTop: 6,
        fontSize: 13,
        lineHeight: 19,
    },

    formCard: {
        borderRadius: 28,
        padding: 20,
        gap: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#ffffff10",
    },

    errorBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#7F1D1D33",
        borderWidth: 1,
        borderColor: "#FCA5A555",
        borderRadius: 14,
        padding: 12,
    },

    errorBoxText: {
        flex: 1,
        color: "#FCA5A5",
        fontSize: 13,
    },

    primaryBtn: {
        height: 56,
        borderRadius: 18,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        marginTop: 4,
        shadowColor: PRIMARY,
        shadowOpacity: 0.4,
        shadowRadius: 14,
        elevation: 8,
    },

    primaryBtnText: {
        color: "white",
        fontSize: 16,
        fontWeight: "700",
    },
});
