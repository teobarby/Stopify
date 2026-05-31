import { StyleSheet } from 'react-native';
import { PRIMARY, BG_MID, TEXT_MUTED, TEXT_SOFT } from '@/constants/theme';

export default StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: BG_MID,
  },

  topBar: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 10,
  },

  profilePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 4,
    paddingRight: 12,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ffffff15",
    maxWidth: 200,
  },

  profileAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  profileInitial: {
    color: "white",
    fontSize: 14,
    fontWeight: "800",
  },

  profileName: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
    flexShrink: 1,
  },

  signInPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ffffff15",
  },

  signInText: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
  },

  glowOne: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 200,
    backgroundColor: "#2563EB33",
    top: -60,
    right: -40,
  },

  glowTwo: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 200,
    backgroundColor: "#7C3AED22",
    bottom: -40,
    left: -40,
  },

  content: {
    gap: 26,
  },

  hero: {
    alignItems: "center",
    gap: 14,
  },

  logoContainer: {
    marginBottom: 10,
  },

  logoGradient: {
    width: 88,
    height: 88,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: PRIMARY,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },

  title: {
    fontSize: 42,
    lineHeight: 50,
    fontWeight: "800",
    color: "white",
    letterSpacing: -1.5,
    paddingVertical: 4,

    // Android
    includeFontPadding: false,
  },

  subtitle: {
    textAlign: "center",
    color: TEXT_SOFT,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 20,
  },

  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ffffff15",
  },

  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 10,
  },

  statusText: {
    color: "white",
    fontWeight: "600",
    fontSize: 13,
  },

  actions: {
    gap: 16,
  },

  primaryButton: {
    height: 64,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    shadowColor: PRIMARY,
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 10,
  },

  primaryButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
  },

  secondaryCard: {
    flex: 1,
    height: 130,
    borderRadius: 26,
    backgroundColor: "#FFFFFF10",
    borderWidth: 1,
    borderColor: "#ffffff10",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    backdropFilter: "blur(10px)",
  },

  publishPill: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ffffff10",
  },

  publishPillText: {
    flex: 1,
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },

  adminPill: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#FCD34D44",
    backgroundColor: "#FCD34D0A",
  },

  adminPillText: {
    flex: 1,
    color: "#FCD34D",
    fontSize: 14,
    fontWeight: "700",
  },

  cardTitle: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },

  footer: {
    marginTop: 12,
    alignItems: "center",
  },

  footerText: {
    color: TEXT_MUTED,
    fontSize: 12,
  },
});
