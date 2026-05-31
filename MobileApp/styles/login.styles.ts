import { StyleSheet } from 'react-native';
import { PRIMARY, TEXT_MUTED, TEXT_SOFT } from '@/constants/theme';

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

    scroll: {
        padding: 24,
        paddingTop: 70,
        paddingBottom: 40,
        flexGrow: 1,
    },

    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#FFFFFF10",
        borderWidth: 1,
        borderColor: "#ffffff15",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
    },

    hero: {
        alignItems: "center",
        marginBottom: 28,
    },

    logo: {
        width: 84,
        height: 84,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 18,
        shadowColor: PRIMARY,
        shadowOpacity: 0.5,
        shadowRadius: 18,
        elevation: 10,
    },

    title: {
        color: "white",
        fontSize: 34,
        fontWeight: "800",
        letterSpacing: -1,
        lineHeight: 42,
        textAlign: "center",
    },

    subtitle: {
        color: TEXT_MUTED,
        textAlign: "center",
        fontSize: 14,
        marginTop: 6,
        paddingHorizontal: 16,
        lineHeight: 20,
    },

    card: {
        borderRadius: 28,
        padding: 22,
        gap: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#ffffff10",
    },

    field: { gap: 8 },

    label: {
        color: TEXT_SOFT,
        fontSize: 13,
        fontWeight: "600",
    },

    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ffffff08",
        borderWidth: 1,
        borderColor: "#ffffff10",
        borderRadius: 16,
        paddingHorizontal: 14,
        gap: 10,
    },

    input: {
        flex: 1,
        height: 52,
        color: "white",
        fontSize: 15,
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

    errorText: {
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

    footer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 6,
        marginTop: 24,
    },

    footerText: {
        color: TEXT_MUTED,
        fontSize: 14,
    },

    footerLink: {
        color: PRIMARY,
        fontSize: 14,
        fontWeight: "700",
    },
});
