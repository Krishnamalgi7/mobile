import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useRouter } from "expo-router";
import {
  ArrowLeft,
  ChevronRight,
  Package,
  Download,
  Star,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

import { useTheme } from "@/hooks/use-theme";
import { getToken } from "@/services/authService";
import { API_URL } from "@/constants/config";
import { formatIndianCurrency } from "@/utils/formatters";

type OrderItem = {
  phoneId?: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  averageRating: number;
  ratingCount: number;
};

type Order = {
  invoiceNumber: string;
  invoiceDate: string;
  items: OrderItem[];
  totalAmount: number;
  invoiceData: any;
};

function RatingStars({
  rating,
  color,
  emptyColor,
}: {
  rating: number;
  color: string;
  emptyColor: string;
}) {
  const safeRating = Math.max(0, Math.min(5, rating || 0));

  return (
    <View className="flex-row items-center">
      {Array.from({ length: 5 }, (_, index) => {
        const fill = Math.max(0, Math.min(1, safeRating - index));

        return (
          <View
            key={index}
            className="relative mr-1"
            style={{ width: 18, height: 18 }}
          >
            <Star
              size={18}
              color={emptyColor}
              fill="transparent"
              strokeWidth={1.8}
            />

            {fill > 0 && (
              <View
                pointerEvents="none"
                className="absolute left-0 top-0 overflow-hidden"
                style={{ width: 18 * fill, height: 18 }}
              >
                <Star size={18} color={color} fill={color} strokeWidth={1.8} />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

export default function MyOrdersScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRatings, setSelectedRatings] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const token = await getToken();

      const response = await fetch(`${API_URL}/api/invoices/customer-history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch orders");
      }

      setOrders(
        (data.invoices || []).map((invoice: any) => ({
          ...invoice,
          invoiceData: invoice,
          items: (invoice.items || []).map((item: any) => ({
            averageRating: item.phoneId?.averageRating ?? 0,
            ratingCount: item.phoneId?.ratingCount ?? 0,
            phoneId: item.phoneId?._id,
            name: item.itemDescription,
            quantity: item.quantity,
            price: item.priceAfterDiscount,
            image: item.phoneId?.image
              ? item.phoneId.image.startsWith("/")
                ? `${API_URL}${item.phoneId.image}`
                : item.phoneId.image
              : undefined,
          })),
        })),
      );
    } catch (err) {
      console.error("Fetch orders error:", err);
      setError("Unable to load your orders");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{
          backgroundColor: theme.background,
          paddingTop: insets.top,
        }}
      >
        <ActivityIndicator size="large" color={theme.accent} />

        <Text className="mt-3 text-base" style={{ color: theme.secondaryText }}>
          Loading your orders...
        </Text>
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
          My Orders
        </Text>
      </View>

      {error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Package size={48} color={theme.secondaryText} />

          <Text
            className="mt-4 text-center text-base"
            style={{ color: theme.text }}
          >
            {error}
          </Text>

          <TouchableOpacity
            onPress={fetchOrders}
            activeOpacity={0.8}
            className="mt-5 rounded-xl px-6 py-3"
            style={{ backgroundColor: theme.accent }}
          >
            <Text className="font-semibold" style={{ color: theme.background }}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      ) : orders.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Package size={56} color={theme.secondaryText} />

          <Text
            className="mt-4 text-xl font-bold"
            style={{ color: theme.text }}
          >
            No Orders Yet
          </Text>

          <Text
            className="mt-2 text-center"
            style={{ color: theme.secondaryText }}
          >
            Your completed orders will appear here.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 24,
          }}
        >
          {orders.map((order) => (
            <View
              key={order.invoiceNumber}
              className="mb-4 rounded-2xl border p-4"
              style={{
                backgroundColor: theme.secondary,
                borderColor: theme.border,
              }}
            >
              {/* Order Header */}
              <View className="mb-4 flex-row items-center justify-between">
                <View>
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: theme.text }}
                  >
                    Order #{order.invoiceNumber}
                  </Text>

                  <Text
                    className="mt-1 text-xs"
                    style={{ color: theme.secondaryText }}
                  >
                    {formatDate(order.invoiceDate)}
                  </Text>
                </View>

                <Text
                  className="text-base font-bold"
                  style={{ color: theme.accent }}
                >
                  {formatIndianCurrency(order.totalAmount)}
                </Text>
              </View>

              {/* Products */}
              {order.items.map((item, index) => (
                <View
                  key={`${order.invoiceNumber}-${index}`}
                  className="mb-3 flex-row items-center"
                >
                  <View
                    className="h-20 w-20 items-center justify-center overflow-hidden rounded-xl"
                    style={{
                      backgroundColor: theme.background,
                    }}
                  >
                    {item.image ? (
                      <Image
                        source={
                          !item.image ||
                          failedImages[`${order.invoiceNumber}-${index}`]
                            ? require("@/assets/images/phone-placeholder.png")
                            : { uri: item.image }
                        }
                        className="h-full w-full"
                        resizeMode="contain"
                        onError={() => {
                          setFailedImages((previous) => ({
                            ...previous,
                            [`${order.invoiceNumber}-${index}`]: true,
                          }));
                        }}
                      />
                    ) : (
                      <Package size={28} color={theme.secondaryText} />
                    )}
                  </View>

                  <View className="ml-3 flex-1">
                    <Text
                      className="text-base font-semibold"
                      style={{ color: theme.text }}
                      numberOfLines={2}
                    >
                      {item.name}
                    </Text>

                    <Text
                      className="mt-1 text-sm"
                      style={{ color: theme.secondaryText }}
                    >
                      Quantity: {item.quantity}
                    </Text>

                    <View className="mt-2 flex-row items-center">
                      <RatingStars
                        rating={item.averageRating}
                        color="#F59E0B"
                        emptyColor={theme.border}
                      />

                      <Text
                        className="ml-1 text-xs"
                        style={{ color: theme.secondaryText }}
                      >
                        {item.averageRating.toFixed(1)} ({item.ratingCount})
                      </Text>
                    </View>
                  </View>
                </View>
              ))}

              {/* Order Actions */}
              <View
                className="mt-1 flex-row items-center justify-between border-t pt-3"
                style={{ borderColor: theme.border }}
              >
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() =>
                    router.push({
                      pathname: "/order-details",
                      params: {
                        invoice: JSON.stringify(order),
                      },
                    })
                  }
                  className="flex-row items-center"
                >
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: theme.accent }}
                  >
                    View Details
                  </Text>

                  <ChevronRight size={18} color={theme.accent} />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() =>
                    router.push({
                      pathname: "/order-confirmed",
                      params: {
                        invoice: JSON.stringify(order.invoiceData),
                        source: "history",
                      },
                    })
                  }
                  className="flex-row items-center rounded-xl px-3 py-2"
                  style={{ backgroundColor: theme.background }}
                >
                  <Download size={17} color={theme.accent} />

                  <Text
                    className="ml-2 text-sm font-semibold"
                    style={{ color: theme.accent }}
                  >
                    Download Invoice
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
