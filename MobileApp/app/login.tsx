import { useState } from "react";
import {
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
import { PRIMARY, PRIMARY_DEEP, BG_GRADIENT, TEXT_MUTED, TEXT_DIM, TEXT_SOFT } from "@/constants/theme";
import styles from '@/styles/login.styles';

export default function LoginScreen() {
    const router = useRouter();
    const { login } = useAuth();

    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPw, setShowPw] = useState(false);

    const handleSubmit = async () => {
        setError(null);

        if (!identifier.trim() || !password) {
            setError("Inserisci username/email e password");
            return;
        }

        setSubmitting(true);
        try {
            await login(identifier.trim(), password);
            router.replace("/");
        } catch (e: any) {
            setError(e.message || "Login fallito");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <LinearGradient
            colors={BG_GRADIENT}
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

                    <View style={styles.hero}>
                        <LinearGradient
                            colors={[PRIMARY, "#7C3AED"]}
                            style={styles.logo}
                        >
                            <Ionicons name="lock-closed" size={32} color="white" />
                        </LinearGradient>

                        <ThemedText style={styles.title}>Bentornato</ThemedText>
                        <ThemedText style={styles.subtitle}>
                            Accedi per pubblicare lyrics senza Proof of Work.
                        </ThemedText>
                    </View>

                    <BlurView intensity={30} tint="dark" style={styles.card}>
                        <Field
                            label="Username o email"
                            icon="person"
                            value={identifier}
                            onChangeText={setIdentifier}
                            placeholder="alice99"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <View style={styles.field}>
                            <ThemedText style={styles.label}>Password</ThemedText>
                            <View style={styles.inputWrapper}>
                                <Ionicons
                                    name="key"
                                    size={18}
                                    color={TEXT_MUTED}
                                />
                                <TextInput
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="••••••••"
                                    placeholderTextColor={TEXT_DIM}
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
                                        color={TEXT_MUTED}
                                    />
                                </TouchableOpacity>
                            </View>
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
                                            name="log-in"
                                            size={20}
                                            color="white"
                                        />
                                        <ThemedText style={styles.primaryBtnText}>
                                            Login
                                        </ThemedText>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </BlurView>

                    <View style={styles.footer}>
                        <ThemedText style={styles.footerText}>
                            Non hai un account?
                        </ThemedText>
                        <Link href="/register" replace asChild>
                            <TouchableOpacity activeOpacity={0.7}>
                                <ThemedText style={styles.footerLink}>
                                    Registrati
                                </ThemedText>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

function Field({
    label,
    icon,
    value,
    onChangeText,
    placeholder,
    ...rest
}: any) {
    return (
        <View style={styles.field}>
            <ThemedText style={styles.label}>{label}</ThemedText>
            <View style={styles.inputWrapper}>
                <Ionicons name={icon} size={18} color={TEXT_MUTED} />
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={TEXT_DIM}
                    style={styles.input}
                    {...rest}
                />
            </View>
        </View>
    );
}
