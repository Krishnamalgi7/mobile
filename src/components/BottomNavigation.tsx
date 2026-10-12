import { Text, TouchableOpacity, View } from "react-native";
import { usePathname, useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCallback, useState } from "react";
import { getCart, subscribeToCartChanges } from "@/services/cartService";

import { Home, Search, ShoppingCart, User} from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";

const navigationItems = [
  {
    label: "Home",
    route: "/",
    icon: Home,
  },
  {
    label: "Explore",
    route: "/explore",
    icon: Search,
  },
  {
    label: "Cart",
    route: "/cart",
    icon: ShoppingCart,
  },
] as const;

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const { theme } = useTheme();
  const { isLoggedIn, loading } = useAuth();
  const [cartQuantity, setCartQuantity] = useState(0);

useFocusEffect(
  useCallback(() => {
    const fetchCartQuantity = async () => {
      if (!isLoggedIn) {
        setCartQuantity(0);
        return;
      }

      try {
        const cart = await getCart();

        const totalQuantity = cart.items.reduce(
          (total, item) => total + item.quantity,
          0
        );

        setCartQuantity(totalQuantity);
      } catch (error) {
        console.error("Bottom navigation cart quantity error:", error);
        setCartQuantity(0);
      }
    };

    fetchCartQuantity();

    const unsubscribe = subscribeToCartChanges(() => {
      fetchCartQuantity();
    });

    return unsubscribe;
  }, [isLoggedIn])
);

  if (loading) {
    return null;
  }

  const accountRoute = isLoggedIn ? "/profile" : "/login";
  const accountLabel = isLoggedIn ? "Profile" : "Login";
  const AccountIcon = isLoggedIn ? User : User;

  return (
    <View
      className="flex-row border-t"
      style={{
        backgroundColor: theme.background,
        borderTopColor: theme.border,
        paddingBottom: insets.bottom,
      }}
    >
      {/* Home, Explore, Cart */}
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.route;

        return (
          <TouchableOpacity
            key={item.route}
            className="flex-1 items-center justify-center py-3"
            onPress={() => router.push(item.route)}
          >
            <Icon
              size={22}
              strokeWidth={isActive ? 2.5 : 2}
              color={isActive ? theme.accent : theme.secondaryText}
            />

            {item.route === "/cart" && cartQuantity > 0 && (
              <View
                className="absolute right-1/4 top-1 min-h-5 min-w-5 items-center justify-center rounded-full px-1"
                style={{
                  backgroundColor: theme.accent,
                }}
              >
                <Text
                  className="text-[10px] font-bold"
                  style={{
                    color: theme.background,
                  }}
                >
                  {cartQuantity > 99 ? "99+" : cartQuantity}
                </Text>
              </View>
            )}

            <Text
              className="mt-1 text-xs font-medium"
              style={{
                color: isActive ? theme.accent : theme.secondaryText,
              }}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* Login / Profile */}
      <TouchableOpacity
        className="flex-1 items-center justify-center py-3"
        onPress={() => {
          if (isLoggedIn) {
            router.push("/profile");
          } else {
            router.push("/login");
          }
        }}
      >
        <AccountIcon
          size={22}
          strokeWidth={pathname === accountRoute ? 2.5 : 2}
          color={pathname === accountRoute ? theme.accent : theme.secondaryText}
        />

        <Text
          className="mt-1 text-xs font-medium"
          style={{
            color:
              pathname === accountRoute ? theme.accent : theme.secondaryText,
          }}
        >
          {accountLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
