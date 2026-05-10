/**
 * HomeScreen.tsx
 * Versione moderna UI/UX
 */

import { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { api } from "../src/api";
import { useAuth } from "../src/AuthContext";
import { showConfirm } from "../src/dialog";

const { width } = Dimensions.get("window");

const PRIMARY = "#4A90E2";
const BG = "#0F172A";

export default function HomeScreen() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  const [online, setOnline] = useState<boolean | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(25)).current;

  const handleLogout = async () => {
    const ok = await showConfirm(
        "Logout",
        `Vuoi disconnetterti da @${user?.username}?`,
        { confirmLabel: "Logout", cancelLabel: "Annulla", destructive: true }
    );
    if (ok) {
      await logout();
    }
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    api
        .health()
        .then(() => setOnline(true))
        .catch(() => setOnline(false));
  }, []);

  const statusColor =
      online === null ? "#888" : online ? "#22C55E" : "#EF4444";

  const statusText =
      online === null
          ? "Connessione al server…"
          : online
              ? "Online"
              : "Non in linea";

  return (

      <LinearGradient
          colors={["#020617", "#0F172A", "#111827"]}
          style={styles.container}
      >
        <StatusBar barStyle="light-content" />

        {/* Glow background */}
        <View style={styles.glowOne} />
        <View style={styles.glowTwo} />

        {/* TOP-RIGHT PROFILE PILL */}
        <View style={styles.topBar}>
          {authLoading ? null : user ? (
              <TouchableOpacity activeOpacity={0.85} onPress={handleLogout}>
                <BlurView intensity={30} tint="dark" style={styles.profilePill}>
                  <LinearGradient
                      colors={[PRIMARY, "#7C3AED"]}
                      style={styles.profileAvatar}
                  >
                    <ThemedText style={styles.profileInitial}>
                      {user.username.charAt(0).toUpperCase()}
                    </ThemedText>
                  </LinearGradient>
                  <ThemedText style={styles.profileName} numberOfLines={1}>
                    @{user.username}
                  </ThemedText>
                  <Ionicons name="log-out-outline" size={16} color="#94A3B8" />
                </BlurView>
              </TouchableOpacity>
          ) : (
              <Link href="/login" asChild>
                <TouchableOpacity activeOpacity={0.85}>
                  <BlurView
                      intensity={30}
                      tint="dark"
                      style={styles.signInPill}
                  >
                    <Ionicons name="log-in-outline" size={16} color="white" />
                    <ThemedText style={styles.signInText}>Accedi</ThemedText>
                  </BlurView>
                </TouchableOpacity>
              </Link>
          )}
        </View>

        <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: translateAnim }],
              },
            ]}
        >
          {/* HERO */}
          <View style={styles.hero}>
            <View style={styles.logoContainer}>
              <LinearGradient
                  colors={[PRIMARY, "#7C3AED"]}
                  style={styles.logoGradient}
              >
                <Ionicons name="musical-notes" size={34} color="white" />
              </LinearGradient>
            </View>

            <ThemedText style={styles.title}>Stopify</ThemedText>

            <ThemedText style={styles.subtitle}>
              Scopri artisti e testi sincronizzati
            </ThemedText>
          </View>

          {/* STATUS CARD */}
          <BlurView intensity={30} tint="dark" style={styles.statusCard}>
            <View
                style={[styles.statusDot, { backgroundColor: statusColor }]}
            />

            <ThemedText style={styles.statusText}>
              {statusText}
            </ThemedText>
          </BlurView>

          {/* ACTIONS */}
          <View style={styles.actions}>
            <Link href="/search" asChild>
              <TouchableOpacity activeOpacity={0.85}>
                <LinearGradient
                    colors={[PRIMARY, "#2563EB"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryButton}
                >
                  <Ionicons name="search" size={20} color="white" />
                  <ThemedText style={styles.primaryButtonText}>
                    Cerca brani
                  </ThemedText>
                </LinearGradient>
              </TouchableOpacity>
            </Link>

            <View style={styles.row}>
              <Link href="/explore" asChild>
                <TouchableOpacity
                    style={styles.secondaryCard}
                    activeOpacity={0.85}
                >
                  <Ionicons name="albums-outline" size={26} color="white" />
                  <ThemedText style={styles.cardTitle}>
                    Esplora
                  </ThemedText>
                </TouchableOpacity>
              </Link>

              <Link href={user ? "/my-lyrics" : "/publish"} asChild>
                <TouchableOpacity
                    style={styles.secondaryCard}
                    activeOpacity={0.85}
                >
                  <Ionicons
                      name={user ? "library-outline" : "mic-outline"}
                      size={26}
                      color="white"
                  />
                  <ThemedText style={styles.cardTitle}>
                    {user ? "I miei testi" : "Pubblica"}
                  </ThemedText>
                </TouchableOpacity>
              </Link>
            </View>

            {/* Quando loggato esponi anche un quick link per Publish */}
            {user ? (
                <Link href="/publish" asChild>
                  <TouchableOpacity activeOpacity={0.85}>
                    <BlurView
                        intensity={25}
                        tint="dark"
                        style={styles.publishPill}
                    >
                      <Ionicons
                          name="mic-outline"
                          size={18}
                          color={PRIMARY}
                      />
                      <ThemedText style={styles.publishPillText}>
                        Pubblica un nuovo brano
                      </ThemedText>
                      <Ionicons
                          name="chevron-forward"
                          size={16}
                          color="#94A3B8"
                      />
                    </BlurView>
                  </TouchableOpacity>
                </Link>
            ) : null}
          </View>

          {/* FOOTER */}
          <View style={styles.footer}>
            <ThemedText style={styles.footerText}>
              Powered by Flask · API REST
            </ThemedText>
          </View>
        </Animated.View>
      </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: BG,
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
    color: "#CBD5E1",
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
    color: "#94A3B8",
    fontSize: 12,
  },
});