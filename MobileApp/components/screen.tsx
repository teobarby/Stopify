/**
 * screen.tsx
 * Contenitore di base per le schermate: sfondo a gradiente + fix web.
 *
 * Su react-native-web il container deve usare `position: fixed` per occupare
 * tutta la viewport; su native basta lo stile passato via `style`.
 */

import { type ReactNode } from "react";
import { Platform, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { BG_GRADIENT } from "@/constants/theme";

const WEB_FIX = { position: "fixed" as const, top: 0, left: 0, right: 0, bottom: 0 };

export function Screen({
    style,
    children,
}: {
    style?: StyleProp<ViewStyle>;
    children: ReactNode;
}) {
    const containerStyle =
        Platform.OS === "web" ? ([style, WEB_FIX] as any) : style;

    return (
        <LinearGradient colors={BG_GRADIENT} style={containerStyle}>
            {children}
        </LinearGradient>
    );
}
