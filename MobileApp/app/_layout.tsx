import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider } from "../src/AuthContext";

export default function RootLayout() {
    const colorScheme = useColorScheme();

    return (
        <AuthProvider>
            <ThemeProvider
                value={
                    colorScheme === "dark"
                        ? DarkTheme
                        : DefaultTheme
                }
            >
                <Stack
                    screenOptions={{
                        // Tutti gli header sono custom dentro le singole schermate
                        headerShown: false,

                        // SCREEN BG
                        contentStyle: {
                            backgroundColor: "#020617",
                        },

                        // ANIMATIONS
                        animation: "fade_from_bottom",
                    }}
                >
                    {/* HOME */}
                    <Stack.Screen name="index" />

                    {/* SEARCH */}
                    <Stack.Screen name="search" />

                    {/* EXPLORE */}
                    <Stack.Screen name="explore" />

                    {/* PUBLISH */}
                    <Stack.Screen name="publish" />

                    {/* SONG */}
                    <Stack.Screen name="song/[id]" />

                    {/* AUTH */}
                    <Stack.Screen name="login" />
                    <Stack.Screen name="register" />

                    {/* MY LYRICS */}
                    <Stack.Screen name="my-lyrics" />
                    <Stack.Screen name="edit-song/[id]" />

                    {/* ADMIN */}
                    <Stack.Screen name="admin" />

                    {/* MODAL */}
                    <Stack.Screen
                        name="modal"
                        options={{
                            presentation: "modal",
                            title: "Modal",
                            animation: "slide_from_bottom",
                            headerShown: true,
                            headerStyle: {
                                backgroundColor: "#020617",
                            },
                            headerTintColor: "white",
                            headerShadowVisible: false,
                            headerTitleStyle: {
                                fontWeight: "700",
                            },
                        }}
                    />
                </Stack>

                <StatusBar style="light" />
            </ThemeProvider>
        </AuthProvider>
    );
}