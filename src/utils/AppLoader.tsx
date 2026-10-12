import { ActivityIndicator, Text, View } from "react-native";

import { useTheme } from "@/hooks/use-theme";

export default function AppLoader() {
  const { theme } = useTheme();

  return (
    <View
      className="flex-1 items-center justify-center"
      style={{
        backgroundColor: theme.background,
      }}
    >
      <ActivityIndicator
        size="large"
        color={theme.accent}
      />

      <Text
        className="mt-3"
        style={{
          color: theme.secondaryText,
        }}
      >
        Loading...
      </Text>
    </View>
  );
}