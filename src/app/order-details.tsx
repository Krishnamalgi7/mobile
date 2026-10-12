import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Star } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getToken } from "@/services/authService";
import { API_URL } from "@/constants/config";
import { useTheme } from "@/hooks/use-theme";
import { formatIndianCurrency } from "@/utils/formatters";

type OrderItem = {
  phoneId?: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
};

type Order = {
  invoiceNumber: string;
  invoiceDate: string;
  storeName?: string;
  customerName?: string;
  items: OrderItem[];
  gstPercentage: number;
  gstAmount: number;
  taxableSubtotal: number;
  roundedOff: number;
  totalAmount: number;
  amountInWords?: string;
};

export default function OrderDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [selectedRatings, setSelectedRatings] = useState<
    Record<string, number>
  >({});
  const [submittingPhoneId, setSubmittingPhoneId] = useState<string | null>(
    null,
  );
  const [ratingMessage, setRatingMessage] = useState<Record<string, string>>(
    {},
  );
  const [ratingStats, setRatingStats] = useState<
    Record<string, { averageRating: number; ratingCount: number }>
  >({});
  const { invoice } = useLocalSearchParams<{
    invoice?: string;
  }>();

  let order: Order | null = null;

  try {
    if (invoice) {
      order = JSON.parse(invoice);
    }
  } catch (error) {
    console.error("Failed to parse order:", error);
  }

  useEffect(() => {
  if (!order?.items?.length) return;

  const phoneIds = [
    ...new Set(
      order.items
        .map((item) => item.phoneId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  phoneIds.forEach((phoneId) => {
    fetchMyRating(phoneId);
  });
}, [invoice]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const fetchMyRating = async (phoneId: string) => {
  try {
    const token = await getToken();

    if (!token) return;

    const response = await fetch(
      `${API_URL}/api/ratings/${phoneId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch rating.");
    }

    if (data.rating !== null && data.rating !== undefined) {
      setSelectedRatings((previous) => ({
        ...previous,
        [phoneId]: Number(data.rating),
      }));
    }
  } catch (error) {
    console.error("Failed to fetch customer's rating:", error);
  }
};

  const submitRating = async (phoneId?: string) => {
    if (!phoneId) {
      return;
    }

    const rating = selectedRatings[phoneId];

    if (!rating) {
      setRatingMessage((previous) => ({
        ...previous,
        [phoneId]: "Please select a star rating first.",
      }));
      return;
    }

    try {
      setSubmittingPhoneId(phoneId);

      const token = await getToken();

      if (!token) {
        setRatingMessage((previous) => ({
          ...previous,
          [phoneId]: "Please log in again to submit your rating.",
        }));
        return;
      }

      const response = await fetch(`${API_URL}/api/ratings/${phoneId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit rating.");
      }

      setRatingStats((previous) => ({
        ...previous,
        [phoneId]: {
          averageRating: Number(data.averageRating),
          ratingCount: Number(data.ratingCount),
        },
      }));

      setRatingMessage((previous) => ({
        ...previous,
        [phoneId]: "Rating saved successfully.",
      }));
    } catch (error) {
      setRatingMessage((previous) => ({
        ...previous,
        [phoneId]:
          error instanceof Error ? error.message : "Failed to submit rating.",
      }));
    } finally {
      setSubmittingPhoneId(null);
    }
  };

  if (!order) {
    return (
      <View
        className="flex-1 items-center justify-center px-6"
        style={{
          backgroundColor: theme.background,
          paddingTop: insets.top,
        }}
      >
        <Text className="text-base" style={{ color: theme.text }}>
          Order details not available
        </Text>

        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.8}
          className="mt-5 rounded-xl px-6 py-3"
          style={{
            backgroundColor: theme.accent,
          }}
        >
          <Text className="font-semibold" style={{ color: theme.background }}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: theme.background,
        paddingTop: insets.top,
      }}
    >
      {/* Header */}

      <View className="flex-row items-center px-5 py-4">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="mr-3 h-10 w-10 items-center justify-center rounded-full border"
          style={{
            borderColor: theme.border,
            backgroundColor: theme.secondary,
          }}
        >
          <ArrowLeft size={20} color={theme.text} />
        </TouchableOpacity>

        <Text className="text-2xl font-bold" style={{ color: theme.text }}>
          Order Details
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 24,
        }}
      >
        {/* Order Information */}

        <View
          className="rounded-2xl border p-4"
          style={{
            backgroundColor: theme.secondary,
            borderColor: theme.border,
          }}
        >
          <View className="flex-row items-center justify-between">
            <View>
              <Text
                className="text-sm font-semibold"
                style={{ color: theme.text }}
              >
                Order #{order.invoiceNumber}
              </Text>

              <Text
                className="mt-1 text-xs"
                style={{
                  color: theme.secondaryText,
                }}
              >
                {formatDate(order.invoiceDate)}
              </Text>
            </View>

            <Text className="text-lg font-bold" style={{ color: theme.accent }}>
              {formatIndianCurrency(order.totalAmount)}
            </Text>
          </View>
        </View>

        {/* Products */}

        <View
          className="mt-4 rounded-2xl border p-4"
          style={{
            backgroundColor: theme.secondary,
            borderColor: theme.border,
          }}
        >
          <Text className="text-lg font-bold" style={{ color: theme.text }}>
            Products
          </Text>

          {order.items.map((item, index) => (
            <View
              key={`${order.invoiceNumber}-${index}`}
              className="mt-4 flex-row"
            >
              {/* Product Image */}

              <View
                className="h-24 w-24 items-center justify-center overflow-hidden rounded-xl"
                style={{
                  backgroundColor: theme.background,
                }}
              >
                {item.image ? (
                  <Image
                    source={{ uri: item.image }}
                    className="h-full w-full"
                    resizeMode="contain"
                  />
                ) : null}
              </View>

              {/* Product Info */}

              <View className="ml-4 flex-1">
                <Text
                  className="text-base font-semibold"
                  style={{ color: theme.text }}
                  numberOfLines={2}
                >
                  {item.name}
                </Text>

                <Text
                  className="mt-2 text-sm"
                  style={{
                    color: theme.secondaryText,
                  }}
                >
                  Quantity: {item.quantity}
                </Text>

                <Text
                  className="mt-2 text-base font-bold"
                  style={{ color: theme.text }}
                >
                  {formatIndianCurrency(item.price)}
                </Text>

                <View className="mt-3">
                  <Text
                    className="mb-2 text-sm font-semibold"
                    style={{ color: theme.text }}
                  >
                    Rate this phone
                  </Text>

                  <View className="flex-row items-center">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const phoneKey = item.phoneId || item.name;
                      const selectedRating = selectedRatings[phoneKey] || 0;

                      return (
                        <TouchableOpacity
                          key={star}
                          onPress={() =>
                            setSelectedRatings((previous) => ({
                              ...previous,
                              [phoneKey]: star,
                            }))
                          }
                          activeOpacity={0.7}
                          className="mr-2"
                        >
                          <Star
                            size={28}
                            color={
                              star <= selectedRating ? "#F59E0B" : theme.border
                            }
                            fill={
                              star <= selectedRating ? "#F59E0B" : "transparent"
                            }
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text
                    className="mt-1 text-xs"
                    style={{ color: theme.secondaryText }}
                  >
                    {selectedRatings[item.phoneId || item.name]
                      ? `${selectedRatings[item.phoneId || item.name]} out of 5 selected`
                      : "Tap a star to rate"}
                  </Text>

                  {item.phoneId ? (
                    <TouchableOpacity
                      onPress={() => submitRating(item.phoneId)}
                      disabled={submittingPhoneId === item.phoneId}
                      activeOpacity={0.8}
                      className="mt-3 self-start rounded-xl px-4 py-2"
                      style={{
                        backgroundColor: theme.accent,
                        opacity: submittingPhoneId === item.phoneId ? 0.6 : 1,
                      }}
                    >
                      <Text
                        className="text-sm font-semibold"
                        style={{ color: theme.background }}
                      >
                        {submittingPhoneId === item.phoneId
                          ? "Submitting..."
                          : "Submit Rating"}
                      </Text>
                    </TouchableOpacity>
                  ) : null}

                  {ratingMessage[item.phoneId || item.name] ? (
                    <Text
                      className="mt-2 text-sm"
                      style={{ color: theme.secondaryText }}
                    >
                      {ratingMessage[item.phoneId || item.name]}
                    </Text>
                  ) : null}

                  {ratingStats[item.phoneId || item.name] ? (
  <Text
    className="mt-2 text-sm font-semibold"
    style={{ color: theme.text }}
  >
    Average Rating:{" "}
    {ratingStats[item.phoneId || item.name].averageRating.toFixed(1)}
    {" "}({ratingStats[item.phoneId || item.name].ratingCount} ratings)
  </Text>
) : null}

                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Price Details */}

        <View
          className="mt-4 rounded-2xl border p-4"
          style={{
            backgroundColor: theme.secondary,
            borderColor: theme.border,
          }}
        >
          <Text className="text-lg font-bold" style={{ color: theme.text }}>
            Price Details
          </Text>

          <View className="mt-4 flex-row justify-between">
            <Text className="text-sm" style={{ color: theme.secondaryText }}>
              Subtotal
            </Text>

            <Text
              className="text-sm font-semibold"
              style={{ color: theme.text }}
            >
              {formatIndianCurrency(order.taxableSubtotal)}
            </Text>
          </View>

          <View className="mt-3 flex-row justify-between">
            <Text className="text-sm" style={{ color: theme.secondaryText }}>
              GST ({order.gstPercentage}%)
            </Text>

            <Text
              className="text-sm font-semibold"
              style={{ color: theme.text }}
            >
              {formatIndianCurrency(order.gstAmount)}
            </Text>
          </View>

          <View className="mt-3 flex-row justify-between">
            <Text className="text-sm" style={{ color: theme.secondaryText }}>
              Round Off
            </Text>

            <Text
              className="text-sm font-semibold"
              style={{ color: theme.text }}
            >
              {formatIndianCurrency(order.roundedOff)}
            </Text>
          </View>

          <View
            className="my-4 border-t"
            style={{
              borderColor: theme.border,
            }}
          />

          <View className="flex-row justify-between">
            <Text className="text-base font-bold" style={{ color: theme.text }}>
              Total Amount
            </Text>

            <Text className="text-lg font-bold" style={{ color: theme.accent }}>
              {formatIndianCurrency(order.totalAmount)}
            </Text>

            {/* Amount In Words */}
          </View>
          {order.amountInWords ? (
            <View
              className="mt-1 "
              style={{
                backgroundColor: theme.secondary,
              }}
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: theme.text }}
              >
                Amount in Words
              </Text>

              <Text
                className="mt-2 text-sm"
                style={{
                  color: theme.secondaryText,
                }}
              >
                {order.amountInWords}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
