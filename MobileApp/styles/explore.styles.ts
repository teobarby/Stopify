import { StyleSheet } from 'react-native';
import { PRIMARY, TEXT_MUTED, TEXT_DIM, TEXT_SOFT } from '@/constants/theme';

export default StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 70,
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
    width: 220,
    height: 220,
    borderRadius: 220,
    backgroundColor: "#7C3AED22",
    bottom: -50,
    left: -60,
  },

  header: {
    paddingHorizontal: 24,
    marginBottom: 24,
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
    marginTop: 6,
    fontSize: 15,
  },

  sortContainer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 24,
    marginBottom: 24,
  },

  sortButton: {
    height: 42,
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#ffffff10",
  },

  sortText: {
    color: TEXT_MUTED,
    fontSize: 13,
    fontWeight: "600",
  },

  sortTextActive: {
    color: "white",
  },

  list: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  cardWrapper: {
    marginBottom: 14,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 26,
    padding: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ffffff10",
  },

  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },

  cardBody: {
    flex: 1,
  },

  songTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },

  artist: {
    color: TEXT_SOFT,
    marginTop: 4,
    fontSize: 13,
  },

  album: {
    color: TEXT_DIM,
    marginTop: 4,
    fontSize: 12,
  },

  errorBox: {
    marginHorizontal: 24,
    marginBottom: 18,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ffffff10",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    overflow: "hidden",
  },

  errorText: {
    flex: 1,
    color: "#FCA5A5",
    fontSize: 13,
  },

  retryText: {
    color: PRIMARY,
    fontWeight: "700",
    fontSize: 13,
  },

  empty: {
    alignItems: "center",
    marginTop: 90,
    paddingHorizontal: 24,
  },

  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 34,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },

  emptyTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "700",
  },

  emptySubtitle: {
    color: TEXT_MUTED,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22,
    fontSize: 14,
  },
});
