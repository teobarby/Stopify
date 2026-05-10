/**
 * register.tsx
 * Schermata di Registrazione
 */

import { useState } from "react";
import {
    StyleSheet,
    TextInput,
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
import { useAuth } from "../src/AuthContext";

const PRIMARY = "#4A90E2";

export default function RegisterScreen() {
    const router = useRouter();
    const { register } = useAuth();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
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
        <LinearGradient
            colors={["#020617", "#0F172A", "#111827"]}
            style={styles.container}
        >
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
                        <ValidatedField
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

                        <ValidatedField
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

                        <View style={styles.field}>
                            <View style={styles.labelRow}>
                                <ThemedText style={styles.label}>Password</ThemedText>
                                {password.length > 0 ? (
                                    <Ionicons
                                        name={
                                            passwordValid
                                                ? "checkmark-circle"
                                                : "alert-circle"
                                        }
                                        size={14}
                                        color={
                                            passwordValid
                                                ? "#22C55E"
                                                : "#EAB308"
                                        }
                                    />
                                ) : null}
                            </View>
                            <View style={styles.inputWrapper}>
                                <Ionicons
                                    name="key"
                                    size={18}
                                    color="#94A3B8"
                                />
                                <TextInput
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="••••••••"
                                    placeholderTextColor="#64748B"
                                    secureTextEntry={!showPw}
                                    style={styles.input}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPw((s) => !s)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name={showPw ? "eye-off" : "eye"}
                                        size={18}
                                        color="#94A3B8"
                                    />
                                </TouchableOpacity>
                            </View>
                            <ThemedText style={styles.hint}>
                                Almeno 8 caratteri e una cifra
                            </ThemedText>
                        </View>

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
                                colors={[PRIMARY, "#2563EB"]}
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
        </LinearGradient>
    );
}

function ValidatedField({
    label,
    icon,
    value,
    onChangeText,
    placeholder,
    valid,
    hint,
    ...rest
}: any) {
    const showCheck = value.length > 0;
    return (
        <View style={styles.field}>
            <View style={styles.labelRow}>
                <ThemedText style={styles.label}>{label}</ThemedText>
                {showCheck ? (
                    <Ionicons
                        name={valid ? "checkmark-circle" : "alert-circle"}
                        size={14}
                        color={valid ? "#22C55E" : "#EAB308"}
                    />
                ) : null}
            </View>
            <View style={styles.inputWrapper}>
                <Ionicons name={icon} size={18} color="#94A3B8" />
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="#64748B"
                    style={styles.input}
                    {...rest}
                />
            </View>
            {hint ? <ThemedText style={styles.hint}>{hint}</ThemedText> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    glowOne: {
        position: "absolute",
        width: 280,
        height: 280,
        borderRadius: 280,
        backgroundColor: "#2563EB22",
        top: -90,
        right: -70,
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

    scroll: {
        padding: 24,
        paddingTop: 70,
        paddingBottom: 40,
        flexGrow: 1,
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
        marginBottom: 24,
    },

    hero: {
        alignItems: "center",
        marginBottom: 24,
    },

    logo: {
        width: 84,
        height: 84,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 18,
        shadowColor: PRIMARY,
        shadowOpacity: 0.5,
        shadowRadius: 18,
        elevation: 10,
    },

    title: {
        color: "white",
        fontSize: 30,
        fontWeight: "800",
        letterSpacing: -1,
        paddingVertical: 4,
        includeFontPadding: false,
    },

    subtitle: {
        color: "#94A3B8",
        textAlign: "center",
        fontSize: 14,
        marginTop: 6,
        paddingHorizontal: 12,
        lineHeight: 20,
    },

    card: {
        borderRadius: 28,
        padding: 22,
        gap: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#ffffff10",
    },

    field: { gap: 6 },

    labelRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
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
        borderRadius: 16,
        paddingHorizontal: 14,
        gap: 10,
    },

    input: {
        flex: 1,
        height: 52,
        color: "white",
        fontSize: 15,
    },

    hint: {
        color: "#64748B",
        fontSize: 11,
        marginTop: 2,
    },

    errorBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#7F1D1D33",
        borderWidth: 1,
        borderColor: "#FCA5A555",
        borderRadius: 14,
        padding: 12,
    },

    errorText: {
        flex: 1,
        color: "#FCA5A5",
        fontSize: 13,
    },

    primaryBtn: {
        height: 56,
        borderRadius: 18,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        marginTop: 4,
        shadowColor: PRIMARY,
        shadowOpacity: 0.4,
        shadowRadius: 14,
        elevation: 8,
    },

    primaryBtnText: {
        color: "white",
        fontSize: 16,
        fontWeight: "700",
    },

    footer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 6,
        marginTop: 24,
    },

    footerText: {
        color: "#94A3B8",
        fontSize: 14,
    },

    footerLink: {
        color: PRIMARY,
        fontSize: 14,
        fontWeight: "700",
    },
});
