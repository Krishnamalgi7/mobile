import "../global.css";

import { View } from "react-native";
import BottomNavigation from "@/components/BottomNavigation";

import { Stack } from "expo-router";

import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout() {
  return (
    <ThemeProvider>
  <AuthProvider>
    <View className="flex-1">
      <Stack screenOptions={{ headerShown: false }} />
      <BottomNavigation />
    </View>
  </AuthProvider>
</ThemeProvider>
  );
}
