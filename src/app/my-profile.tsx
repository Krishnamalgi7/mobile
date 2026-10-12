import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, LogOut, Mail, MapPin, Pencil, Phone, User } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

export default function MyProfileScreen() {
  const { theme } = useTheme();
  const { logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

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

  const updateProfile = async () => {
    if (!profile) return;

    if (!profile.name.trim() || !profile.address.trim()) {
      setError("Name and address are required");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const token = await getToken();

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(`${API_URL}/api/customer-auth/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profile.name.trim(),
          email: profile.email.trim(),
          address: profile.address.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      setProfile(data.customer);
      setEditing(false);
    } catch (error) {
      console.error("Profile update error:", error);

      setError(
        error instanceof Error ? error.message : "Failed to update profile",
      );
    } finally {
      setSaving(false);
    }
  };

  //   const handleLogout = async () => {
  //     await logout();
  //     router.replace("/");
  //   };

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: theme.background }}
      >
        <ActivityIndicator />
      </View>
    );
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
        <Text className="text-center text-base" style={{ color: theme.text }}>
          {error}
        </Text>
      </View>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      contentContainerClassName="px-5 pb-8"
      contentContainerStyle={{
        paddingTop: insets.top + 16,
      }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Top bar */}
<View className="relative items-center mr-3">
  <TouchableOpacity
    onPress={() => router.back()}
    activeOpacity={0.7}
    className="absolute left-2 top-1"
  >
    <ArrowLeft size={24} color={theme.text} />
  </TouchableOpacity>

  <Text className="text-2xl font-bold" style={{ color: theme.text }}>
    My Profile
  </Text>

  <Text className="mt-1 text-sm" style={{ color: theme.secondaryText }}>
    Manage your account information
  </Text>
</View>

      {/* Profile card */}
      <View
        className="mt-6 rounded-2xl p-5"
        style={{ backgroundColor: theme.secondary }}
      >
        {/* Profile avatar */}
        <View className="items-center">
          <View
            className="h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: theme.accent }}
          >
            <User size={38} color="#FFFFFF" />
          </View>

          <Text
            className="mt-3 text-lg font-semibold"
            style={{ color: theme.text }}
          >
            {profile.name}
          </Text>
        </View>

        {/* Personal information header */}
        <View className="mt-7 flex-row items-center justify-between">
          <Text
            className="text-base font-semibold"
            style={{ color: theme.text }}
          >
            Personal Information
          </Text>

          {!editing && (
            <TouchableOpacity
              onPress={() => {
                setError("");
                setEditing(true);
              }}
              className="flex-row items-center rounded-lg px-2 py-1.5"
            >
              <Pencil size={16} color={theme.accent} />

              <Text
                className="ml-1.5 text-sm font-medium"
                style={{ color: theme.accent }}
              >
                Edit
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Name */}
        <View className="mt-5">
          <View className="flex-row items-center">
            <User size={18} color={theme.text} />

            <Text className="ml-3 text-sm" style={{ color: theme.text }}>
              Name
            </Text>
          </View>

          <TextInput
            value={profile.name}
            editable={editing}
            onChangeText={(text) =>
              setProfile((current) =>
                current
                  ? {
                      ...current,
                      name: text,
                    }
                  : current,
              )
            }
            className="mt-2 rounded-xl px-4 py-3"
            style={{
              backgroundColor: theme.background,
              color: theme.text,
            }}
          />
        </View>

        {/* Phone */}
        <View className="mt-5">
          <View className="flex-row items-center">
            <Phone size={18} color={theme.secondaryText} />

            <Text
              className="ml-3 text-sm"
              style={{ color: theme.secondaryText }}
            >
              Phone
            </Text>
          </View>

          <TextInput
            value={profile.phone}
            editable={false}
            className="mt-2 rounded-xl px-4 py-3"
            style={{
              backgroundColor: theme.background,
              color: theme.secondaryText,
            }}
          />
        </View>

        {/* Email */}
        <View className="mt-5">
          <View className="flex-row items-center">
            <Mail size={18} color={theme.text} />

            <Text className="ml-3 text-sm" style={{ color: theme.text }}>
              Email
            </Text>
          </View>

          <TextInput
            value={profile.email}
            editable={editing}
            onChangeText={(text) =>
              setProfile((current) =>
                current
                  ? {
                      ...current,
                      email: text,
                    }
                  : current,
              )
            }
            className="mt-2 rounded-xl px-4 py-3"
            style={{
              backgroundColor: theme.background,
              color: theme.text,
            }}
          />
        </View>

        {/* Address */}
        <View className="mt-5">
          <View className="flex-row items-center">
            <MapPin size={18} color={theme.text} />

            <Text className="ml-3 text-sm" style={{ color: theme.text }}>
              Address
            </Text>
          </View>

          <TextInput
            value={profile.address}
            editable={editing}
            multiline
            onChangeText={(text) =>
              setProfile((current) =>
                current
                  ? {
                      ...current,
                      address: text,
                    }
                  : current,
              )
            }
            className="mt-2 rounded-xl px-4 py-3"
            style={{
              backgroundColor: theme.background,
              color: theme.text,
              minHeight: 90,
              textAlignVertical: "top",
            }}
          />
        </View>

        {/* Error */}
        {error ? (
          <Text className="mt-4 text-sm" style={{ color: "#DC2626" }}>
            {error}
          </Text>
        ) : null}

        {/* Save / Cancel */}
        {editing && (
          <View className="mt-6 flex-row gap-3">
            <TouchableOpacity
              onPress={() => {
                setEditing(false);
                setError("");
                fetchProfile();
              }}
              disabled={saving}
              className="flex-1 items-center rounded-xl border py-3"
              style={{
                borderColor: theme.secondaryText,
              }}
            >
              <Text className="font-semibold" style={{ color: theme.text }}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={updateProfile}
              disabled={saving}
              className="flex-1 items-center rounded-xl py-3"
              style={{
                backgroundColor: theme.accent,
              }}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="font-semibold text-white">Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
