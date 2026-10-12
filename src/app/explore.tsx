import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCallback, useEffect, useRef, useState } from "react";

import PhoneCard from "@/components/phones/PhoneCard";
import PhoneFilters from "@/components/phones/PhoneFilters";
import AppLoader from "@/utils/AppLoader";

import { getPhones, type Phone } from "@/services/phoneService";

import { ShoppingCart } from "lucide-react-native";

import { useFocusEffect, useRouter } from "expo-router";

import { getCart } from "@/services/cartService";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";

export default function ExploreScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  const scrollViewRef = useRef<ScrollView>(null);

  const [phones, setPhones] = useState<Phone[]>([]);
  const [cartQuantity, setCartQuantity] = useState(0);

  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

  const [closeDropdownSignal, setCloseDropdownSignal] = useState(0);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [selectedFilters, setSelectedFilters] = useState({
    brand: "",
    variant: "",
    ram: "",
    rom: "",
    rating: "",
    priceMin: 0,
    priceMax: 0,
    priceChanged: false,
    priceSort: "" as "" | "low-high" | "high-low",
  });

  /*
   * ------------------------------------------------
   * SEARCH DEBOUNCE
   * ------------------------------------------------
   */

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);

    return () => {
      clearTimeout(timer);
    };
  }, [search]);

  /*
   * ------------------------------------------------
   * FETCH PHONES
   * ------------------------------------------------
   */

  useEffect(() => {
    const fetchPhones = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getPhones({
          page: currentPage,
          limit: 6,

          search: debouncedSearch,

          brand: selectedFilters.brand,
          variant: selectedFilters.variant,
          ram: selectedFilters.ram,
          rom: selectedFilters.rom,

          minPrice: selectedFilters.priceChanged
            ? selectedFilters.priceMin
            : undefined,

          maxPrice: selectedFilters.priceChanged
            ? selectedFilters.priceMax
            : undefined,

          minRating: selectedFilters.rating
            ? Number(selectedFilters.rating)
            : undefined,

          priceSort: selectedFilters.priceSort,
        });

        setPhones(response.phones);

        setTotalPages(response.pagination?.totalPages || 0);
      } catch (error) {
        console.error("Explore phones error:", error);

        setError("Failed to load phones");
      } finally {
        setLoading(false);
      }
    };

    fetchPhones();
  }, [
    currentPage,
    debouncedSearch,

    selectedFilters.brand,
    selectedFilters.variant,
    selectedFilters.ram,
    selectedFilters.rom,

    selectedFilters.rating,
    selectedFilters.priceChanged,

    selectedFilters.priceSort,
  ]);

  /*
   * ------------------------------------------------
   * CART QUANTITY
   * ------------------------------------------------
   */

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
            0,
          );

          setCartQuantity(totalQuantity);
        } catch (error) {
          console.error("Explore cart quantity error:", error);

          setCartQuantity(0);
        }
      };

      fetchCartQuantity();
    }, [isLoggedIn]),
  );

  /*
   * ------------------------------------------------
   * SEARCH
   * ------------------------------------------------
   */

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);

    // New search starts from page 1
    setCurrentPage(1);
  }, []);

  /*
   * ------------------------------------------------
   * FILTERS
   * ------------------------------------------------
   */

  const handleFiltersChange = useCallback((filters: any) => {
    setSelectedFilters(filters);

    // New filters start from page 1
    setCurrentPage(1);
  }, []);

  /*
   * ------------------------------------------------
   * CLEAR FILTERS
   * ------------------------------------------------
   */

  const handleClearFilters = useCallback(() => {
    setSearch("");

    setSelectedFilters({
      brand: "",
      variant: "",
      ram: "",
      rom: "",
      rating: "",
      priceMin: 0,
      priceMax: 0,
      priceChanged: false,
      priceSort: "",
    });

    setCurrentPage(1);
  }, []);

  /*
   * ------------------------------------------------
   * CHANGE PAGE
   * ------------------------------------------------
   */

  const changePage = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages) {
        return;
      }

      setCurrentPage(page);

      scrollViewRef.current?.scrollTo({
        y: 0,
        animated: true,
      });
    },
    [totalPages],
  );

  /*
   * ------------------------------------------------
   * UI
   * ------------------------------------------------
   */

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: theme.background,
      }}
    >
      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        contentContainerClassName="px-4 pb-6"
        contentContainerStyle={{
          paddingTop: insets.top + 6,
        }}
      >
        {/* HEADER */}

        <View className="mb-5 flex-row items-center justify-between">
          <Text
            className="text-2xl font-bold"
            style={{
              color: theme.text,
            }}
          >
            Explore Phones
          </Text>

          <TouchableOpacity
            onPress={() => router.push("/cart")}
            className="h-10 w-10 items-center justify-center rounded-full"
            style={{
              backgroundColor: theme.secondary,
            }}
            activeOpacity={0.8}
          >
            <ShoppingCart size={21} color={theme.text} />

            {cartQuantity > 0 && (
              <View
                className="absolute -right-1 -top-1 min-h-5 min-w-5 items-center justify-center rounded-full px-1"
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
          </TouchableOpacity>
        </View>

        {/* FILTERS */}

        <PhoneFilters
          search={search}
          onSearchChange={handleSearchChange}
          onChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          onOpenChange={setFilterDropdownOpen}
          closeDropdownSignal={closeDropdownSignal}
        />

        {/* FILTER OVERLAY */}

        {filterDropdownOpen && (
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {
              setFilterDropdownOpen(false);

              setCloseDropdownSignal((value) => value + 1);
            }}
            className="absolute inset-0"
            style={{
              zIndex: 10,
            }}
          />
        )}

        {/* LOADING */}

        {loading ? (
          <View
            className="items-center justify-center"
            style={{
              minHeight: 520,
            }}
          >
            <ActivityIndicator size="large" color={theme.accent} />

            <Text
              className="mt-3"
              style={{
                color: theme.secondaryText,
              }}
            >
              Loading phones...
            </Text>
          </View>
        ) : error ? (
          /* ERROR */
          <View className="items-center py-10">
            <Text
              className="text-base"
              style={{
                color: theme.secondaryText,
              }}
            >
              {error}
            </Text>
          </View>
        ) : phones.length === 0 ? (
          /* EMPTY */
          <View className="items-center py-10">
            <Text
              className="text-base"
              style={{
                color: theme.secondaryText,
              }}
            >
              No phones found
            </Text>
          </View>
        ) : (
          <>
            {/* PHONE GRID */}

            <View className="flex-row flex-wrap justify-between">
              {phones.map((phone) => (
                <PhoneCard key={phone._id} phone={phone} />
              ))}
            </View>

            {/* PAGINATION */}

            {totalPages > 1 && (
              <View className="mt-8 flex-row items-center justify-center">
                {/* PREVIOUS */}

                <TouchableOpacity
                  disabled={currentPage === 1}
                  onPress={() => changePage(currentPage - 1)}
                  className="rounded-xl border px-4 py-3"
                  style={{
                    backgroundColor: theme.secondary,
                    borderColor: theme.border,
                    opacity: currentPage === 1 ? 0.4 : 1,
                  }}
                >
                  <Text
                    className="font-medium"
                    style={{
                      color: theme.text,
                    }}
                  >
                    Previous
                  </Text>
                </TouchableOpacity>

                {/* PAGE NUMBER */}

                <Text
                  className="mx-4 text-sm"
                  style={{
                    color: theme.secondaryText,
                  }}
                >
                  Page {currentPage} of {totalPages}
                </Text>

                {/* NEXT */}

                <TouchableOpacity
                  disabled={currentPage === totalPages}
                  onPress={() => changePage(currentPage + 1)}
                  className="rounded-xl border px-4 py-3"
                  style={{
                    backgroundColor: theme.secondary,
                    borderColor: theme.border,
                    opacity: currentPage === totalPages ? 0.4 : 1,
                  }}
                >
                  <Text
                    className="font-medium"
                    style={{
                      color: theme.text,
                    }}
                  >
                    Next
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
