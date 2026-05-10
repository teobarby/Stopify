/**
 * explore.tsx
 * Modern Explore Screen
 */

import { useEffect, useState, useCallback } from "react";

import {
  StyleSheet,
  FlatList,
  View,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";

import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { api, Song } from "../src/api";

type SortMode = "recent" | "title" | "artist";

const PRIMARY = "#4A90E2";

const SORT_OPTIONS: {
  label: string;
  value: SortMode;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    label: "Recenti",
    value: "recent",
    icon: "time-outline",
  },
  {
    label: "Titolo",
    value: "title",
    icon: "text-outline",
  },
  {
    label: "Artista",
    value: "artist",
    icon: "person-outline",
  },
];

export default function ExploreScreen() {
  const router = useRouter();

  const [songs, setSongs] = useState<Song[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [sort, setSort] =
      useState<SortMode>("recent");

  const [loading, setLoading] = useState(false);

  const [refreshing, setRefreshing] =
      useState(false);

  const [error, setError] = useState("");

  const fetchPage = useCallback(
      async (
          p: number,
          s: SortMode,
          replace = false
      ) => {
        setLoading(true);
        setError("");

        try {
          const data = await api.explore(p, s);

          setSongs((prev) =>
              replace
                  ? data.songs
                  : [...prev, ...data.songs]
          );

          setPages(data.pages);
          setPage(p);
        } catch {
          setError("Impossibile caricare il catalogo.");
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
  );

  useEffect(() => {
    fetchPage(1, sort, true);
  }, [sort]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPage(1, sort, true);
  };

  const handleLoadMore = () => {
    if (!loading && page < pages) {
      fetchPage(page + 1, sort);
    }
  };

  const renderItem = ({
                        item,
                      }: {
    item: Song;
  }) => (
      <TouchableOpacity
          activeOpacity={0.85}
          onPress={() =>
              router.push(`/song/${item.id}`)
          }
          style={styles.cardWrapper}
      >
        <BlurView
            intensity={30}
            tint="dark"
            style={styles.card}
        >
          <LinearGradient
              colors={[PRIMARY, "#2563EB"]}
              style={styles.iconContainer}
          >
            <Ionicons
                name="musical-notes"
                size={22}
                color="white"
            />
          </LinearGradient>

          <View style={styles.cardBody}>
            <ThemedText
                numberOfLines={1}
                style={styles.songTitle}
            >
              {item.title}
            </ThemedText>

            <ThemedText
                numberOfLines={1}
                style={styles.artist}
            >
              {item.artist}
            </ThemedText>

            {item.album ? (
                <ThemedText
                    numberOfLines={1}
                    style={styles.album}
                >
                  {item.album}
                </ThemedText>
            ) : null}
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
        {/* Background glow */}
        <View style={styles.glowOne} />
        <View style={styles.glowTwo} />

        {/* HEADER */}
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
            Esplora
          </ThemedText>

          <ThemedText style={styles.subtitle}>
            Sfoglia il catalogo dei testi
          </ThemedText>
        </View>

        {/* SORT */}
        <View style={styles.sortContainer}>
          {SORT_OPTIONS.map((opt) => {
            const active = sort === opt.value;

            return (
                <TouchableOpacity
                    key={opt.value}
                    activeOpacity={0.85}
                    onPress={() => setSort(opt.value)}
                >
                  <LinearGradient
                      colors={
                        active
                            ? [PRIMARY, "#2563EB"]
                            : ["#FFFFFF08", "#FFFFFF05"]
                      }
                      style={styles.sortButton}
                  >
                    <Ionicons
                        name={opt.icon}
                        size={16}
                        color={
                          active
                              ? "white"
                              : "#94A3B8"
                        }
                    />

                    <ThemedText
                        style={[
                          styles.sortText,
                          active &&
                          styles.sortTextActive,
                        ]}
                    >
                      {opt.label}
                    </ThemedText>
                  </LinearGradient>
                </TouchableOpacity>
            );
          })}
        </View>

        {/* ERROR */}
        {error ? (
            <BlurView
                intensity={25}
                tint="dark"
                style={styles.errorBox}
            >
              <Ionicons
                  name="warning-outline"
                  size={18}
                  color="#EF4444"
              />

              <ThemedText style={styles.errorText}>
                {error}
              </ThemedText>

              <TouchableOpacity
                  onPress={handleRefresh}
              >
                <ThemedText style={styles.retryText}>
                  Riprova
                </ThemedText>
              </TouchableOpacity>
            </BlurView>
        ) : null}

        {/* LIST */}
        <FlatList
            data={songs}
            renderItem={renderItem}
            keyExtractor={(item) =>
                String(item.id)
            }
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.35}
            refreshControl={
              <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={PRIMARY}
              />
            }
            ListFooterComponent={
              loading && page > 1 ? (
                  <ActivityIndicator
                      color={PRIMARY}
                      style={{ marginVertical: 20 }}
                  />
              ) : null
            }
            ListEmptyComponent={
              !loading ? (
                  <View style={styles.empty}>
                    <LinearGradient
                        colors={[
                          "#1E293B",
                          "#0F172A",
                        ]}
                        style={styles.emptyIcon}
                    >
                      <Ionicons
                          name="musical-notes-outline"
                          size={44}
                          color="#CBD5E1"
                      />
                    </LinearGradient>

                    <ThemedText
                        style={styles.emptyTitle}
                    >
                      Nessun brano trovato
                    </ThemedText>

                    <ThemedText
                        style={styles.emptySubtitle}
                    >
                      Il catalogo è attualmente vuoto.
                    </ThemedText>
                  </View>
              ) : (
                  <ActivityIndicator
                      size="large"
                      color={PRIMARY}
                      style={{ marginTop: 80 }}
                  />
              )
            }
        />
      </LinearGradient>
  );
}

const styles = StyleSheet.create({
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
    color: "#94A3B8",
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
    color: "#94A3B8",
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
    color: "#CBD5E1",
    marginTop: 4,
    fontSize: 13,
  },

  album: {
    color: "#64748B",
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
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22,
    fontSize: 14,
  },
});