import { StyleSheet } from 'react-native';
import { PRIMARY, TEXT_MUTED } from '@/constants/theme';

export default StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 70,
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

  searchContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 20,
  },

  searchBar: {
    flex: 1,
    height: 58,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ffffff10",
    gap: 10,
  },

  input: {
    flex: 1,
    color: "white",
    fontSize: 15,
  },

  searchButton: {
    width: 58,
    height: 58,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: PRIMARY,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
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
    borderRadius: 24,
    padding: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ffffff10",
  },

  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 18,
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

  songMeta: {
    color: TEXT_MUTED,
    marginTop: 4,
    fontSize: 13,
  },

  empty: {
    alignItems: "center",
    marginTop: 80,
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 110,
    height: 110,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 22,
  },

  emptyTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "700",
  },

  emptySubtitle: {
    color: TEXT_MUTED,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
    fontSize: 14,
  },

  errorText: {
    color: "#EF4444",
    textAlign: "center",
    marginBottom: 14,
    fontSize: 13,
  },
});
