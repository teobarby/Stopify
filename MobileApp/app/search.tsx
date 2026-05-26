/**
 * search.tsx
 * Modern Search UI
 */

import { useState } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { api, LrclibSong } from "../src/api";

const PRIMARY = "#4A90E2";

export default function SearchScreen() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LrclibSong[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    const q = query.trim();

    if (!q) return;

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const data = await api.search({ q });
      setResults(data);
    } catch {
      setError("Ricerca fallita. Riprova.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: LrclibSong }) => (
      <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push(`/song/${item.id}`)}
          style={styles.cardWrapper}
      >
        <BlurView intensity={30} tint="dark" style={styles.card}>
          <LinearGradient
              colors={[PRIMARY, "#2563EB"]}
              style={styles.iconContainer}
          >
            <Ionicons name="musical-notes" size={22} color="white" />
          </LinearGradient>

          <View style={styles.cardBody}>
            <ThemedText numberOfLines={1} style={styles.songTitle}>
              {item.trackName}
            </ThemedText>

            <ThemedText numberOfLines={1} style={styles.songMeta}>
              {item.artistName}
              {item.albumName ? ` • ${item.albumName}` : ""}
            </ThemedText>
          </View>

          <Ionicons
              name="chevron-forward"
              size={20}
              color="#94A3B8"
          />
        </BlurView>
      </TouchableOpacity>
  );

  return (
      <LinearGradient
          colors={["#020617", "#0F172A", "#111827"]}
          style={styles.container}
      >
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.back()}
                style={styles.backButton}
            >
              <Ionicons
                  name="chevron-back"
                  size={22}
                  color="white"
              />
            </TouchableOpacity>

            <ThemedText style={styles.title}>
              Cerca
            </ThemedText>

            <ThemedText style={styles.subtitle}>
              Trova brani, album e artisti
            </ThemedText>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <BlurView intensity={25} tint="dark" style={styles.searchBar}>
              <Ionicons
                  name="search"
                  size={20}
                  color="#94A3B8"
              />

              <TextInput
                  value={query}
                  onChangeText={setQuery}
                  onSubmitEditing={handleSearch}
                  placeholder="Cerca brani o artisti…"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                  returnKeyType="search"
                  autoFocus
              />

              {query.length > 0 && (
                  <TouchableOpacity onPress={() => setQuery("")}>
                    <Ionicons
                        name="close-circle"
                        size={20}
                        color="#64748B"
                    />
                  </TouchableOpacity>
              )}
            </BlurView>

            <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSearch}
                disabled={loading}
            >
              <LinearGradient
                  colors={[PRIMARY, "#2563EB"]}
                  style={styles.searchButton}
              >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Ionicons
                        name="arrow-forward"
                        size={22}
                        color="white"
                    />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Error */}
          {error ? (
              <ThemedText style={styles.errorText}>
                {error}
              </ThemedText>
          ) : null}

          {/* Results */}
          <FlatList
              data={results}
              renderItem={renderItem}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                loading ? null : (
                    <View style={styles.empty}>
                      <LinearGradient
                          colors={["#1E293B", "#0F172A"]}
                          style={styles.emptyIcon}
                      >
                        <Ionicons
                            name={
                              searched
                                  ? "musical-notes-outline"
                                  : "search-outline"
                            }
                            size={42}
                            color="#CBD5E1"
                        />
                      </LinearGradient>

                      <ThemedText style={styles.emptyTitle}>
                        {searched
                            ? "Nessun risultato"
                            : "Cerca la tua musica"}
                      </ThemedText>

                      <ThemedText style={styles.emptySubtitle}>
                        {searched
                            ? "Prova un altro titolo o artista"
                            : "Trova testi, artisti e album in un attimo"}
                      </ThemedText>
                    </View>
                )
              }
          />
        </KeyboardAvoidingView>
      </LinearGradient>
  );
}

const styles = StyleSheet.create({
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
    color: "#94A3B8",
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
    color: "#94A3B8",
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
    color: "#94A3B8",
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