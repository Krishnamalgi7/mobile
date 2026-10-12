import { useEffect, useRef, useState } from "react";
import { Dimensions, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/use-theme";
import { getNewPhones, getPhones, type Phone } from "@/services/phoneService";
import { Info, Mail, Smartphone } from "lucide-react-native";
import { API_URL } from "@/constants/config";
const { width: screenWidth } = Dimensions.get("window");

const CARD_WIDTH = screenWidth * 0.85;

function getPhoneValue(value: unknown) {
  if (typeof value === "object" && value !== null) {
    if ("name" in value) {
      return String(value.name);
    }

    if ("value" in value) {
      return String(value.value);
    }
  }

  return String(value ?? "");
}

export default function NewPhonesCarousel() {

  const router = useRouter();

  const [brandName, setBrandName] = useState("Phone Store");
  
  useEffect(() => {
    const fetchStoreBranding = async () => {
      try {
        const response = await fetch(`${API_URL}/api/store-settings`);
  
        if (!response.ok) {
          throw new Error("Failed to fetch store settings");
        }
  
        const data = await response.json();
        setBrandName(data.brandName || "Phone Store");
      } catch (error) {
        console.error("Failed to fetch store branding:", error);
      }
    };
  
    fetchStoreBranding();
  }, []);

  const { theme } = useTheme();

  const scrollViewRef = useRef<ScrollView>(null);

  const [phones, setPhones] = useState<Phone[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNewPhones = async () => {
      try {
        const newPhonesResponse = await getNewPhones();

        if (newPhonesResponse.phones.length > 0) {
          setPhones(newPhonesResponse.phones);
          return;
        }

        const phonesResponse = await getPhones();

        setPhones(phonesResponse.phones.slice(0, 3));
      } catch (error) {
        console.error("New phones error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNewPhones();
  }, []);

  useEffect(() => {
    if (phones.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentIndex((currentIndex) => {
        const nextIndex =
          currentIndex === phones.length - 1 ? 0 : currentIndex + 1;

        scrollViewRef.current?.scrollTo({
          x: nextIndex * CARD_WIDTH,
          animated: true,
        });

        return nextIndex;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [phones.length]);

  if (loading) {
    return (
      <View className="px-4 py-6">
        <Text className="text-lg font-bold" style={{ color: theme.text }}>
          New Phones
        </Text>
      </View>
    );
  }

  if (phones.length === 0) {
    return null;
  }

  return (
    <View className="mt-5">
      <View className="mb-3 px-4">
        <Text className="text-xl font-bold" style={{ color: theme.text }}>
          New Arrivals
        </Text>

        <Text className="mt-1 text-sm" style={{ color: theme.secondaryText }}>
          Check out the latest additions
        </Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH}
        decelerationRate="fast"
        style={{ height: 410 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
        }}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(
            event.nativeEvent.contentOffset.x / CARD_WIDTH,
          );

          setCurrentIndex(index);
        }}
      >
        {phones.map((phone) => (
          <TouchableOpacity
            key={phone._id}
            onPress={() => router.push(`/phone/${phone._id}`)}
            activeOpacity={0.85}
            style={{
              width: CARD_WIDTH,
              backgroundColor: theme.secondary,
              borderColor: theme.border,
            }}
            className="mr-4 h-[410px] overflow-hidden rounded-3xl border"
          >
            <View className="h-80 items-center justify-center p-6">
              {phone.image ? (
                <Image
                  source={{ uri: phone.image }}
                  className="h-full w-full"
                  resizeMode="contain"
                />
              ) : (
                <Text style={{ color: theme.secondaryText }}>No image</Text>
              )}
            </View>

            <View className="px-5 pb-5">
              <Text
                numberOfLines={1}
                className="text-lg font-bold"
                style={{ color: theme.text }}
              >
                {phone.name}
              </Text>

              {phone.discountPercentage && phone.discountPercentage > 0 ? (
                <View className="mt-1 flex-row items-center">
                  <Text
                    className="text-sm line-through"
                    style={{ color: theme.secondaryText }}
                  >
                    ₹{Math.round(phone.price).toLocaleString("en-IN")}
                  </Text>

                  <Text
                    className="ml-2 text-xs font-semibold"
                    style={{ color: theme.accent }}
                  >
                    {phone.discountPercentage}% OFF
                  </Text>
                </View>
              ) : null}

              <Text
                className="mt-1 text-lg font-bold"
                style={{ color: theme.accent }}
              >
                ₹
                {Math.round(phone.totalPrice ?? phone.price).toLocaleString(
                  "en-IN",
                )}
              </Text>

              <Text
                className="mt-3 text-sm font-semibold rounded-full"
                style={{ color: theme.secondaryText }}
              >
                {getPhoneValue(phone.ram)} RAM{" "}
                <Text style={{ color: theme.text }}>    |   </Text>{" "}
                {getPhoneValue(phone.rom)} ROM
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View className="mt-3 flex-row justify-center">
        {phones.map((phone, index) => (
          <View
            key={phone._id}
            className="mx-1 h-2 rounded-full"
            style={{
              width: index === currentIndex ? 18 : 7,
              backgroundColor:
                index === currentIndex ? theme.accent : theme.border,
            }}
          />
        ))}
      </View>

                    {/* About Us */}
        <View
          className="mx-5 mt-8 rounded-2xl border p-5"
          style={{
            backgroundColor: theme.secondary,
            borderColor: theme.border,
          }}
        >
          <Text
            className="text-xs font-semibold"
            style={{ color: theme.secondaryText }}
          >
            ABOUT
          </Text>

          <Text
            className="mt-2 text-xl font-bold"
            style={{ color: theme.text }}
          >
            Technology designed around you.
          </Text>

          <Text
            className="mt-3 text-sm leading-6"
            style={{ color: theme.secondaryText }}
          >
            Our store smartphones that combine thoughtful design, powerful
            performance and technology that fits naturally into everyday life.
          </Text>

          <View className="mt-5">
            <Text
              className="text-base font-bold"
              style={{ color: theme.text }}
            >
              Premium Design
            </Text>
            <Text
              className="mt-1 text-sm"
              style={{ color: theme.secondaryText }}
            >
              Carefully designed devices with a modern and premium look.
            </Text>
          </View>

          <View className="mt-4">
            <Text
              className="text-base font-bold"
              style={{ color: theme.text }}
            >
              Powerful Performance
            </Text>
            <Text
              className="mt-1 text-sm"
              style={{ color: theme.secondaryText }}
            >
              Fast and reliable performance for work, entertainment and
              everyday use.
            </Text>
          </View>

          <View className="mt-4">
            <Text
              className="text-base font-bold"
              style={{ color: theme.text }}
            >
              Smart Technology
            </Text>
            <Text
              className="mt-1 text-sm"
              style={{ color: theme.secondaryText }}
            >
              Technology designed to make your everyday experience simpler.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View
          className="mx-5 mb-4 mt-5 rounded-2xl border p-5"
          style={{
            backgroundColor: theme.secondary,
            borderColor: theme.border,
          }}
        >
          <Text
            className="text-xl font-bold"
            style={{ color: theme.text }}
          >
            {brandName}
          </Text>

          <Text
            className="mt-2 text-sm"
            style={{ color: theme.secondaryText }}
          >
            Technology made personal.
          </Text>

          <View className="mt-5 gap-4">
            <TouchableOpacity
              onPress={() => router.push("/explore")}
              activeOpacity={0.7}
              className="flex-row items-center"
            >
              <Smartphone size={18} color={theme.text} />
              <Text
                className="ml-3 text-sm"
                style={{ color: theme.text }}
              >
                Explore Phones
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/contact")}
              activeOpacity={0.7}
              className="flex-row items-center"
            >
              <Mail size={18} color={theme.text} />
              <Text
                className="ml-3 text-sm"
                style={{ color: theme.text }}
              >
                Contact Us
              </Text>
            </TouchableOpacity>

            <View className="flex-row items-center">
              <Info size={18} color={theme.text} />
              <Text
                className="ml-3 text-sm"
                style={{ color: theme.text }}
              >
                About Us
              </Text>
            </View>
          </View>

          <View
            className="mt-5 border-t pt-4"
            style={{ borderColor: theme.border }}
          >
            <Text
              className="text-xs"
              style={{ color: theme.secondaryText }}
            >
              © 2026 {brandName} Mobiles. All rights reserved.
            </Text>
          </View>
        </View>
    </View>
  );
}
