import { useRouter } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { Package, Star } from "lucide-react-native";

import type { Phone } from "@/services/phoneService";
import { formatIndianCurrency } from "@/utils/formatters";
import { useTheme } from "@/hooks/use-theme";

type PhoneCardProps = {
  phone: Phone;
};

export default function PhoneCard({ phone }: PhoneCardProps) {
    const router = useRouter();
  const { theme } = useTheme();

  const finalPrice = phone.totalPrice ?? phone.price;
  const originalPrice = phone.price;

  return (
    <TouchableOpacity
  className="mb-4 w-[48%] overflow-hidden rounded-2xl border"
  onPress={() => router.push(`/phone/${phone._id}`)}
  activeOpacity={0.85}
      style={{
        backgroundColor: theme.background,
        borderColor: theme.border,
      }}
    >
      <View className="h-40 w-full items-center justify-center">
        {phone.image ? (
          <Image
            source={{ uri: phone.image }}
            className="h-full w-full"
            resizeMode="contain"
          />
        ) : (
          <Text style={{ color: theme.secondaryText }}>
            No image
          </Text>
        )}
      </View>

      <View className="px-3 pb-3">
        <Text
          className="mt-2 text-sm font-semibold"
          style={{ color: theme.text }}
          numberOfLines={2}
        >
          {phone.name}
        </Text>

        <View className="mt-2 flex-row items-center">
  <View
    className="flex-row items-center rounded-md px-2 py-1"
    style={{ backgroundColor: theme.accent }}
  >
    <Star
      size={13}
      color={theme.background}
      fill={theme.background}
    />

    <Text
      className="ml-1 text-xs font-bold"
      style={{ color: theme.background }}
    >
      {phone.averageRating?.toFixed(1) ?? "0.0"}
    </Text>
  </View>

  <Text
    className="ml-2 text-xs"
    style={{ color: theme.secondaryText }}
  >
    {phone.ratingCount ?? 0} ratings
  </Text>
</View>

<View className="mt-2 flex-row items-center">
  <Package
    size={14}
    color={theme.secondaryText}
  />

  <Text
    className="ml-1 text-xs"
    style={{ color: theme.secondaryText }}
  >
    Quantity · {phone.quantity}
  </Text>
</View>

        <View className="mt-3 flex-row items-center">
          <Text
            className="text-base font-bold"
            style={{ color: theme.text }}
          >
            {formatIndianCurrency(finalPrice)}
          </Text>

          {originalPrice > finalPrice ? (
            <Text
              className="ml-2 text-xs line-through"
              style={{ color: theme.secondaryText }}
            >
              {formatIndianCurrency(originalPrice)}
            </Text>
          ) : null}
        </View>

        {phone.discountPercentage !== undefined &&
        phone.discountPercentage > 0 ? (
          <Text
            className="mt-1 text-xs font-semibold"
            style={{ color: theme.accent }}
          >
            {phone.discountPercentage}% OFF
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}