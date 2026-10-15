import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";

import { useTheme } from "@/hooks/use-theme";
import PhonesCarousel from "@/components/home/PhonesCarousel";
import Header from "@/components/Header";



export default function HomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: theme.background }}
    >
      <Header />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-6"
      >
        
        {/* Promotional Banner */}
        <View className="mx-6 mt-5 overflow-hidden rounded-3xl">
          
          <Image
            source={require("@/assets/images/home-banner.png")}
            className="h-[200px] w-full"
            resizeMode="cover"
          />
        </View>

        {/* New Phones Carousel */}
        <PhonesCarousel />

        {/* Explore More */}
        <View className="mx-9 mt-6">
          
          <TouchableOpacity
            onPress={() => router.push("/explore")}
            activeOpacity={0.85}
            className="w-[50%] self-center items-center justify-center rounded-3xl py-4"
            style={{
              backgroundColor: theme.accent,
            }}
          >
            <Text
              className="text-base font-bold"
              style={{
                color: theme.background,
              }}
            >
              Explore More
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}