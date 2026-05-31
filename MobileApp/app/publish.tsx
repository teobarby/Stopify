import { useState } from "react";

import {
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
import { PRIMARY, PRIMARY_DEEP, BG_GRADIENT, TEXT_MUTED, TEXT_DIM, TEXT_SOFT } from "@/constants/theme";
import styles from '@/styles/publish.styles';

type Step = "form" | "pow" | "sending" | "done";

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

  const handleReset = () => {
    setTitle("");
    setArtist("");
    setAlbum("");
    setLyrics("");
    setStep("form");
    setPowProgress("");
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
              "{title}" di {artist} è ora disponibile
              nel catalogo.
            </ThemedText>

            <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleReset}
            >
              <LinearGradient
                  colors={[PRIMARY, PRIMARY_DEEP]}
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

  return (
      <LinearGradient
          colors={BG_GRADIENT}
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
                      color={TEXT_MUTED}
                  />

                  <TextInput
                      value={lyrics}
                      onChangeText={setLyrics}
                      placeholder="Incolla qui il testo del brano…"
                      placeholderTextColor={TEXT_DIM}
                      multiline
                      textAlignVertical="top"
                      style={styles.textArea}
                  />
                </View>
              </View>

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
              color={TEXT_MUTED}
          />

          <TextInput
              value={value}
              onChangeText={onChangeText}
              placeholder={placeholder}
              placeholderTextColor={TEXT_DIM}
              style={styles.input}
          />
        </View>
      </View>
  );
}
