/**
 * publish.tsx
 * Modern Publish Screen
 */

import { useState } from "react";

import {
  StyleSheet,
  TextInput,
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
import { api, solvePoWLRCLIB } from "../src/api";
import { useAuth } from "../src/AuthContext";
import { showAlert } from "../src/dialog";

type Step = "form" | "pow" | "sending" | "done";

const PRIMARY = "#4A90E2";

export default function PublishScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [album, setAlbum] = useState("");
  const [lyrics, setLyrics] = useState("");

  const [step, setStep] = useState<Step>("form");
  const [powProgress, setPowProgress] = useState("");

  const validate = (): string | null => {
    if (!title.trim()) return "Inserisci il titolo.";
    if (!artist.trim()) return "Inserisci l'artista.";
    if (!lyrics.trim()) return "Inserisci il testo del brano.";
    if (lyrics.trim().length < 20)
      return "Il testo è troppo breve.";
    return null;
  };

  const handlePublish = async () => {
    const err = validate();

    if (err) {
      showAlert("Warning", err);
      return;
    }

    const body = {
      trackName: title.trim(),
      artistName: artist.trim(),
      albumName: album.trim() || undefined,
      plainLyrics: lyrics.trim(),
    };

    try {
      if (user) {
        // ── Authenticated flow: skip PoW ────────────────────────────────
        setStep("sending");
        await api.publishLRCLIB(body, { authed: true });
        setStep("done");
        return;
      }

      // ── Anonymous flow: solve PoW first ──────────────────────────────
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

  const handleReset = () => {
    setTitle("");
    setArtist("");
    setAlbum("");
    setLyrics("");
    setStep("form");
    setPowProgress("");
  };

  // LOADING SCREEN
  if (step === "pow" || step === "sending") {
    return (
        <LinearGradient
            colors={["#020617", "#0F172A", "#111827"]}
            style={styles.centerContainer}
        >
          <View style={styles.glowOne} />
          <View style={styles.glowTwo} />

          <BlurView intensity={40} tint="dark" style={styles.loadingCard}>
            <LinearGradient
                colors={[PRIMARY, "#2563EB"]}
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

  // SUCCESS SCREEN
  if (step === "done") {
    return (
        <LinearGradient
            colors={["#020617", "#0F172A", "#111827"]}
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
              "{title}" di {artist} è ora disponibile
              nel catalogo.
            </ThemedText>

            <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleReset}
            >
              <LinearGradient
                  colors={[PRIMARY, "#2563EB"]}
                  style={styles.primaryButton}
              >
                <ThemedText style={styles.primaryButtonText}>
                  Pubblica un altro
                </ThemedText>
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>
        </LinearGradient>
    );
  }

  // FORM
  return (
      <LinearGradient
          colors={["#020617", "#0F172A", "#111827"]}
          style={styles.container}
      >
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={
              Platform.OS === "ios"
                  ? "padding"
                  : undefined
            }
        >
          <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
          >
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
                Pubblica
              </ThemedText>

              <ThemedText style={styles.subtitle}>
                {user
                    ? `Pubblica come ${user.username}.`
                    : "Pubblica anonimamente — la PoW gira automaticamente."}
              </ThemedText>
            </View>

            {/* FORM CARD */}
            <BlurView
                intensity={30}
                tint="dark"
                style={styles.formCard}
            >
              <InputField
                  label="Titolo"
                  icon="musical-note"
                  value={title}
                  onChangeText={setTitle}
                  placeholder="es. Inno alla Pizza"
              />

              <InputField
                  label="Artista"
                  icon="person"
                  value={artist}
                  onChangeText={setArtist}
                  placeholder="es. Matteo"
              />

              <InputField
                  label="Album"
                  icon="albums"
                  value={album}
                  onChangeText={setAlbum}
                  placeholder="opzionale"
              />

              <View style={styles.field}>
                <ThemedText style={styles.label}>
                  Testo
                </ThemedText>

                <View style={styles.inputWrapper}>
                  <Ionicons
                      name="document-text"
                      size={18}
                      color="#94A3B8"
                  />

                  <TextInput
                      value={lyrics}
                      onChangeText={setLyrics}
                      placeholder="Incolla qui il testo del brano…"
                      placeholderTextColor="#64748B"
                      multiline
                      textAlignVertical="top"
                      style={styles.textArea}
                  />
                </View>
              </View>

              {/* MODE INFO */}
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

              {/* BUTTON */}
              <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handlePublish}
              >
                <LinearGradient
                    colors={[PRIMARY, "#2563EB"]}
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
      </LinearGradient>
  );
}

interface InputFieldProps {
  label: string;
  icon: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

function InputField({ label, icon, value, onChangeText, placeholder }: InputFieldProps) {
  return (
      <View style={styles.field}>
        <ThemedText style={styles.label}>
          {label}
        </ThemedText>

        <View style={styles.inputWrapper}>
          <Ionicons
              name={icon}
              size={18}
              color="#94A3B8"
          />

          <TextInput
              value={value}
              onChangeText={onChangeText}
              placeholder={placeholder}
              placeholderTextColor="#64748B"
              style={styles.input}
          />
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
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
    color: "#94A3B8",
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

  field: {
    gap: 8,
  },

  label: {
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "600",
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff08",
    borderWidth: 1,
    borderColor: "#ffffff10",
    borderRadius: 18,
    paddingHorizontal: 16,
    gap: 12,
  },

  input: {
    flex: 1,
    height: 56,
    color: "white",
    fontSize: 15,
  },

  textArea: {
    flex: 1,
    minHeight: 170,
    color: "white",
    fontSize: 15,
    paddingTop: 18,
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
    color: "#CBD5E1",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22,
    fontSize: 14,
  },

  loadingHint: {
    color: "#64748B",
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
    color: "#CBD5E1",
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