import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { withLayoutContext } from "expo-router";
import { createStackNavigator } from "@react-navigation/stack";
import { Easing, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider } from "../src/AuthContext";
import { BG_DARK } from "@/constants/theme";

// ─── Navigatore JS (supporta cardStyleInterpolator) ──────────────────────────

const { Navigator } = createStackNavigator();
const Stack = withLayoutContext(Navigator);

// ─── Interpolatori animazione ─────────────────────────────────────────────────

/** Apertura: fade in + slide su dal basso (comportamento originale). */
function fadeFromBottom({ current }) {
    return {
        cardStyle: {
            opacity: current.progress.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 0.85, 1],
            }),
            transform: [{
                translateY: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [60, 0],
                }),
            }],
        },
    };
}

/** Chiusura: slide verso destra. */
function slideToRight({ current, layouts }) {
    return {
        cardStyle: {
            transform: [{
                translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                }),
            }],
        },
    };
}

/** Modal: slide su dal basso. */
function slideFromBottom({ current, layouts }) {
    return {
        cardStyle: {
            transform: [{
                translateY: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.height, 0],
                }),
            }],
        },
    };
}

const mainInterpolator = (props) =>
    props.closing ? slideToRight(props) : fadeFromBottom(props);

const TIMING = {
    animation: "timing" as const,
    config: { duration: 320, easing: Easing.out(Easing.poly(5)) },
};

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function RootLayout() {
    const colorScheme = useColorScheme();

    return (
        <AuthProvider>
            <ThemeProvider
                value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
            >
                <View style={{ flex: 1, backgroundColor: BG_DARK }}>
                    <Stack
                        screenOptions={{
                            headerShown: false,
                            cardStyle: { backgroundColor: BG_DARK },
                            cardStyleInterpolator: mainInterpolator,
                            transitionSpec: { open: TIMING, close: TIMING },
                            gestureEnabled: true,
                            gestureDirection: "horizontal",
                        }}
                    >
                        <Stack.Screen name="index" />
                        <Stack.Screen name="search" />
                        <Stack.Screen name="explore" />
                        <Stack.Screen name="publish" />
                        <Stack.Screen name="song/[id]" />
                        <Stack.Screen name="login" />
                        <Stack.Screen name="register" />
                        <Stack.Screen name="my-lyrics" />
                        <Stack.Screen name="edit-song/[id]" />
                        <Stack.Screen name="admin" />
                        <Stack.Screen
                            name="modal"
                            options={{
                                title: "Modal",
                                cardStyleInterpolator: slideFromBottom,
                                gestureDirection: "vertical",
                                transitionSpec: { open: TIMING, close: TIMING },
                                headerShown: true,
                                headerStyle: { backgroundColor: BG_DARK },
                                headerTintColor: "white",
                                headerShadowVisible: false,
                                headerTitleStyle: { fontWeight: "700" },
                            }}
                        />
                    </Stack>
                </View>
                <StatusBar style="light" />
            </ThemeProvider>
        </AuthProvider>
    );
}
