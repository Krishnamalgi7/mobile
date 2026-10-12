import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppLoader from "@/utils/AppLoader";
import {
  createCustomerInvoice,
  getCart,
  removeFromCart,
  updateCartQuantity,
  type Cart,
} from "@/services/cartService";
import { API_URL } from "@/constants/config";
import { getToken } from "@/services/authService";
import { useTheme } from "@/hooks/use-theme";
import { formatIndianCurrency } from "@/utils/formatters";

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [showBookNowPopup, setShowBookNowPopup] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  type CartSummary = {
    originalPrice: number;
    discount: number;
    taxableSubtotal: number;
    gstPercentage: number;
    gstAmount: number;
    roundedOff: number;
    totalAmount: number;
  };

  const [summary, setSummary] = useState<CartSummary | null>(null);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const token = await getToken();

      if (!token) {
        setIsLoggedIn(false);
        setLoading(false);
        return;
      }

      setIsLoggedIn(true);

      await Promise.all([fetchCart(), fetchCartSummary()]);
    } catch (error) {
      console.error("Authentication check error:", error);
      setIsLoggedIn(false);
      setLoading(false);
    }
  };

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getCart();
      setCart(data);
    } catch (error) {
      console.error("Cart fetch error:", error);

      setError(error instanceof Error ? error.message : "Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  const fetchCartSummary = async () => {
    try {
      const token = await getToken();

      const response = await fetch(`${API_URL}/api/cart/get-cart-summary`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load cart summary");
      }

      setSummary(data.summary);
    } catch (error) {
      console.error("Cart summary error:", error);
    }
  };

  const handleQuantityChange = async (phoneId: string, quantity: number) => {
    if (quantity < 1) return;

    try {
      setUpdating(true);
      setError("");

      await updateCartQuantity(phoneId, quantity);

      await fetchCart();
      await fetchCartSummary();
    } catch (error) {
      console.error("Cart quantity error:", error);

      setError(
        error instanceof Error ? error.message : "Failed to update quantity",
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleRemove = async (phoneId: string) => {
    try {
      setUpdating(true);
      setError("");

      const updatedCart = await removeFromCart(phoneId);

      setCart(updatedCart);
      await fetchCartSummary();
    } catch (error) {
      console.error("Remove cart item error:", error);

      setError(
        error instanceof Error ? error.message : "Failed to remove item",
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleBookNow = async () => {
    try {
      setBooking(true);
      setError("");

      const invoice = await createCustomerInvoice();

      setCart({ items: [] });

      router.push({
        pathname: "/order-confirmed",
        params: {
          invoice: JSON.stringify(invoice),
        },
      });
    } catch (error) {
      console.error("Book now error:", error);
      setError("Failed to place order. Please try again.");
    } finally {
      setBooking(false);
    }
  };

if (loading) {
  return <AppLoader />;
}

  if (!isLoggedIn) {
    return (
      <View
        className="flex-1 items-center justify-center px-6"
        style={{
          backgroundColor: theme.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        <View
          className="w-full items-center rounded-3xl border p-8"
          style={{
            backgroundColor: theme.secondary,
            borderColor: theme.border,
          }}
        >
          <View
            className="h-20 w-20 items-center justify-center rounded-full"
            style={{
              backgroundColor: theme.background,
            }}
          >
            <ShoppingCart size={36} color={theme.accent} />
          </View>

          <Text
            className="mt-6 text-xl font-bold text-center"
            style={{
              color: theme.text,
            }}
          >
            Login Required
          </Text>

          <Text
            className="mt-2 text-center text-sm leading-5"
            style={{
              color: theme.secondaryText,
            }}
          >
            Please login to access your cart and manage your items.
          </Text>

          <TouchableOpacity
            onPress={() => router.push("/login")}
            activeOpacity={0.8}
            className="mt-6 w-full items-center rounded-xl py-4"
            style={{
              backgroundColor: theme.accent,
            }}
          >
            <Text
              className="font-semibold"
              style={{
                color: theme.background,
              }}
            >
              Login
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (error && !cart) {
    return (
      <View
        className="flex-1 items-center justify-center px-6"
        style={{
          backgroundColor: theme.background,
          paddingTop: insets.top,
        }}
      >
        <Text
          className="text-center"
          style={{
            color: theme.text,
          }}
        >
          {error}
        </Text>
      </View>
    );
  }

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: theme.background,
      }}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-32"
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="relative">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            className="absolute left-0 top-1 z-10"
          >
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>

          <Text
            className="text-center text-2xl font-bold"
            style={{
              color: theme.text,
            }}
          >
            My Cart
          </Text>
        </View>

        {isEmpty ? (
          <View className="items-center justify-center py-32">
            <View
              className="h-24 w-24 items-center justify-center rounded-full"
              style={{
                backgroundColor: theme.secondary,
              }}
            >
              <ShoppingCart size={42} color={theme.text} />
            </View>

            <Text
              className="mt-6 text-xl font-bold"
              style={{
                color: theme.text,
              }}
            >
              Your cart is empty
            </Text>

            <Text
              className="mt-2 text-center text-sm"
              style={{
                color: theme.secondaryText,
              }}
            >
              Add some phones to your cart and they will appear here.
            </Text>

            <TouchableOpacity
              onPress={() => router.push("/explore")}
              className="mt-6 flex-row items-center rounded-xl px-5 py-3"
              style={{
                backgroundColor: theme.accent,
              }}
              activeOpacity={0.8}
            >
              <Plus size={18} color={theme.background} />

              <Text
                className="ml-2 font-semibold"
                style={{
                  color: theme.background,
                }}
              >
                Add Items
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="mt-6">
            <Text
              className="mb-4 text-sm"
              style={{
                color: theme.secondaryText,
              }}
            >
              {cart.items.length} {cart.items.length === 1 ? "item" : "items"}
            </Text>

            {cart.items.map((item) => {
              const phone = item.phoneId;

              const itemPrice = phone.totalPrice ?? phone.price;

              const imageUri = phone.image || phone.images?.[0];

              return (
                <View
                  key={phone._id}
                  className="mb-4 rounded-2xl border p-4"
                  style={{
                    backgroundColor: theme.secondary,
                    borderColor: theme.border,
                  }}
                >
                  <View className="flex-row">
                    <View
                      className="h-28 w-24 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: theme.background,
                      }}
                    >
                      {imageUri ? (
                        <Image
                          source={{ uri: imageUri }}
                          className="h-full w-full"
                          resizeMode="contain"
                        />
                      ) : (
                        <ShoppingCart size={28} color={theme.secondaryText} />
                      )}
                    </View>

                    <View className="ml-4 flex-1">
                      <Text
                        className="font-semibold"
                        numberOfLines={2}
                        style={{
                          color: theme.text,
                        }}
                      >
                        {phone.name}
                      </Text>

                      <Text
                        className="mt-2 text-lg font-bold"
                        style={{
                          color: theme.text,
                        }}
                      >
                        {formatIndianCurrency(itemPrice)}
                      </Text>

                      <View className="mt-3 flex-row items-center">
                        <TouchableOpacity
                          onPress={() =>
                            handleQuantityChange(phone._id, item.quantity - 1)
                          }
                          disabled={updating || item.quantity <= 1}
                          className="h-9 w-9 items-center justify-center rounded-lg border"
                          style={{
                            borderColor: theme.border,
                            opacity: updating || item.quantity <= 1 ? 0.4 : 1,
                          }}
                        >
                          <Minus size={17} color={theme.text} />
                        </TouchableOpacity>

                        <Text
                          className="mx-4 font-semibold"
                          style={{
                            color: theme.text,
                          }}
                        >
                          {item.quantity}
                        </Text>

                        <TouchableOpacity
                          onPress={() =>
                            handleQuantityChange(phone._id, item.quantity + 1)
                          }
                          disabled={updating || item.quantity >= phone.quantity}
                          className="h-9 w-9 items-center justify-center rounded-lg border"
                          style={{
                            borderColor: theme.border,
                            opacity:
                              updating || item.quantity >= phone.quantity
                                ? 0.4
                                : 1,
                          }}
                        >
                          <Plus size={17} color={theme.text} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleRemove(phone._id)}
                    disabled={updating}
                    className="mt-4 flex-row items-center self-end"
                    style={{
                      opacity: updating ? 0.5 : 1,
                    }}
                  >
                    <Trash2 size={17} color={theme.secondaryText} />

                    <Text
                      className="ml-2 text-sm"
                      style={{
                        color: theme.secondaryText,
                      }}
                    >
                      Remove
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}

            {summary ? (
              <View
                className="mt-2 rounded-2xl border p-5"
                style={{
                  backgroundColor: theme.secondary,
                  borderColor: theme.border,
                }}
              >
                <Text
                  className="mb-4 text-lg font-bold"
                  style={{
                    color: theme.text,
                  }}
                >
                  Order Summary
                </Text>

                <View className="mb-3 flex-row justify-between">
                  <Text style={{ color: theme.secondaryText }}>
                    Original Price
                  </Text>

                  <Text className="font-medium" style={{ color: theme.text }}>
                    {formatIndianCurrency(summary.originalPrice)}
                  </Text>
                </View>

                <View className="mb-3 flex-row justify-between">
                  <Text style={{ color: theme.secondaryText }}>Discount</Text>

                  <Text className="font-medium" style={{ color: theme.accent }}>
                    - {formatIndianCurrency(summary.discount)}
                  </Text>
                </View>

                <View className="mb-3 flex-row justify-between">
                  <Text style={{ color: theme.secondaryText }}>Subtotal</Text>

                  <Text className="font-medium" style={{ color: theme.text }}>
                    {formatIndianCurrency(summary.taxableSubtotal)}
                  </Text>
                </View>

                <View className="mb-3 flex-row justify-between">
                  <Text style={{ color: theme.secondaryText }}>
                    GST ({summary.gstPercentage}%)
                  </Text>

                  <Text className="font-medium" style={{ color: theme.text }}>
                    {formatIndianCurrency(summary.gstAmount)}
                  </Text>
                </View>

                <View className="mb-4 flex-row justify-between">
                  <Text style={{ color: theme.secondaryText }}>
                    Rounded Off
                  </Text>

                  <Text className="font-medium" style={{ color: theme.text }}>
                    {formatIndianCurrency(summary.roundedOff)}
                  </Text>
                </View>

                <View
                  className="border-t pt-4"
                  style={{
                    borderColor: theme.border,
                  }}
                >
                  <View className="flex-row justify-between">
                    <Text
                      className="text-lg font-bold"
                      style={{ color: theme.text }}
                    >
                      Total
                    </Text>

                    <Text
                      className="text-lg font-bold"
                      style={{ color: theme.accent }}
                    >
                      {formatIndianCurrency(summary.totalAmount)}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}

            {error ? (
              <Text
                className="mb-4 text-sm"
                style={{
                  color: "#dc2626",
                }}
              >
                {error}
              </Text>
            ) : null}
          </View>
        )}
      </ScrollView>

      {!isEmpty ? (
        <View
          className="absolute bottom-0 left-0 right-0 border-t px-5 py-4"
          style={{
            backgroundColor: theme.background,
            borderColor: theme.border,
            paddingBottom: insets.bottom + 12,
          }}
        >
          <TouchableOpacity
            onPress={() => setShowBookNowPopup(true)}
            disabled={booking || updating}
            className="items-center rounded-xl py-4"
            style={{
              backgroundColor: theme.accent,
              opacity: booking || updating ? 0.6 : 1,
            }}
            activeOpacity={0.8}
          >
            {booking ? (
              <ActivityIndicator color={theme.background} />
            ) : (
              <Text
                className="text-base font-bold"
                style={{
                  color: theme.background,
                }}
              >
                Buy Now
              </Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}
      
      <Modal
        visible={showBookNowPopup}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!booking) {
            setShowBookNowPopup(false);
          }
        }}
      >
        <View
          className="flex-1 items-center justify-center px-6"
          style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
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
                style={{ backgroundColor: theme.secondary }}
              >
                <ShoppingCart size={28} color={theme.accent} />
              </View>
            </View>

            <Text
              className="mt-5 text-center text-xl font-bold"
              style={{ color: theme.text }}
            >
              Confirm Your Order
            </Text>

            <Text
              className="mt-2 text-center text-sm leading-5"
              style={{ color: theme.secondaryText }}
            >
              Are you sure you want to place this order?
            </Text>

            <View className="mt-6 flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowBookNowPopup(false)}
                disabled={booking}
                activeOpacity={0.75}
                className="flex-1 items-center rounded-2xl border py-3.5"
                style={{
                  backgroundColor: theme.secondary,
                  borderColor: theme.border,
                }}
              >
                <Text
                  className="font-semibold"
                  style={{ color: theme.text }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowBookNowPopup(false);
                  handleBookNow();
                }}
                disabled={booking}
                activeOpacity={0.75}
                className="flex-1 items-center rounded-2xl py-3.5"
                style={{
                  backgroundColor: theme.accent,
                  opacity: booking ? 0.6 : 1,
                }}
              >
                {booking ? (
                  <ActivityIndicator color={theme.background} />
                ) : (
                  <Text
                    className="font-semibold"
                    style={{ color: theme.background }}
                  >
                    Confirm
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
