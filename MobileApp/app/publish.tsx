import { useState } from "react";

import {
  TouchableOpacity,
  ScrollView,
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
import { Screen } from "@/components/screen";
import { FormField } from "@/components/form-field";
import { api, solvePoWLRCLIB } from "../src/api";
import { useAuth } from "../src/AuthContext";
import { showAlert, showConfirm } from "../src/dialog";
import { parseLyrics, validateSong } from "../src/lyrics";
import { PRIMARY, PRIMARY_DEEP, BG_GRADIENT } from "@/constants/theme";
import styles from '@/styles/publish.styles';

type Step = "form" | "pow" | "sending" | "done";

export default function PublishScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [album, setAlbum] = useState("");
  const [duration, setDuration] = useState("");
  const [lyrics, setLyrics] = useState("");

  const [step, setStep] = useState<Step>("form");
  const [powProgress, setPowProgress] = useState("");

  const handlePublish = async () => {
    const err = validateSong({ title, artist, lyrics, duration });

    if (err) {
      showAlert("Warning", err);
      return;
    }

    // Anti-duplicato: lookup LRCLIB per signature (titolo + artista [+ album/durata]).
    const existing = await api.getBySignature({
      trackName: title.trim(),
      artistName: artist.trim(),
      albumName: album.trim() || undefined,
      duration: duration ? Number(duration) : undefined,
    });
    if (existing) {
      const proceed = await showConfirm(
        "Brano già esistente",
        `Esiste già "${existing.trackName}" di ${existing.artistName} nel catalogo. Vuoi pubblicarlo comunque?`,
        { confirmLabel: "Pubblica comunque", cancelLabel: "Annulla" }
      );
      if (!proceed) return;
    }

    const { plainLyrics, syncedLyrics } = parseLyrics(lyrics);

    const body = {
      trackName: title.trim(),
      artistName: artist.trim(),
      albumName: album.trim() || undefined,
      duration: duration ? Number(duration) : undefined,
      plainLyrics,
      syncedLyrics,
    };

    try {
      if (user) {
        setStep("sending");
        await api.publishLRCLIB(body, { authed: true });
        setStep("done");
        return;
      }

      setStep("pow");
      setPowProgress("Richiesta challenge crittografica…");

      const challenge = await api.requestChallenge();
      const difficulty = challenge.target.match(/^0+/)?.[0].length ?? 0;

      setPowProgress(`Risoluzione Proof of Work (difficoltà ${difficulty})…`);

      const nonce = await solvePoWLRCLIB(challenge.prefix, challenge.target);

      setPowProgress("Challenge risolta ✓ Invio…");
      setStep("sending");

      await api.publishLRCLIB(body, {
        xPublishToken: `${challenge.prefix}:${nonce}`,
      });

      setStep("done");
    } catch (e: any) {
      setStep("form");
      showAlert("Errore", e.message || "Pubblicazione fallita.");
    }
  };

  if (step === "pow" || step === "sending") {
    return (
        <LinearGradient
            colors={BG_GRADIENT}
            style={styles.centerContainer}
        >
          <View style={styles.glowOne} />
          <View style={styles.glowTwo} />

          <BlurView intensity={40} tint="dark" style={styles.loadingCard}>
            <LinearGradient
                colors={[PRIMARY, PRIMARY_DEEP]}
                style={styles.loadingIcon}
            >
              <Ionicons
                  name={
                    step === "pow"
                        ? "shield-checkmark"
                        : "cloud-upload"
                  }
                  size={34}
                  color="white"
              />
            </LinearGradient>

            <ActivityIndicator
                size="large"
                color={PRIMARY}
                style={{ marginTop: 20 }}
            />

            <ThemedText style={styles.loadingTitle}>
              {step === "pow"
                  ? "Proof of Work"
                  : "Pubblicazione in corso"}
            </ThemedText>

            <ThemedText style={styles.loadingText}>
              {powProgress}
            </ThemedText>

            <ThemedText style={styles.loadingHint}>
              {step === "pow"
                  ? "Protegge la piattaforma da spam e abusi."
                  : "Quasi fatto…"}
            </ThemedText>
          </BlurView>
        </LinearGradient>
    );
  }

  if (step === "done") {
    return (
        <LinearGradient
            colors={BG_GRADIENT}
            style={styles.centerContainer}
        >
          <BlurView intensity={40} tint="dark" style={styles.successCard}>
            <LinearGradient
                colors={["#22C55E", "#16A34A"]}
                style={styles.successIcon}
            >
              <Ionicons
                  name="checkmark"
                  size={40}
                  color="white"
              />
            </LinearGradient>

            <ThemedText style={styles.successTitle}>
              Testo pubblicato
            </ThemedText>

            <ThemedText style={styles.successDesc}>
              &quot;{title}&quot; di {artist} è ora disponibile
              nel catalogo.
            </ThemedText>

            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.replace("/")}
            >
              <LinearGradient
                  colors={[PRIMARY, PRIMARY_DEEP]}
                  style={styles.primaryButton}
              >
                <ThemedText style={styles.primaryButtonText}>
                  Home
                </ThemedText>
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>
        </LinearGradient>
    );
  }

  return (
      <Screen style={styles.container}>
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
          >
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
                Pubblica
              </ThemedText>

              <ThemedText style={styles.subtitle}>
                {user
                    ? `Pubblica come ${user.username}.`
                    : "Pubblica anonimamente — la PoW gira automaticamente."}
              </ThemedText>
            </View>

            <BlurView
                intensity={30}
                tint="dark"
                style={styles.formCard}
            >
              <FormField
                  label="Titolo"
                  icon="musical-note"
                  value={title}
                  onChangeText={setTitle}
                  placeholder="es. Inno alla Pizza"
              />

              <FormField
                  label="Artista"
                  icon="person"
                  value={artist}
                  onChangeText={setArtist}
                  placeholder="es. Matteo"
              />

              <FormField
                  label="Album"
                  icon="albums"
                  value={album}
                  onChangeText={setAlbum}
                  placeholder="opzionale"
              />

              <FormField
                  label="Durata (secondi)"
                  icon="time"
                  value={duration}
                  onChangeText={setDuration}
                  placeholder="opzionale"
                  keyboardType="numeric"
              />

              <FormField
                  label="Testo"
                  icon="document-text"
                  value={lyrics}
                  onChangeText={setLyrics}
                  placeholder={"Testo semplice, oppure con timestamp LRC:\n[00:00.00] prima riga\n[00:04.50] seconda riga"}
                  multiline
                  hint="I timestamp [mm:ss.xx] vengono rilevati automaticamente."
              />

              <LinearGradient
                  colors={
                    user
                        ? ["#16A34A22", "#22C55E11"]
                        : ["#1E3A8A22", "#2563EB11"]
                  }
                  style={styles.infoCard}
              >
                <Ionicons
                    name={user ? "person-circle" : "shield-checkmark"}
                    size={18}
                    color={user ? "#22C55E" : PRIMARY}
                />

                <ThemedText
                    style={[
                      styles.infoText,
                      user && { color: "#86EFAC" },
                    ]}
                >
                  {user
                      ? `Sei autenticato come @${user.username}: il brano sarà attribuito al tuo account, niente PoW.`
                      : "Pubblicazione anonima protetta da Proof of Work anti-spam, eseguita in automatico."}
                </ThemedText>
              </LinearGradient>

              <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handlePublish}
              >
                <LinearGradient
                    colors={[PRIMARY, PRIMARY_DEEP]}
                    style={styles.primaryButton}
                >
                  <Ionicons
                      name="cloud-upload"
                      size={20}
                      color="white"
                  />

                  <ThemedText
                      style={styles.primaryButtonText}
                  >
                    Pubblica testo
                  </ThemedText>
                </LinearGradient>
              </TouchableOpacity>
            </BlurView>
          </ScrollView>
        </KeyboardAvoidingView>
      </Screen>
  );
}
