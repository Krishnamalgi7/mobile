import { useState } from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useRouter } from "expo-router";
import { Phone, ShieldCheck } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/use-theme";
import { saveToken } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function LoginScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { login } = useAuth();
  const insets = useSafeAreaInsets();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSendOtp = async () => {
    setErrorMessage("");

    if (!phone.trim() || phone.trim().length !== 10) {
      setErrorMessage("Please enter a valid 10 digit phone number.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/customer-auth/send-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: phone.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to send OTP");
      }

      setOtpSent(true);
    } catch (error) {
      console.error("Send OTP error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to send OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMessage("");

    if (!otp.trim() || otp.trim().length !== 4) {
      setErrorMessage("Please enter the 4 digit OTP.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/customer-auth/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: phone.trim(),
            otp: otp.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "OTP verification failed");
      }

      await saveToken(data.token);

      login();

      router.replace("/");
    } catch (error) {
      console.error("OTP verification error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Invalid OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      className="flex-1 px-6"
      style={{
        backgroundColor: theme.background,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <View className="flex-1 justify-center">
        <View className="mb-8">
          <Text
            className="text-3xl font-bold"
            style={{ color: theme.text }}
          >
            Welcome to our store
          </Text>

          <Text
            className="mt-2 text-base"
            style={{ color: theme.secondaryText }}
          >
            Login with your phone number.
          </Text>
        </View>

        <View className="gap-4">
          {/* Phone Number */}
          <View>
            <Text
              className="mb-2 text-sm font-medium"
              style={{ color: theme.text }}
            >
              Phone Number
            </Text>

            <View
              className="flex-row items-center rounded-xl border px-4"
              style={{
                backgroundColor: theme.secondary,
                borderColor: theme.border,
              }}
            >
              <Phone size={20} color={theme.text} />

              <Text
                className="ml-3"
                style={{ color: theme.text }}
              >
                +91
              </Text>

              <TextInput
                value={phone}
                onChangeText={(value) =>
                  setPhone(value.replace(/\D/g, "").slice(0, 10))
                }
                placeholder="Enter 10 digit number"
                placeholderTextColor={theme.secondaryText}
                keyboardType="phone-pad"
                maxLength={10}
                className="ml-3 flex-1 py-4"
                style={{ color: theme.text }}
              />
            </View>
          </View>

          {/* OTP */}
          {otpSent ? (
            <View>
              <Text
                className="mb-2 text-sm font-medium"
                style={{ color: theme.text }}
              >
                OTP
              </Text>

              <View
                className="flex-row items-center rounded-xl border px-4"
                style={{
                  backgroundColor: theme.secondary,
                  borderColor: theme.border,
                }}
              >
                <ShieldCheck size={20} color={theme.text} />

                <TextInput
                  value={otp}
                  onChangeText={(value) =>
                    setOtp(value.replace(/\D/g, "").slice(0, 4))
                  }
                  placeholder="Enter 4 digit OTP"
                  placeholderTextColor={theme.secondaryText}
                  keyboardType="number-pad"
                  maxLength={4}
                  className="ml-3 flex-1 py-4"
                  style={{ color: theme.text }}
                />
              </View>
            </View>
          ) : null}

          {errorMessage ? (
            <Text
              className="text-sm"
              style={{ color: "#dc2626" }}
            >
              {errorMessage}
            </Text>
          ) : null}

          {/* Action Button */}
          <TouchableOpacity
            onPress={otpSent ? handleVerifyOtp : handleSendOtp}
            disabled={loading}
            activeOpacity={0.8}
            className="mt-2 items-center rounded-xl py-4"
            style={{
              backgroundColor: theme.accent,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator color={theme.background} />
            ) : (
              <Text
                className="text-base font-bold"
                style={{ color: theme.background }}
              >
                {otpSent ? "Verify OTP" : "Send OTP"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}