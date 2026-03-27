import { AuthProvider } from "@/context/AuthContext";
import useAuthStore from "@/store/auth.store";
import { useFonts } from "expo-font";
import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { LogBox } from "react-native";
import "./global.css";

// Ignore specific warnings that are not critical
LogBox.ignoreLogs([
  "JSON Parse error",
  "Error parsing reviews",
  "Setting a timer",
]);

// Optional: Ignore all warnings in production
if (!__DEV__) {
  LogBox.ignoreAllLogs();
}
// Ignore specific Appwrite-related errors
LogBox.ignoreLogs([
  "JSON Parse error: Unexpected character: G",
  "Error parsing reviews",
  "Error fetchingagent",
  "Error checking like status",
]);
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Rubik-Bold": require("../assets/fonts/Rubik-Bold.ttf"),
    "Rubik-ExtraBold": require("../assets/fonts/Rubik-ExtraBold.ttf"),
    "Rubik-Light": require("../assets/fonts/Rubik-Light.ttf"),
    "Rubik-Medium": require("../assets/fonts/Rubik-Medium.ttf"),
    "Rubik-Regular": require("../assets/fonts/Rubik-Regular.ttf"),
    "Rubik-SemiBold": require("../assets/fonts/Rubik-SemiBold.ttf"),
  });

  const { fetchAuthenticatedUser } = useAuthStore();

  useEffect(() => {
    fetchAuthenticatedUser();
  }, [fetchAuthenticatedUser]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // 🚀 ALWAYS render a navigator
  return (
    <AuthProvider>
      <Slot />
    </AuthProvider>
  );
}
