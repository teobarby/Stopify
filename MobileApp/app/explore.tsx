import { useEffect, useState, useCallback } from "react";

import {
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
import { Screen } from "@/components/screen";
import { api, LrclibSong } from "../src/api";
import { PRIMARY, PRIMARY_DEEP, TEXT_MUTED, TEXT_SOFT } from "@/constants/theme";
import styles from '@/styles/explore.styles';

type SortMode = "recent" | "title" | "artist";

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

  const [songs, setSongs] = useState<LrclibSong[]>([]);
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
    item: LrclibSong;
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
              colors={[PRIMARY, PRIMARY_DEEP]}
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
              {item.trackName}
            </ThemedText>

            <ThemedText
                numberOfLines={1}
                style={styles.artist}
            >
              {item.artistName}
            </ThemedText>

            {item.albumName ? (
                <ThemedText
                    numberOfLines={1}
                    style={styles.album}
                >
                  {item.albumName}
                </ThemedText>
            ) : null}
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
      <Screen style={styles.container}>
        <View style={styles.glowOne} />
        <View style={styles.glowTwo} />

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
                            ? [PRIMARY, PRIMARY_DEEP]
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
                              : TEXT_MUTED
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

        <FlatList
            style={{ flex: 1 }}
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
                          color={TEXT_SOFT}
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
      </Screen>
  );
}
