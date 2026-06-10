import { StyleSheet } from 'react-native';
import { PRIMARY, TEXT_MUTED, TEXT_DIM, TEXT_SOFT } from '@/constants/theme';

export default StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollContent: {
    padding: 24,
    paddingTop: 70,
    paddingBottom: 40,
  },

  header: {
    marginBottom: 28,
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
    marginBottom: 16,
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
    color: TEXT_MUTED,
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
  },

  formCard: {
    borderRadius: 30,
    padding: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ffffff10",
    gap: 18,
  },

  infoCard: {
    flexDirection: "row",
    gap: 12,
    borderRadius: 18,
    padding: 16,
    alignItems: "flex-start",
  },

  infoText: {
    flex: 1,
    color: "#93C5FD",
    fontSize: 13,
    lineHeight: 20,
  },

  primaryButton: {
    height: 60,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
    shadowColor: PRIMARY,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },

  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  loadingCard: {
    width: "100%",
    borderRadius: 32,
    padding: 28,
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ffffff10",
  },

  loadingIcon: {
    width: 90,
    height: 90,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "700",
    marginTop: 20,
  },

  loadingText: {
    color: TEXT_SOFT,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22,
    fontSize: 14,
  },

  loadingHint: {
    color: TEXT_DIM,
    textAlign: "center",
    marginTop: 14,
    fontSize: 12,
    lineHeight: 18,
  },

  successCard: {
    width: "100%",
    borderRadius: 32,
    padding: 30,
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ffffff10",
  },

  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },

  successTitle: {
    color: "white",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 22,
  },

  successDesc: {
    color: TEXT_SOFT,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 28,
    lineHeight: 24,
    fontSize: 15,
  },

  glowOne: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 260,
    backgroundColor: "#2563EB22",
    top: -80,
    right: -60,
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
});
