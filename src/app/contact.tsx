import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock3,
  Mail,
  MessageCircle,
  MessageSquareText,
  Phone,
  RefreshCw,
  Send,
  X,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
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

export default function ContactScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Controls whether the contact form is visible
  const [isOpen, setIsOpen] = useState(false);

  // Form values
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState("");
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

  // Handle name input
  const handleNameChange = (value: string) => {
    const cleanedValue = value.replace(/[^a-zA-Z ]/g, "");

    if (cleanedValue.length <= 40) {
      setName(cleanedValue);
    }
  };

  // Handle phone input
  const handlePhoneChange = (value: string) => {
    const cleanedValue = value.replace(/\D/g, "");

    if (cleanedValue.length <= 10) {
      setPhone(cleanedValue);
    }
  };

  // Open contact form
  const handleOpenForm = () => {
    setStatus("");
    setIsOpen(true);
  };

  // Close contact form
  const handleCloseForm = () => {
    if (isSubmitting) {
      return;
    }

    setIsOpen(false);
  };

  // Submit contact form
  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim() || !message.trim()) {
      setStatus("Please fill in all fields.");
      return;
    }

    if (phone.length !== 10) {
      setStatus("Please enter a valid 10 digit phone number.");
      return;
    }

    try {
      setIsSubmitting(true);
      setStatus("Submitting...");

      const token = await getToken();

      if (!token) {
        setStatus("Please log in to submit a message.");
        return;
      }

      const response = await fetch(`${API_URL}/api/contacts/mobile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit message");
      }

      // Same successful flow as desktop:
      // clear form and close popup
      setName("");
      setPhone("");
      setMessage("");
      setIsOpen(false);
      setStatus("Message submitted successfully.");
      fetchMyMessages(true);
    } catch (error) {
      console.error("Contact form error:", error);

      setStatus("Failed to submit message.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: theme.background,
      }}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-8"
        contentContainerStyle={{
          paddingTop: insets.top + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}

        <View className="relative pr-2">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            className="absolute left-0 top-1 z-10"
          >
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>

          <View className="items-center">
            <Text
              className="text-2xl font-bold"
              style={{
                color: theme.text,
              }}
            >
              Contact Us
            </Text>

            <Text
              className="mt-2 text-center text-sm leading-5"
              style={{
                color: theme.secondaryText,
              }}
            >
              We'd love to hear from you. Get in touch with us for product
              information or general enquiries.
            </Text>
          </View>
        </View>

        {/* CONTACT INFORMATION */}

        <View className="mt-6 gap-3">
          {/* EMAIL */}

          <TouchableOpacity
            activeOpacity={0.8}
            className="rounded-2xl border p-4"
            style={{
              backgroundColor: theme.secondary,
              borderColor: theme.border,
            }}
          >
            <View className="flex-row items-center">
              <View
                className="mr-3 h-10 w-10 items-center justify-center rounded-full"
                style={{
                  backgroundColor: theme.background,
                }}
              >
                <Mail size={19} color={theme.text} />
              </View>

              <View className="flex-1">
                <Text
                  className="text-xs"
                  style={{
                    color: theme.secondaryText,
                  }}
                >
                  Email
                </Text>

                <Text
                  className="mt-1 text-sm font-semibold"
                  style={{
                    color: theme.text,
                  }}
                >
                  hello@phone.com
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* CUSTOMER CARE */}

          <TouchableOpacity
            activeOpacity={0.8}
            className="rounded-2xl border p-4"
            style={{
              backgroundColor: theme.secondary,
              borderColor: theme.border,
            }}
          >
            <View className="flex-row items-center">
              <View
                className="mr-3 h-10 w-10 items-center justify-center rounded-full"
                style={{
                  backgroundColor: theme.background,
                }}
              >
                <Phone size={19} color={theme.text} />
              </View>

              <View className="flex-1">
                <Text
                  className="text-xs"
                  style={{
                    color: theme.secondaryText,
                  }}
                >
                  Customer Care
                </Text>

                <Text
                  className="mt-1 text-sm font-semibold"
                  style={{
                    color: theme.text,
                  }}
                >
                  +91 98765 43210
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* SUCCESS MESSAGE */}

        {status === "Message submitted successfully." && (
          <View
            className="mt-4 rounded-xl border px-4 py-3"
            style={{
              backgroundColor: theme.secondary,
              borderColor: theme.border,
            }}
          >
            <Text
              className="text-sm font-medium"
              style={{
                color: theme.text,
              }}
            >
              Message submitted successfully.
            </Text>
          </View>
        )}

        {/* GET IN TOUCH */}

        <TouchableOpacity
          onPress={handleOpenForm}
          activeOpacity={0.8}
          className="mt-6 flex-row items-center justify-center rounded-2xl px-5 py-4"
          style={{
            backgroundColor: theme.text,
          }}
        >
          <MessageCircle size={19} color={theme.background} />

          <Text
            className="ml-2 text-sm font-semibold"
            style={{
              color: theme.background,
            }}
          >
            Get in Touch
          </Text>
        </TouchableOpacity>

        <Text
        className="mt-5 text-sm text-left"
        >
          Your conversations
        </Text>

        {/* MY TICKETS */}
        <TouchableOpacity
          onPress={() => router.push("/getin-touch-history")}
          activeOpacity={0.8}
          className="mt-3 flex-row items-center rounded-2xl border p-4"
          style={{
            backgroundColor: theme.secondary,
            borderColor: theme.border,
          }}
        >
          <View
            className="mr-3 h-11 w-11 items-center justify-center rounded-full"
            style={{ backgroundColor: theme.background }}
          >
            <MessageSquareText size={21} color={theme.text} />
          </View>

          <View className="flex-1">
            <Text
              className="text-sm font-semibold"
              style={{ color: theme.text }}
            >
              My Queries
            </Text>
            <Text
              className="mt-1 text-xs"
              style={{ color: theme.secondaryText }}
            >
              View your enquiries and support replies
            </Text>
          </View>

          <Text
            className="text-2xl"
            style={{ color: theme.secondaryText }}
          >
            <ChevronRight
  size={22}
  color={theme.secondaryText}
/>
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* CONTACT FORM MODAL */}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={handleCloseForm}
      >
        <KeyboardAvoidingView
          className="flex-1 justify-center px-4"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <View
            className="max-h-[85%] rounded-3xl border p-5"
            style={{
              backgroundColor: theme.background,
              borderColor: theme.border,
            }}
          >
            {/* MODAL HEADER */}

            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-4">
                <Text
                  className="text-2xl font-bold"
                  style={{
                    color: theme.text,
                  }}
                >
                  Get in Touch
                </Text>

                <Text
                  className="mt-2 text-sm leading-5"
                  style={{
                    color: theme.secondaryText,
                  }}
                >
                  Fill in your details and we'll get back to you.
                </Text>
              </View>

              {/* CLOSE */}

              <TouchableOpacity
                onPress={handleCloseForm}
                disabled={isSubmitting}
                activeOpacity={0.7}
                className="h-9 w-9 items-center justify-center rounded-full"
                style={{
                  backgroundColor: theme.secondary,
                }}
              >
                <X size={19} color={theme.text} />
              </TouchableOpacity>
            </View>

            {/* FORM */}

            <ScrollView
              className="mt-6"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* NAME */}

              <Text
                className="text-sm font-medium"
                style={{
                  color: theme.text,
                }}
              >
                Name
              </Text>

              <TextInput
                value={name}
                onChangeText={handleNameChange}
                placeholder="Enter your name"
                placeholderTextColor={theme.secondaryText}
                maxLength={40}
                autoCapitalize="words"
                className="mt-2 rounded-xl border px-4 py-3"
                style={{
                  backgroundColor: theme.secondary,
                  color: theme.text,
                  borderColor: theme.border,
                }}
              />

              {/* PHONE */}

              <Text
                className="mt-5 text-sm font-medium"
                style={{
                  color: theme.text,
                }}
              >
                Phone
              </Text>

              <View
                className="mt-2 flex-row overflow-hidden rounded-xl border"
                style={{
                  borderColor: theme.border,
                  backgroundColor: theme.secondary,
                }}
              >
                {/* COUNTRY CODE */}

                <View
                  className="justify-center px-4"
                  style={{
                    backgroundColor: theme.secondary,
                  }}
                >
                  <Text
                    className="text-sm"
                    style={{
                      color: theme.secondaryText,
                    }}
                  >
                    +91
                  </Text>
                </View>

                {/* PHONE INPUT */}

                <TextInput
                  value={phone}
                  onChangeText={handlePhoneChange}
                  placeholder="Enter 10 digit number"
                  placeholderTextColor={theme.secondaryText}
                  keyboardType="number-pad"
                  maxLength={10}
                  className="min-w-0 flex-1 px-4 py-3"
                  style={{
                    backgroundColor: theme.background,
                    color: theme.text,
                  }}
                />
              </View>

              {/* MESSAGE */}

              <Text
                className="mt-5 text-sm font-medium"
                style={{
                  color: theme.text,
                }}
              >
                Message
              </Text>

              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Write your message"
                placeholderTextColor={theme.secondaryText}
                multiline
                textAlignVertical="top"
                className="mt-2 min-h-[120px] rounded-xl border px-4 py-3"
                style={{
                  backgroundColor: theme.secondary,
                  color: theme.text,
                  borderColor: theme.border,
                }}
              />

              {/* STATUS */}

              {status && status !== "Message submitted successfully." && (
                <Text
                  className="mt-3 text-sm"
                  style={{
                    color: theme.text,
                  }}
                >
                  {status}
                </Text>
              )}

              {/* SUBMIT */}

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.8}
                className="mt-5 mb-4 flex-row items-center justify-center rounded-xl px-5 py-4"
                style={{
                  backgroundColor: theme.text,
                  opacity: isSubmitting ? 0.6 : 1,
                }}
              >
                <Send size={18} color={theme.background} />

                <Text
                  className="ml-2 text-sm font-semibold"
                  style={{
                    color: theme.background,
                  }}
                >
                  {isSubmitting ? "Submitting..." : "Submit Message"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
