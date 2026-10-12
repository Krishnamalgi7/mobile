import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ChevronRight,
  LogOut,
  MessageSquare,
  Package,
  ShoppingCart,
  User,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppLoader from "@/utils/AppLoader";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/context/AuthContext";
import { getToken } from "@/services/authService";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

type CustomerProfile = {
  name: string;
  phone: string;
  email: string;
  address: string;
};

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const token = await getToken();

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(`${API_URL}/api/customer-auth/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch profile");
      }

      setProfile(data.customer);
    } catch (error) {
      console.error("Profile fetch error:", error);

      setError(
        error instanceof Error ? error.message : "Failed to fetch profile",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      await logout();
      setShowLogoutPopup(false);
      router.replace("/");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  const openMyProfile = () => {
    router.push("/my-profile");
  };

  const openCart = () => {
    router.push("/cart");
  };

  const openContact = () => {
    router.push("/contact");
  };

if (loading) {
  return <AppLoader />;
}

  
if (error && !profile) {
  return (
    <View
      className="flex-1 items-center justify-center px-6"
      style={{
        backgroundColor: theme.background,
        paddingTop: insets.top,
      }}
    >
      <Text
        className="text-center text-base"
        style={{ color: theme.text }}
      >
        {error}
      </Text>

      <TouchableOpacity
        onPress={async () => {
          await logout();
          router.replace("/login");
        }}
        activeOpacity={0.8}
        className="mt-5 items-center rounded-xl px-6 py-3"
        style={{ backgroundColor: theme.accent }}
      >
        <Text
          className="font-semibold"
          style={{ color: theme.background }}
        >
          Log out and sign in again
        </Text>
      </TouchableOpacity>
    </View>
  );
}

  if (!profile) {
    return null;
  }

  const username = profile.name?.trim() || "there";

  return (
    <>
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: theme.background }}
        contentContainerClassName="px-5 pb-8"
        contentContainerStyle={{
          paddingTop: insets.top + 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-bold" style={{ color: theme.text }}>
            Welcome, {username}
          </Text>
        </View>

        {/* Profile summary */}
        <View className="mt-7 items-center">
          <View
            className="h-20 w-20 items-center justify-center rounded-full border-2"
            style={{
              backgroundColor: theme.secondary,
              borderColor: theme.border,
            }}
          >
            <User size={38} color={theme.accent} />
          </View>

          <Text
            className="mt-3 text-lg font-semibold"
            style={{ color: theme.text }}
          >
            {profile.name?.trim() || "Customer"}
          </Text>

          <Text className="mt-1 text-sm" style={{ color: theme.secondaryText }}>
            {profile.phone}
          </Text>
        </View>

        {/* Account options */}
        <View className="mt-7 gap-3">
          {/* My Profile */}
          <TouchableOpacity
            onPress={openMyProfile}
            activeOpacity={0.75}
            className="flex-row items-center rounded-xl border px-4 py-4"
            style={{
              backgroundColor: theme.secondary,
              borderColor: theme.border,
            }}
          >
            <User size={20} color={theme.secondaryText} />

            <Text
              className="ml-4 flex-1 text-base font-medium"
              style={{ color: theme.text }}
            >
              My Profile
            </Text>

            <ChevronRight size={20} color={theme.secondaryText} />
          </TouchableOpacity>

          {/* My Orders */}
          <TouchableOpacity
          onPress={() => router.push("/my-orders")}
            activeOpacity={0.75}
            className="flex-row items-center rounded-xl border px-4 py-4"
            style={{
              backgroundColor: theme.secondary,
              borderColor: theme.border,
            }}
          >
            <Package size={20} color={theme.secondaryText} />

            <Text
              className="ml-4 flex-1 text-base font-medium"
              style={{ color: theme.text }}
            >
              My Orders
            </Text>

            <ChevronRight size={20} color={theme.secondaryText} />
          </TouchableOpacity>

          {/* Cart */}
          <TouchableOpacity
            onPress={openCart}
            activeOpacity={0.75}
            className="flex-row items-center rounded-xl border px-4 py-4"
            style={{
              backgroundColor: theme.secondary,
              borderColor: theme.border,
            }}
          >
            <ShoppingCart size={20} color={theme.secondaryText} />

            <Text
              className="ml-4 flex-1 text-base font-medium"
              style={{ color: theme.text }}
            >
              Cart
            </Text>

            <ChevronRight size={20} color={theme.secondaryText} />
          </TouchableOpacity>

          {/* Contact */}
          <TouchableOpacity
            onPress={openContact}
            activeOpacity={0.75}
            className="flex-row items-center rounded-xl border px-4 py-4"
            style={{
              backgroundColor: theme.secondary,
              borderColor: theme.border,
            }}
          >
            <MessageSquare size={20} color={theme.secondaryText} />

            <Text
              className="ml-4 flex-1 text-base font-medium"
              style={{ color: theme.text }}
            >
              Contact
            </Text>

            <ChevronRight size={20} color={theme.secondaryText} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowLogoutPopup(true)}
            activeOpacity={0.75}
            className="mt-4 flex-row items-center justify-center rounded-3xl px-5 py-4 w-[38%] self-center"
            style={{
              backgroundColor: "#DC2626",
            }}
          >
            <LogOut size={18} color="#FFFFFF" />

            <Text
              className="ml-2 text-sm font-semibold"
              style={{
                color: "#FFFFFF",
              }}
            >
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showLogoutPopup}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!loggingOut) {
            setShowLogoutPopup(false);
          }
        }}
      >
        <View
          className="flex-1 items-center justify-center px-6"
          style={{
            backgroundColor: "rgba(0,0,0,0.55)",
          }}
        >
          <View
            className="w-full rounded-3xl border p-6"
            style={{
              backgroundColor: theme.background,
              borderColor: theme.border,
            }}
          >
            <View className="items-center">
              <View
                className="h-20 w-20 items-center justify-center rounded-full"
                style={{
                  backgroundColor: "#FEE2E2",
                }}
              >
                <LogOut size={28} color="#DC2626" />
              </View>
            </View>

            <Text
              className="mt-5 text-center text-xl font-bold"
              style={{ color: theme.text }}
            >
              Logout
            </Text>

            <Text
              className="mt-2 text-center text-sm leading-5"
              style={{ color: theme.secondaryText }}
            >
              Are you sure you want to logout?
            </Text>

            <View className="mt-6 flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowLogoutPopup(false)}
                disabled={loggingOut}
                activeOpacity={0.75}
                className="flex-1 items-center rounded-2xl border py-3.5"
                style={{
                  backgroundColor: theme.secondary,
                  borderColor: theme.border,
                }}
              >
                <Text className="font-semibold" style={{ color: theme.text }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleLogout}
                disabled={loggingOut}
                activeOpacity={0.75}
                className="flex-1 items-center rounded-2xl py-3.5"
                style={{
                  backgroundColor: "#DC2626",
                  opacity: loggingOut ? 0.6 : 1,
                }}
              >
                {loggingOut ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="font-semibold" style={{ color: "#FFFFFF" }}>
                    Yes, Logout
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
