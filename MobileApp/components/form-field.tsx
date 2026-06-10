/**
 * form-field.tsx
 * Campo di input riutilizzabile per tutti i form dell'app.
 *
 * Copre i casi:
 *  - testo semplice (con icona a sinistra)
 *  - password (`secure`) con toggle mostra/nascondi
 *  - validazione live (`valid`) con icona di stato accanto alla label
 *  - area di testo multiriga (`multiline`)
 *  - hint testuale sotto al campo
 */

import { useState, type ComponentProps } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { TEXT_MUTED, TEXT_DIM, TEXT_SOFT } from "@/constants/theme";

type IconName = keyof typeof Ionicons.glyphMap;

interface FormFieldProps {
    label: string;
    icon: IconName;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    hint?: string;
    /** Se definito, mostra un'icona di stato (✓/!) quando il campo non è vuoto. */
    valid?: boolean;
    /** Password: nasconde il testo e aggiunge il toggle occhio. */
    secure?: boolean;
    /** Area di testo multiriga. */
    multiline?: boolean;
    autoCapitalize?: ComponentProps<typeof TextInput>["autoCapitalize"];
    autoCorrect?: boolean;
    keyboardType?: ComponentProps<typeof TextInput>["keyboardType"];
}

export function FormField({
    label,
    icon,
    value,
    onChangeText,
    placeholder,
    hint,
    valid,
    secure = false,
    multiline = false,
    autoCapitalize,
    autoCorrect,
    keyboardType,
}: FormFieldProps) {
    const [showPw, setShowPw] = useState(false);
    const showValidity = valid !== undefined && value.length > 0;

    return (
        <View style={styles.field}>
            <View style={styles.labelRow}>
                <ThemedText style={styles.label}>{label}</ThemedText>
                {showValidity ? (
                    <Ionicons
                        name={valid ? "checkmark-circle" : "alert-circle"}
                        size={14}
                        color={valid ? "#22C55E" : "#EAB308"}
                    />
                ) : null}
            </View>

            <View style={styles.inputWrapper}>
                <Ionicons
                    name={icon}
                    size={18}
                    color={TEXT_MUTED}
                    style={multiline ? styles.multilineIcon : undefined}
                />
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={TEXT_DIM}
                    secureTextEntry={secure && !showPw}
                    multiline={multiline}
                    textAlignVertical={multiline ? "top" : "auto"}
                    style={multiline ? styles.textArea : styles.input}
                    autoCapitalize={autoCapitalize}
                    autoCorrect={autoCorrect}
                    keyboardType={keyboardType}
                />
                {secure ? (
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
                ) : null}
            </View>

            {hint ? <ThemedText style={styles.hint}>{hint}</ThemedText> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    field: { gap: 8 },
    labelRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    label: {
        color: TEXT_SOFT,
        fontSize: 13,
        fontWeight: "600",
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: "#ffffff08",
        borderWidth: 1,
        borderColor: "#ffffff10",
        borderRadius: 16,
        paddingHorizontal: 14,
    },
    input: {
        flex: 1,
        height: 52,
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
    multilineIcon: {
        alignSelf: "flex-start",
        paddingTop: 18,
    },
    hint: {
        color: TEXT_DIM,
        fontSize: 11,
    },
});
