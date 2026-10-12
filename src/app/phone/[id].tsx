import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ArrowLeft,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Star,
} from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  addToCart,
  getCart,
  removeFromCart,
  updateCartQuantity,
} from "@/services/cartService";
import { useAuth } from "@/context/AuthContext";
import { getPhoneById } from "@/services/phoneService";
import type { Phone } from "@/services/phoneService";
import { formatIndianCurrency } from "@/utils/formatters";
import { useTheme } from "@/hooks/use-theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ReferenceValue =
  | string
  | {
      _id?: string;
      name?: string;
      value?: string;
    };

function getReferenceValue(
  value: ReferenceValue | unknown,
): string {
  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "object" &&
    value !== null
  ) {
    const reference = value as {
      name?: string;
      value?: string;
    };

    return reference.name ?? reference.value ?? "N/A";
  }

  return "N/A";
}

export default function PhoneDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
const { isLoggedIn } = useAuth();
const insets = useSafeAreaInsets();
const [addingToCart, setAddingToCart] = useState(false);
const [cartMessage, setCartMessage] = useState("");
const [cartQuantity, setCartQuantity] = useState<number | null>(null);
const [updatingCart, setUpdatingCart] = useState(false);

const checkCartQuantity = async (phoneId: string) => {
  if (!isLoggedIn) {
    setCartQuantity(null);
    return;
  }

  try {
    const cart = await getCart();

    const cartItem = cart.items.find(
      (item) => item.phoneId._id === phoneId,
    );

    setCartQuantity(cartItem?.quantity ?? null);
  } catch (error) {
    console.error("Check cart quantity error:", error);
    setCartQuantity(null);
  }
};

const handleAddToCart = async () => {
  if (!isLoggedIn) {
    router.push("/login");
    return;
  }

  if (!phone || phone.quantity <= 0) {
    return;
  }

  try {
    setAddingToCart(true);
    setCartMessage("");

    await addToCart(phone._id);
    setCartQuantity(1);

    setCartMessage("Added to cart");
  } catch (error) {
    console.error("Add to cart error:", error);

    setCartMessage(
      error instanceof Error
        ? error.message
        : "Failed to add to cart"
    );
  } finally {
    setAddingToCart(false);
  }
};

const handleCartQuantityChange = async (newQuantity: number) => {
  if (!phone || cartQuantity === null) {
    return;
  }

  try {
    setUpdatingCart(true);
    setCartMessage("");

    if (newQuantity <= 0) {
      await removeFromCart(phone._id);
      setCartQuantity(null);
      setCartMessage("");
      return;
    }

    await updateCartQuantity(phone._id, newQuantity);
    setCartQuantity(newQuantity);
  } catch (error) {
    console.error("Phone details cart quantity error:", error);

    setCartMessage(
      error instanceof Error
        ? error.message
        : "Failed to update cart quantity",
    );
  } finally {
    setUpdatingCart(false);
  }
};

  const [phone, setPhone] = useState<Phone | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPhone = async () => {
      if (!id) {
        setError("Phone not found");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await getPhoneById(id);

        setPhone(data);
        if (isLoggedIn) {
  await checkCartQuantity(data._id);
}
      } catch (error) {
        console.error("Phone details error:", error);
        setError("Unable to load phone details.");
      } finally {
        setLoading(false);
      }
    };

    fetchPhone();
  }, [id]);

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: theme.background }}
      >
        <ActivityIndicator
          size="large"
          color={theme.accent}
        />

        <Text
          className="mt-3"
          style={{ color: theme.secondaryText }}
        >
          Loading phone details...
        </Text>
      </View>
    );
  }

  if (error || !phone) {
    return (
      <View
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: theme.background }}
      >
        <Text
          className="text-center text-base"
          style={{ color: theme.secondaryText }}
        >
          {error || "Phone not found."}
        </Text>

        <TouchableOpacity
          className="mt-5 rounded-full px-5 py-3"
          style={{ backgroundColor: theme.accent }}
          onPress={() => router.back()}
        >
          <Text
            className="font-semibold"
            style={{ color: theme.background }}
          >
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const finalPrice = phone.totalPrice ?? phone.price;
  const hasDiscount =
    phone.discountPercentage !== undefined &&
    phone.discountPercentage > 0;

  const inStock = phone.quantity > 0;

  const brand = getReferenceValue(phone.brand);
  const variant = getReferenceValue(phone.variant);
  const ram = getReferenceValue(phone.ram);
  const rom = getReferenceValue(phone.rom);

  const color =
    typeof phone.colorId === "string"
      ? phone.colorId
      : phone.colorId?.name ?? "N/A";

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: theme.background }}
    >
      <View
        className="flex-row items-center border-b px-4 py-4"
        style={{ borderColor: theme.border,
              paddingTop: insets.top + 16,
         }}
      >
        <TouchableOpacity
          className="mr-3 h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: theme.secondary }}
          onPress={() => router.back()}
        >
          <ArrowLeft
            size={21}
            color={theme.text}
          />
        </TouchableOpacity>

        <Text
          className="text-lg font-bold"
          style={{ color: theme.text }}
        >
          Phone Details
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-8"
        showsVerticalScrollIndicator={false}
      >
        {/* Product Image */}

        <View
          className="mx-4 mt-5 h-80 items-center justify-center rounded-3xl border"
          style={{
            backgroundColor: theme.secondary,
            borderColor: theme.border,
          }}
        >
          {phone.image ? (
            <Image
              source={{ uri: phone.image }}
              className="h-full w-full"
              resizeMode="contain"
            />
          ) : (
            <Text
              style={{ color: theme.secondaryText }}
            >
              No image available
            </Text>
          )}
        </View>

        {/* Product Information */}

        <View className="px-4 pt-6">
          {phone.isNewPhone ? (
            <View
              className="self-start rounded-full px-3 py-1"
              style={{
                backgroundColor: theme.accent,
              }}
            >
              <Text
                className="text-xs font-bold"
                style={{ color: theme.background }}
              >
                NEW
              </Text>
            </View>
          ) : null}

          <Text
            className="mt-3 text-sm font-medium"
            style={{ color: theme.secondaryText }}
          >
            {brand}
          </Text>

          <Text
            className="mt-1 text-2xl font-bold"
            style={{ color: theme.text }}
          >
            {phone.name}
          </Text>

          {/* Rating */}

          <View className="mt-3 flex-row items-center">
            <View className="flex-row items-center">
              <Star
                size={17}
                color={theme.accent}
                fill={theme.accent}
              />

              <Text
                className="ml-1 font-semibold"
                style={{ color: theme.text }}
              >
                {phone.averageRating?.toFixed(1) ?? "0.0"}
              </Text>
            </View>

            <Text
              className="ml-2"
              style={{ color: theme.secondaryText }}
            >
              · {phone.ratingCount ?? 0} ratings
            </Text>
          </View>

          {/* Price */}

          <View
            className="mt-5 rounded-2xl border p-4"
            style={{
              backgroundColor: theme.secondary,
              borderColor: theme.border,
            }}
          >
            <View className="flex-row flex-wrap items-center">
              <Text
                className="text-2xl font-bold"
                style={{ color: theme.text }}
              >
                {formatIndianCurrency(finalPrice)}
              </Text>

              {hasDiscount ? (
                <>
                  <Text
                    className="ml-3 text-sm line-through"
                    style={{
                      color: theme.secondaryText,
                    }}
                  >
                    {formatIndianCurrency(phone.price)}
                  </Text>

                  <Text
                    className="ml-3 text-xs font-bold"
                    style={{ color: theme.accent }}
                  >
                    {phone.discountPercentage}% OFF
                  </Text>
                </>
              ) : null}
            </View>

            {/* Stock */}

            <View className="mt-3 flex-row items-center">
              <Package
                size={16}
                color={
                  inStock
                    ? theme.accent
                    : theme.secondaryText
                }
              />

              <Text
                className="ml-2 text-sm font-medium"
                style={{
                  color: inStock
                    ? theme.text
                    : theme.secondaryText,
                }}
              >
                {inStock
                  ? `In Stock · Quantity ${phone.quantity}`
                  : "Out of stock"}
              </Text>
            </View>
          </View>

{cartQuantity !== null ? (
  <View
    className="mt-6 flex-row items-center justify-between rounded-xl border px-4 py-3"
    style={{
      backgroundColor: theme.secondary,
      borderColor: theme.border,
    }}
  >
    <Text
      className="font-semibold"
      style={{ color: theme.text }}
    >
      Quantity
    </Text>

    <View className="flex-row items-center">
      <TouchableOpacity
        onPress={() => handleCartQuantityChange(cartQuantity - 1)}
        disabled={updatingCart}
        className="h-9 w-9 items-center justify-center rounded-full"
        style={{
          backgroundColor: theme.background,
          opacity: updatingCart ? 0.4 : 1,
        }}
        activeOpacity={0.8}
      >
        <Minus size={17} color={theme.text} />
      </TouchableOpacity>

      <Text
        className="mx-5 min-w-[20px] text-center text-lg font-bold"
        style={{ color: theme.text }}
      >
        {cartQuantity}
      </Text>

      <TouchableOpacity
        onPress={() => handleCartQuantityChange(cartQuantity + 1)}
        disabled={updatingCart || cartQuantity >= phone.quantity}
        className="h-9 w-9 items-center justify-center rounded-full"
        style={{
          backgroundColor: theme.background,
          opacity:
            updatingCart || cartQuantity >= phone.quantity ? 0.4 : 1,
        }}
        activeOpacity={0.8}
      >
        <Plus size={17} color={theme.text} />
      </TouchableOpacity>
    </View>
  </View>
) : null}

{/* Add to Cart */}
{cartQuantity === null ? (
<TouchableOpacity
  onPress={handleAddToCart}
  disabled={addingToCart || !inStock}
  className="mt-6 items-center rounded-xl py-4"
  style={{
    backgroundColor: theme.accent,
    opacity: addingToCart || !inStock ? 0.5 : 1,
  }}
  activeOpacity={0.8}
>
  {addingToCart ? (
    <ActivityIndicator color={theme.background} />
  ) : (
    <View className="flex-row items-center">
      <ShoppingCart
        size={20}
        color={theme.background}
      />

      <Text
        className="ml-2 font-bold"
        style={{ color: theme.background }}
      >
        Add to Cart
      </Text>
    </View>
  )}
</TouchableOpacity>
) : null}

{cartMessage ? (
  <Text
    className="mt-2 text-center text-sm"
    style={{ color: theme.secondaryText }}
  >
    {cartMessage}
  </Text>
) : null}

          {/* Technical Details */}

          <Text
            className="mt-7 text-lg font-bold"
            style={{ color: theme.text }}
          >
            Technical Details
          </Text>

          <View
            className="mt-3 overflow-hidden rounded-2xl border"
            style={{ borderColor: theme.border }}
          >
            {[
              { label: "Brand", value: brand },
              { label: "Variant", value: variant },
              { label: "RAM", value: ram },
              { label: "ROM", value: rom },
              { label: "Color", value: color },
            ].map((item, index) => (
              <View
                key={item.label}
                className="flex-row justify-between px-4 py-3"
                style={{
                  borderBottomWidth:
                    index < 4 ? 1 : 0,
                  borderColor: theme.border,
                }}
              >
                <Text
                  style={{
                    color: theme.secondaryText,
                  }}
                >
                  {item.label}
                </Text>

                <Text
                  className="max-w-[55%] text-right font-medium"
                  style={{ color: theme.text }}
                >
                  {item.value}
                </Text>
              </View>
            ))}
          </View>

          {/* Description */}

          <Text
            className="mt-7 text-lg font-bold"
            style={{ color: theme.text }}
          >
            Description
          </Text>

          <Text
            className="mt-3 leading-6"
            style={{ color: theme.secondaryText }}
          >
            {phone.description || "No description available."}
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}