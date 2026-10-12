import { useEffect, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {Sun} from "lucide-react-native";

import { API_URL } from "@/constants/config";
import { useTheme } from "@/hooks/use-theme";

type StoreSettings = {
  brandName?: string;
  logo?: string;
};

export default function Header() {
  const [storeSettings, setStoreSettings] =
    useState<StoreSettings | null>(null);

  const { theme, cycleTheme } = useTheme();
const insets = useSafeAreaInsets();
  useEffect(() => {
    const fetchStoreSettings = async () => {
      try {
        const response = await fetch(`${API_URL}/api/store-settings`);

        if (!response.ok) {
          throw new Error("Failed to fetch store settings");
        }

        const data = await response.json();

        setStoreSettings(data);
      } catch (error) {
        console.error("Store settings error:", error);
      }
    };

    fetchStoreSettings();
  }, []);

  return (
    <View
  className="flex-row items-center justify-between border-b px-7 pb-5"
  style={{
    backgroundColor: theme.background,
    borderBottomColor: theme.border,
    paddingTop: insets.top,
  }}
>
      <View className="flex-row items-center">
        {storeSettings?.logo ? (
          <Image
            source={{
              uri: `${API_URL}${storeSettings.logo}`,
            }}
            className="mr-3 h-10 w-10 rounded-xl"
            resizeMode="contain"
          />
        ) : null}

        <View>
          <Text
            className="text-lg font-bold"
            style={{ color: theme.text }}
          >
            {storeSettings?.brandName ?? "Phone Store"}
          </Text>

          <Text
            className="text-xs"
            style={{ color: theme.secondaryText }}
          >
            Your Phone Store
          </Text>
        </View>
      </View>

      <TouchableOpacity
        className="h-10 w-10 items-center justify-center rounded-full mt-1"
        style={{
          backgroundColor: theme.secondary,
        }}
        onPress={cycleTheme}
      >
        <Sun 
        size={20} 
        color={theme.text} 
      />
      </TouchableOpacity>
    </View>
  );
}