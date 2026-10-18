import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Bell, RefreshCw } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/use-theme";
import { getToken } from "@/services/authService";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

type StockNotification = {
  _id: string;
  status: "pending" | "notified" | "cancelled";
  createdAt: string;
  notifiedAt?: string | null;
  phoneId: {
    _id: string;
    name: string;
    image?: string | null;
    imageUrl?: string | null;
    price?: number;
    totalPrice?: number;
    quantity?: number;
  } | null;
};

export default function StockNotificationsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [notifications, setNotifications] = useState<StockNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchNotifications = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const token = await getToken();

      if (!token) {
        throw new Error("Please log in to view notifications.");
      }

      const response = await fetch(
        `${API_URL}/api/stock-notifications/my-notifications`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load notifications.");
      }

      setNotifications(data);

      await fetch(`${API_URL}/api/stock-notifications/my-notifications/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error("Failed to fetch stock notifications:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load notifications.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: theme.background,
        paddingTop: insets.top,
      }}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-8"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center py-4">
          <TouchableOpacity
            onPress={() => router.replace("/profile")}
            activeOpacity={0.6}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              elevation: 10,
            }}
          >
            <ArrowLeft size={23} color={theme.text} />
          </TouchableOpacity>

          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 44,
              right: 44,
              alignItems: "center",
            }}
          >
            <Text className="text-lg font-bold" style={{ color: theme.text }}>
              Notifications
            </Text>
          </View>
        </View>

        {loading ? (
          <View className="items-center py-12">
            <ActivityIndicator color={theme.text} />
            <Text className="mt-3" style={{ color: theme.secondaryText }}>
              Loading notifications...
            </Text>
          </View>
        ) : error ? (
          <View className="items-center py-10">
            <Text className="text-center" style={{ color: theme.text }}>
              {error}
            </Text>

            <TouchableOpacity
              onPress={() => fetchNotifications(true)}
              className="mt-4 rounded-xl px-5 py-3"
              style={{ backgroundColor: theme.text }}
            >
              <Text style={{ color: theme.background, fontWeight: "600" }}>
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        ) : notifications.length === 0 ? (
          <View className="items-center py-12">
            <Bell size={38} color={theme.secondaryText} />
            <Text
              className="mt-4 text-base font-semibold"
              style={{ color: theme.text }}
            >
              No notifications yet
            </Text>
            <Text
              className="mt-2 text-center text-sm leading-5"
              style={{ color: theme.secondaryText }}
            >
              Tap Notify Me on an out-of-stock phone to receive availability
              updates here.
            </Text>
          </View>
        ) : (
          <View className="mt-4 gap-3">
            <TouchableOpacity
              onPress={() => fetchNotifications(true)}
              disabled={refreshing}
              className="mb-2 flex-row items-center justify-center self-end rounded-xl border px-3 py-2"
              style={{ borderColor: theme.border }}
            >
              <RefreshCw size={15} color={theme.text} />
              <Text className="ml-2 text-sm" style={{ color: theme.text }}>
                {refreshing ? "Refreshing..." : "Refresh"}
              </Text>
            </TouchableOpacity>

            {notifications.map((item) => (
              <View
                key={item._id}
                className="rounded-2xl border p-4"
                style={{
                  backgroundColor: theme.secondary,
                  borderColor: theme.border,
                }}
              >
                <View className="flex-row items-start">
                  <Bell size={20} color={theme.text} />
                  <View className="ml-3 flex-1">
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: theme.text }}
                    >
                      {item.status === "notified"
                        ? "Phone back in stock"
                        : item.status === "pending"
                          ? "Waiting for stock"
                          : "Notification cancelled"}
                    </Text>

                    <Text
                      className="mt-1 text-sm"
                      style={{ color: theme.secondaryText }}
                    >
                      {item.phoneId?.name ?? "Phone no longer available"}
                    </Text>

                    <Text
                      className="mt-2 text-xs"
                      style={{ color: theme.secondaryText }}
                    >
                      {item.notifiedAt
                        ? `Updated ${new Date(item.notifiedAt).toLocaleDateString("en-IN")}`
                        : `Requested ${new Date(item.createdAt).toLocaleDateString("en-IN")}`}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
