
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ArrowLeft, CheckCircle2, ChevronDown, ChevronUp, Clock3, MessageCircle, MessageSquareText, RefreshCw } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/use-theme";
import { API_URL } from "@/constants/config";
import { getToken } from "@/services/authService";

type ContactMessage = {
  _id: string;
  name: string;
  phone: string;
  message: string;
  reply?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
};

export default function GetInTouchHistoryScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [myMessages, setMyMessages] = useState<ContactMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isRefreshingMessages, setIsRefreshingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState("");
  const [expandedMessages, setExpandedMessages] = useState<string[]>([]);

  const fetchMyMessages = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshingMessages(true);
      } else {
        setIsLoadingMessages(true);
      }

      setMessagesError("");

      const token = await getToken();

      if (!token) {
        setMyMessages([]);
        setMessagesError("Please log in to view your conversations.");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/contacts/mobile/my-messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load messages.");
      }

      setMyMessages(data);
    } catch (error) {
      console.error("Failed to load contact messages:", error);
      setMessagesError("Couldn't load your conversations. Please try again.");
    } finally {
      setIsLoadingMessages(false);
      setIsRefreshingMessages(false);
    }
  }, []);

  useEffect(() => {
    fetchMyMessages();
  }, [fetchMyMessages]);

  return (
    <View className="flex-1" style={{ backgroundColor: theme.background }}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-8"
        contentContainerStyle={{ paddingTop: insets.top + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            className="mr-3 h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: theme.secondary }}
          >
            <ArrowLeft size={22} color={theme.text} />
          </TouchableOpacity>

          <View className="flex-1">
            <Text
              className="text-2xl font-bold text-center"
              style={{ color: theme.text }}
            >
              My Queries
            </Text>
            <Text
              className="mt-1 text-sm text-center"
              style={{ color: theme.secondaryText }}
            >
              Track your enquiries and support replies
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => fetchMyMessages(true)}
            disabled={isRefreshingMessages}
            className="h-10 w-10 items-center justify-center rounded-full border"
            style={{
              backgroundColor: theme.secondary,
              borderColor: theme.border,
            }}
          >
            {isRefreshingMessages ? (
              <ActivityIndicator color={theme.text} />
            ) : (
              <RefreshCw size={18} color={theme.text} />
            )}
          </TouchableOpacity>
        </View>

        
<View className="mt-7">
  {isLoadingMessages ? (
    <View
      className="items-center rounded-2xl border px-4 py-8"
      style={{
        backgroundColor: theme.secondary,
        borderColor: theme.border,
      }}
    >
      <ActivityIndicator size="small" color={theme.text} />
      <Text className="mt-3 text-sm" style={{ color: theme.secondaryText }}>
        Loading your conversations...
      </Text>
    </View>
  ) : messagesError ? (
    <View
      className="rounded-2xl border p-4"
      style={{
        backgroundColor: theme.secondary,
        borderColor: theme.border,
      }}
    >
      <Text className="text-sm leading-5" style={{ color: theme.secondaryText }}>
        {messagesError}
      </Text>

      <TouchableOpacity
        onPress={() => fetchMyMessages(true)}
        className="mt-3 self-start rounded-xl px-4 py-2"
        style={{ backgroundColor: theme.text }}
      >
        <Text className="text-sm font-semibold" style={{ color: theme.background }}>
          Try Again
        </Text>
      </TouchableOpacity>
    </View>
  ) : myMessages.length === 0 ? (
    <View
      className="items-center rounded-3xl border px-6 py-10"
      style={{
        backgroundColor: theme.secondary,
        borderColor: theme.border,
      }}
    >
      <View
        className="mb-4 h-16 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: theme.background }}
      >
        <MessageSquareText size={28} color={theme.text} />
      </View>

      <Text className="text-center text-base font-bold" style={{ color: theme.text }}>
        No tickets yet
      </Text>
      <Text
        className="mt-2 text-center text-sm leading-5"
        style={{ color: theme.secondaryText }}
      >
        Your enquiries and replies from Sigmato Support will appear here.
      </Text>

      <TouchableOpacity
        onPress={() => router.push("/contact")}
        activeOpacity={0.8}
        className="mt-5 rounded-xl px-5 py-3"
        style={{ backgroundColor: theme.text }}
      >
        <Text className="text-sm font-semibold" style={{ color: theme.background }}>
          Get in Touch
        </Text>
      </TouchableOpacity>
    </View>
  ) : (
    <View className="gap-4">
      {myMessages.map((item) => {
        const isExpanded = expandedMessages.includes(item._id);
        const hasReply = Boolean(item.reply?.trim());

        return (
          <View
            key={item._id}
            className="overflow-hidden rounded-3xl border"
            style={{
              backgroundColor: theme.secondary,
              borderColor: theme.border,
            }}
          >
            <View className="p-4">
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: theme.secondaryText }}
                  >
                    YOUR ENQUIRY
                  </Text>
                  <Text
                    className="mt-2 text-sm leading-6"
                    style={{ color: theme.text }}
                    numberOfLines={isExpanded ? undefined : 3}
                  >
                    {item.message}
                  </Text>
                </View>

                <View
                  className="rounded-full px-3 py-2"
                  style={{ backgroundColor: theme.background }}
                >
                  <Text className="text-xs font-semibold" style={{ color: theme.text }}>
                    {hasReply ? "Replied" : "Pending"}
                  </Text>
                </View>
              </View>

              <View className="mt-4 flex-row items-center">
                <Clock3 size={14} color={theme.secondaryText} />
                <Text className="ml-2 text-xs" style={{ color: theme.secondaryText }}>
                  {new Date(item.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              </View>

              {hasReply && (
                <View
                  className="mt-4 rounded-2xl border p-4"
                  style={{
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                  }}
                >
                  <View className="mb-3 flex-row items-center">
                    <View
                      className="mr-2 h-8 w-8 items-center justify-center rounded-full"
                      style={{ backgroundColor: theme.secondary }}
                    >
                      <MessageCircle size={16} color={theme.text} />
                    </View>

                    <View className="flex-1">
                      <Text className="text-sm font-bold" style={{ color: theme.text }}>
                        Sigmato Support
                      </Text>
                      <Text className="mt-0.5 text-xs" style={{ color: theme.secondaryText }}>
                        Reply from our team
                      </Text>
                    </View>

                    <CheckCircle2 size={18} color="#16A34A" />
                  </View>

                  <Text
                    className="text-sm leading-6"
                    style={{ color: theme.text }}
                    numberOfLines={isExpanded ? undefined : 4}
                  >
                    {item.reply}
                  </Text>
                </View>
              )}

              {(item.message.length > 120 || (item.reply?.length ?? 0) > 160) && (
                <TouchableOpacity
                  onPress={() =>
                    setExpandedMessages((previous) =>
                      isExpanded
                        ? previous.filter((id) => id !== item._id)
                        : [...previous, item._id],
                    )
                  }
                  className="mt-4 flex-row items-center self-start"
                  activeOpacity={0.7}
                >
                  <Text className="mr-1 text-sm font-semibold" style={{ color: theme.text }}>
                    {isExpanded ? "Show less" : "Read full conversation"}
                  </Text>
                  {isExpanded ? (
                    <ChevronUp size={16} color={theme.text} />
                  ) : (
                    <ChevronDown size={16} color={theme.text} />
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
    </View>
  )}
</View>

      </ScrollView>
    </View>
  );
}
