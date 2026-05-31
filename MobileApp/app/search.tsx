/**
 * search.tsx
 * Modern Search UI
 */

import { useState } from "react";
import {
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
import { PRIMARY, PRIMARY_DEEP, BG_GRADIENT, TEXT_MUTED, TEXT_DIM, TEXT_SOFT } from "@/constants/theme";
import styles from '@/styles/search.styles';

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
              colors={[PRIMARY, PRIMARY_DEEP]}
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
              color={TEXT_MUTED}
          />
        </BlurView>
      </TouchableOpacity>
  );

  return (
      <LinearGradient
          colors={BG_GRADIENT}
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
                  color={TEXT_MUTED}
              />

              <TextInput
                  value={query}
                  onChangeText={setQuery}
                  onSubmitEditing={handleSearch}
                  placeholder="Cerca brani o artisti…"
                  placeholderTextColor={TEXT_MUTED}
                  style={styles.input}
                  returnKeyType="search"
                  autoFocus
              />

              {query.length > 0 && (
                  <TouchableOpacity onPress={() => setQuery("")}>
                    <Ionicons
                        name="close-circle"
                        size={20}
                        color={TEXT_DIM}
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
                  colors={[PRIMARY, PRIMARY_DEEP]}
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
                            color={TEXT_SOFT}
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
