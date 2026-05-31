import { useEffect, useRef, useState } from "react";
import {
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
import { PRIMARY, PRIMARY_DEEP, BG_GRADIENT, BG_MID, TEXT_MUTED, TEXT_SOFT } from "@/constants/theme";
import styles from '@/styles/index.styles';

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
          colors={BG_GRADIENT}
          style={styles.container}
      >
        <StatusBar barStyle="light-content" />

        <View style={styles.glowOne} />
        <View style={styles.glowTwo} />

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
                  <Ionicons name="log-out-outline" size={16} color={TEXT_MUTED} />
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

          <BlurView intensity={30} tint="dark" style={styles.statusCard}>
            <View
                style={[styles.statusDot, { backgroundColor: statusColor }]}
            />

            <ThemedText style={styles.statusText}>
              {statusText}
            </ThemedText>
          </BlurView>

          <View style={styles.actions}>
            <Link href="/search" asChild>
              <TouchableOpacity activeOpacity={0.85}>
                <LinearGradient
                    colors={[PRIMARY, PRIMARY_DEEP]}
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
                          color={TEXT_MUTED}
                      />
                    </BlurView>
                  </TouchableOpacity>
                </Link>
            ) : null}

            {user?.is_admin ? (
                <Link href="/admin" asChild>
                  <TouchableOpacity activeOpacity={0.85}>
                    <BlurView
                        intensity={25}
                        tint="dark"
                        style={styles.adminPill}
                    >
                      <Ionicons
                          name="shield-checkmark"
                          size={18}
                          color="#FCD34D"
                      />
                      <ThemedText style={styles.adminPillText}>
                        Pannello admin
                      </ThemedText>
                      <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={TEXT_MUTED}
                      />
                    </BlurView>
                  </TouchableOpacity>
                </Link>
            ) : null}
          </View>

          <View style={styles.footer}>
            <ThemedText style={styles.footerText}>
              Powered by Flask · API REST
            </ThemedText>
          </View>
        </Animated.View>
      </LinearGradient>
  );
}
