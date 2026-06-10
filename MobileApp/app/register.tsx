/**
 * register.tsx
 * Schermata di Registrazione
 */

import { useState } from "react";
import {
    TouchableOpacity,
    View,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { Screen } from "@/components/screen";
import { FormField } from "@/components/form-field";
import { useAuth } from "../src/AuthContext";
import { PRIMARY, PRIMARY_DEEP } from "@/constants/theme";
import styles from '@/styles/register.styles';

export default function RegisterScreen() {
    const router = useRouter();
    const { register } = useAuth();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Live validation hints
    const usernameValid = /^[A-Za-z0-9_]{3,30}$/.test(username);
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const passwordValid = password.length >= 8 && /\d/.test(password);

    const handleSubmit = async () => {
        setError(null);

        if (!usernameValid) {
            setError("Username: 3-30 caratteri, lettere/numeri/underscore");
            return;
        }
        if (!emailValid) {
            setError("Email non valida");
            return;
        }
        if (!passwordValid) {
            setError("Password: almeno 8 caratteri e una cifra");
            return;
        }

        setSubmitting(true);
        try {
            await register(username.trim(), email.trim(), password);
            router.replace("/");
        } catch (e: any) {
            setError(e.message || "Registrazione fallita");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Screen style={styles.container}>
            <View style={styles.glowOne} />
            <View style={styles.glowTwo} />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <Ionicons name="chevron-back" size={22} color="white" />
                    </TouchableOpacity>

                    {/* HERO */}
                    <View style={styles.hero}>
                        <LinearGradient
                            colors={[PRIMARY, "#7C3AED"]}
                            style={styles.logo}
                        >
                            <Ionicons name="person-add" size={32} color="white" />
                        </LinearGradient>

                        <ThemedText style={styles.title}>Crea un account</ThemedText>
                        <ThemedText style={styles.subtitle}>
                            Diventa parte della community e contribuisci con i tuoi testi.
                        </ThemedText>
                    </View>

                    {/* FORM */}
                    <BlurView intensity={30} tint="dark" style={styles.card}>
                        <FormField
                            label="Username"
                            icon="person"
                            value={username}
                            onChangeText={setUsername}
                            placeholder="alice99"
                            valid={usernameValid}
                            hint="3-30 caratteri (a-z, 0-9, _)"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <FormField
                            label="Email"
                            icon="mail"
                            value={email}
                            onChangeText={setEmail}
                            placeholder="alice@example.com"
                            valid={emailValid}
                            hint="indirizzo email valido"
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="email-address"
                        />

                        <FormField
                            label="Password"
                            icon="key"
                            value={password}
                            onChangeText={setPassword}
                            placeholder="••••••••"
                            secure
                            valid={passwordValid}
                            hint="Almeno 8 caratteri e una cifra"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        {error ? (
                            <View style={styles.errorBox}>
                                <Ionicons
                                    name="warning-outline"
                                    size={16}
                                    color="#FCA5A5"
                                />
                                <ThemedText style={styles.errorText}>
                                    {error}
                                </ThemedText>
                            </View>
                        ) : null}

                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={handleSubmit}
                            disabled={submitting}
                        >
                            <LinearGradient
                                colors={[PRIMARY, PRIMARY_DEEP]}
                                style={[
                                    styles.primaryBtn,
                                    submitting && { opacity: 0.7 },
                                ]}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <>
                                        <Ionicons
                                            name="rocket"
                                            size={20}
                                            color="white"
                                        />
                                        <ThemedText style={styles.primaryBtnText}>
                                            Crea account
                                        </ThemedText>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </BlurView>

                    <View style={styles.footer}>
                        <ThemedText style={styles.footerText}>
                            Hai già un account?
                        </ThemedText>
                        <Link href="/login" replace asChild>
                            <TouchableOpacity activeOpacity={0.7}>
                                <ThemedText style={styles.footerLink}>
                                    Accedi
                                </ThemedText>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </Screen>
    );
}
