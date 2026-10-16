import { useEffect, useState } from "react";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react-native";
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { API_URL } from "@/constants/config";
import { useTheme } from "@/hooks/use-theme";
import { type PhoneFilterItem } from "@/services/phoneService";

type FilterType =
  "brand" | "variant" | "ram" | "rom" | "rating" | "price" | null;

type FilterResponse = {
  brands: PhoneFilterItem[];
  compatibleBrands: PhoneFilterItem[];
  variants: PhoneFilterItem[];
  rams: PhoneFilterItem[];
  roms: PhoneFilterItem[];
  price: {
    min: number;
    max: number;
  };
};

export type PhoneFilterValues = {
  brand: string;
  variant: string;
  ram: string;
  rom: string;
  rating: string;
  priceMin: number;
  priceMax: number;
  priceChanged: boolean;
  priceSort: "" | "low-high" | "high-low";
};

type PhoneFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onChange: (filters: PhoneFilterValues) => void;
  onClearFilters: () => void;
  onOpenChange?: (isOpen: boolean) => void;
  closeDropdownSignal?: number;
};

const ratingOptions: PhoneFilterItem[] = [
  {
    _id: "5",
    value: "5+",
    isActive: true,
  },
  {
    _id: "4",
    value: "4+",
    isActive: true,
  },
  {
    _id: "3",
    value: "3+",
    isActive: true,
  },
  {
    _id: "2",
    value: "2+",
    isActive: true,
  },
  {
    _id: "1",
    value: "1+",
    isActive: true,
  },
];

export default function PhoneFilters({
  search,
  onSearchChange,
  onChange,
  onClearFilters,
  onOpenChange,
  closeDropdownSignal,
}: PhoneFiltersProps) {
  const { theme } = useTheme();

  /*
   * ------------------------------------------------
   * FILTER UI
   * ------------------------------------------------
   */

  const [showFilters, setShowFilters] = useState(false);

  const [openFilter, setOpenFilter] = useState<FilterType>(null);

  useEffect(() => {
    onOpenChange?.(openFilter !== null);
  }, [openFilter, onOpenChange]);

  useEffect(() => {
    if (closeDropdownSignal !== undefined) {
      setOpenFilter(null);
    }
  }, [closeDropdownSignal]);

  /*
   * ------------------------------------------------
   * FILTER VALUES
   * ------------------------------------------------
   */

  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("");
  const [selectedRam, setSelectedRam] = useState("");
  const [selectedRom, setSelectedRom] = useState("");
  const [selectedRating, setSelectedRating] = useState("");

  /*
   * ------------------------------------------------
   * AUTO SELECTED BRAND
   * ------------------------------------------------
   */

  const [isBrandAutoSelected, setIsBrandAutoSelected] = useState(false);

  /*
   * ------------------------------------------------
   * AVAILABLE FILTER OPTIONS
   * ------------------------------------------------
   */

  const [filters, setFilters] = useState<FilterResponse>({
    brands: [],
    compatibleBrands: [],
    variants: [],
    rams: [],
    roms: [],
    price: {
      min: 0,
      max: 0,
    },
  });

  /*
   * ------------------------------------------------
   * PRICE
   * ------------------------------------------------
   */

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);

  const [priceChanged, setPriceChanged] = useState(false);

  const [priceSort, setPriceSort] = useState<"" | "low-high" | "high-low">("");

  /*
   * ------------------------------------------------
   * SEARCH DEBOUNCE
   * ------------------------------------------------
   */

  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);

    return () => {
      clearTimeout(timer);
    };
  }, [search]);

  useEffect(() => {
    if (!showFilters) return;

    const fetchFilters = async () => {
      try {
        const params = new URLSearchParams();

        if (selectedBrand && !isBrandAutoSelected) {
          params.set("brandId", selectedBrand);
        }

        if (isBrandAutoSelected) {
          params.set("excludeBrand", "true");
        }

        if (selectedVariant) {
          params.set("variantId", selectedVariant);
        }

        if (selectedRam) {
          params.set("ramId", selectedRam);
        }

        if (selectedRom) {
          params.set("romId", selectedRom);
        }

        const queryString = params.toString();

        const response = await fetch(
          `${API_URL}/api/phones/filters${
            queryString ? `?${queryString}` : ""
          }`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch phone filters");
        }

        const data: FilterResponse = await response.json();

        setFilters(data);

        if (
          selectedVariant &&
          !selectedBrand &&
          data.compatibleBrands.length === 1
        ) {
          setSelectedBrand(data.compatibleBrands[0]._id);

          setIsBrandAutoSelected(true);
        }

        /*
         * ------------------------------------------------
         * KEEP SELECTED RAM VALID
         * ------------------------------------------------
         */

        if (data.rams.length === 1) {
          setSelectedRam((current) => {
            if (current === data.rams[0]._id) {
              return current;
            }

            return data.rams[0]._id;
          });
        } else if (
          selectedRam &&
          !data.rams.some((ram) => ram._id === selectedRam)
        ) {
          setSelectedRam("");
        }

        /*
         * ------------------------------------------------
         * KEEP SELECTED ROM VALID
         * ------------------------------------------------
         */

        if (data.roms.length === 1) {
          setSelectedRom((current) => {
            if (current === data.roms[0]._id) {
              return current;
            }

            return data.roms[0]._id;
          });
        } else if (
          selectedRom &&
          !data.roms.some((rom) => rom._id === selectedRom)
        ) {
          setSelectedRom("");
        }

        /*
         * ------------------------------------------------
         * UPDATE PRICE RANGE
         * ------------------------------------------------
         */

        setPriceRange((current) => {
          if (!priceChanged) {
            return [data.price.min, data.price.max];
          }

          return [
            Math.max(current[0], data.price.min),
            Math.min(current[1], data.price.max),
          ];
        });
      } catch (error) {
        console.error("Error fetching phone filters:", error);
      }
    };

    fetchFilters();
  }, [
    showFilters,
    selectedBrand,
    selectedVariant,
    selectedRam,
    selectedRom,
    isBrandAutoSelected,
  ]);

  /*
   * ------------------------------------------------
   * SEND ALL FILTER VALUES TO EXPLORE
   * ------------------------------------------------
   */

  useEffect(() => {
    onChange({
      brand: selectedBrand,
      variant: selectedVariant,
      ram: selectedRam,
      rom: selectedRom,
      rating: selectedRating,
      priceMin: priceRange[0],
      priceMax: priceRange[1],
      priceChanged,
      priceSort,
    });
  }, [
    selectedBrand,
    selectedVariant,
    selectedRam,
    selectedRom,
    selectedRating,
    priceRange,
    priceChanged,
    priceSort,
    onChange,
  ]);

  /*
   * ------------------------------------------------
   * FILTER SELECTION HELPERS
   * ------------------------------------------------
   */

  const handleBrandSelect = (brandId: string) => {
    setSelectedBrand(brandId);

    setIsBrandAutoSelected(false);

    /*
     * Changing brand invalidates the dependent
     * selections.
     */
    setSelectedVariant("");
    setSelectedRam("");
    setSelectedRom("");

    setOpenFilter(null);
  };

  const handleVariantSelect = (variantId: string) => {
    setSelectedVariant(variantId);

    /*
     * Variant can belong to another brand.
     * Let backend determine the compatible brand.
     */
    setSelectedBrand("");
    setIsBrandAutoSelected(false);

    setSelectedRam("");
    setSelectedRom("");

    setOpenFilter(null);
  };

  const handleRamSelect = (ramId: string) => {
    setSelectedRam(selectedRam === ramId ? "" : ramId);

    setOpenFilter(null);
  };

  const handleRomSelect = (romId: string) => {
    setSelectedRom(selectedRom === romId ? "" : romId);

    setOpenFilter(null);
  };

  const handleRatingSelect = (rating: string) => {
    setSelectedRating(selectedRating === rating ? "" : rating);

    setOpenFilter(null);
  };

  /*
   * ------------------------------------------------
   * CLEAR ALL FILTERS
   * ------------------------------------------------
   */

  const handleClear = () => {
    setSelectedBrand("");
    setSelectedVariant("");
    setSelectedRam("");
    setSelectedRom("");
    setSelectedRating("");

    setIsBrandAutoSelected(false);

    setPriceChanged(false);
    setPriceSort("");

    setPriceRange([filters.price.min, filters.price.max]);

    onClearFilters();
  };

  /*
   * ------------------------------------------------
   * ACTIVE FILTER COUNT
   * ------------------------------------------------
   */

  const activeFilterCount = [
    selectedBrand,
    selectedVariant,
    selectedRam,
    selectedRom,
    selectedRating,
    priceChanged ? "price" : "",
    priceSort,
  ].filter(Boolean).length;

  /*
   * ------------------------------------------------
   * GET DISPLAY NAME
   * ------------------------------------------------
   */

  const getItemName = (item: PhoneFilterItem) => {
    return item.name ?? item.value ?? "";
  };

  /*
   * ------------------------------------------------
   * REUSABLE FILTER SECTION
   * ------------------------------------------------
   */

  const renderFilterSection = (
    title: string,
    type: FilterType,
    items: PhoneFilterItem[],
    selectedValue: string,
    onSelect: (value: string) => void,
  ) => {
    const isOpen = openFilter === type;

    return (
      <View
        className="mb-3 w-[48%] rounded-xl border"
        style={{
          position: "relative",
          backgroundColor: theme.background,
          borderColor: theme.border,
          zIndex: isOpen ? 100 : 1,
        }}
      >
        <TouchableOpacity
          onPress={() => {
            setOpenFilter(isOpen ? null : type);
          }}
          className="flex-row items-center justify-between px-4 py-3.5"
          activeOpacity={0.7}
        >
          <View className="flex-row items-center">
            <Text
              className="text-sm font-semibold"
              style={{
                color: theme.text,
              }}
            >
              {title}
            </Text>

            {selectedValue ? (
              <View
                className="ml-2 rounded-full px-2 py-0.5"
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
                  1
                </Text>
              </View>
            ) : null}
          </View>

          <ChevronDown
            size={18}
            color={theme.secondaryText}
            style={{
              transform: [
                {
                  rotate: isOpen ? "180deg" : "0deg",
                },
              ],
            }}
          />
        </TouchableOpacity>

        {isOpen ? (
          <View
            className="absolute left-0 right-0 rounded-xl border"
            style={{
              top: "31%",
              marginTop: 4,
              position: "absolute",
              backgroundColor: theme.background,
              borderColor: theme.border,
              zIndex: 100,
              elevation: 10,
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 4,
              },
              shadowOpacity: 0.15,
              shadowRadius: 8,
            }}
          >
            {items.length === 0 ? (
              <Text
                className="px-4 py-3 text-xs"
                style={{
                  color: theme.secondaryText,
                }}
              >
                No options available
              </Text>
            ) : (
              <View>
                {items.map((item) => {
                  const selected = selectedValue === item._id;

                  return (
                    <TouchableOpacity
                      key={item._id}
                      onPress={() => onSelect(item._id)}
                      className="w-full px-4 py-3"
                      style={{
                        backgroundColor: selected
                          ? theme.accent
                          : theme.background,
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        className="text-sm"
                        style={{
                          color: selected ? theme.background : theme.text,
                        }}
                      >
                        {getItemName(item)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        ) : null}
      </View>
    );
  };

  /*
   * ------------------------------------------------
   * RETURN
   * ------------------------------------------------
   */

  return (
    <View
      className="mb-5"
      style={{
        zIndex: 20,
      }}
    >
      {/* SEARCH */}

      <View className="flex-row items-center">
        <View
          className="mr-2 flex-1 flex-row items-center rounded-xl border px-3"
          style={{
            backgroundColor: theme.secondary,
            borderColor: theme.border,
          }}
        >
          <Search size={19} color={theme.secondaryText} />

          <TextInput
            value={search}
            onChangeText={onSearchChange}
            placeholder="Search phones"
            placeholderTextColor={theme.secondaryText}
            className="ml-2 flex-1 py-3 text-sm"
            style={{
              color: theme.text,
            }}
            returnKeyType="search"
          />

          {search.length > 0 ? (
            <TouchableOpacity
              onPress={() => onSearchChange("")}
              className="h-8 w-8 items-center justify-center"
              activeOpacity={0.7}
            >
              <X size={18} color={theme.secondaryText} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* FILTER BUTTON */}

        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          className="relative h-12 w-12 items-center justify-center rounded-xl border"
          style={{
            backgroundColor: theme.secondary,
            borderColor: theme.border,
          }}
          activeOpacity={0.7}
        >
          <SlidersHorizontal size={20} color={theme.text} />

          {activeFilterCount > 0 ? (
            <View
              className="absolute right-1 top-1 h-4 min-w-4 items-center justify-center rounded-full px-1"
              style={{
                backgroundColor: theme.accent,
              }}
            >
              <Text
                className="text-[9px] font-bold"
                style={{
                  color: theme.background,
                }}
              >
                {activeFilterCount}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      {/* FILTERS */}

      {/* FILTER POPUP */}

      <Modal
        visible={showFilters}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => {
          setShowFilters(false);
          setOpenFilter(null);
        }}
      >
        <View
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <View
            className="rounded-t-3xl pt-5"
            style={{
              backgroundColor: theme.background,
              maxHeight: "85%",
              minHeight: "55%",
            }}
          >
            {/* POPUP HEADER */}

            <View className="mb-4 flex-row items-center justify-between px-5">
              <View>
                <Text
                  className="text-xl font-bold"
                  style={{ color: theme.text }}
                >
                  Filter Phones
                </Text>

                <Text
                  className="mt-1 text-xs"
                  style={{ color: theme.secondaryText }}
                >
                  Find the phone that suits you
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  setShowFilters(false);
                  setOpenFilter(null);
                }}
                className="h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: theme.secondary }}
                activeOpacity={0.7}
              >
                <X size={21} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingBottom: 28,
              }}
            >
              <View className="flex-row flex-wrap items-start justify-between">
          {renderFilterSection(
            "Brand",
            "brand",
            filters.brands,
            selectedBrand,
            handleBrandSelect,
          )}

          {renderFilterSection(
            "Variant",
            "variant",
            filters.variants,
            selectedVariant,
            handleVariantSelect,
          )}

          {renderFilterSection(
            "RAM",
            "ram",
            filters.rams,
            selectedRam,
            handleRamSelect,
          )}

          {renderFilterSection(
            "ROM",
            "rom",
            filters.roms,
            selectedRom,
            handleRomSelect,
          )}

          {renderFilterSection(
            "Rating",
            "rating",
            ratingOptions,
            selectedRating,
            handleRatingSelect,
          )}

          {/* PRICE */}

          <View
            className="mb-3 w-[48%] rounded-xl border"
            style={{
              position: "relative",
              backgroundColor: theme.background,
              borderColor: theme.border,
              zIndex: openFilter === "price" ? 100 : 1,
            }}
          >
            <TouchableOpacity
              onPress={() => {
                setOpenFilter(openFilter === "price" ? null : "price");
              }}
              className="flex-row items-center justify-between px-4 py-3.5"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <Text
                  className="text-sm font-semibold"
                  style={{
                    color: theme.text,
                  }}
                >
                  Price
                </Text>

                {priceChanged || priceSort ? (
                  <View
                    className="ml-2 rounded-full px-2 py-0.5"
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
                      1
                    </Text>
                  </View>
                ) : null}
              </View>

              <ChevronDown
                size={18}
                color={theme.secondaryText}
                style={{
                  transform: [
                    {
                      rotate: openFilter === "price" ? "180deg" : "0deg",
                    },
                  ],
                }}
              />
            </TouchableOpacity>

            {openFilter === "price" ? (
              <View
                className="absolute left-0 right-0 rounded-xl border px-2 py-4"
                style={{
                  top: "30%",
                  marginTop: 4,
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                  zIndex: 100,
                  elevation: 10,
                  shadowColor: "#000",
                  shadowOffset: {
                    width: 0,
                    height: 4,
                  },
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                }}
              >
                {/* SORT */}

                <Text
                  className="mb-2 text-xs font-semibold"
                  style={{
                    color: theme.secondaryText,
                  }}
                >
                  Sort by price
                </Text>

                <View className="flex-row">
                  <TouchableOpacity
                    onPress={() =>
                      setPriceSort(priceSort === "low-high" ? "" : "low-high")
                    }
                    className="mr-2 rounded-lg border px-3 py-2"
                    style={{
                      backgroundColor:
                        priceSort === "low-high"
                          ? theme.accent
                          : theme.secondary,
                      borderColor:
                        priceSort === "low-high" ? theme.accent : theme.border,
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{
                        color:
                          priceSort === "low-high"
                            ? theme.background
                            : theme.text,
                      }}
                    >
                      Low to High
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      setPriceSort(priceSort === "high-low" ? "" : "high-low")
                    }
                    className="rounded-lg border px-3 py-2"
                    style={{
                      backgroundColor:
                        priceSort === "high-low"
                          ? theme.accent
                          : theme.secondary,
                      borderColor:
                        priceSort === "high-low" ? theme.accent : theme.border,
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{
                        color:
                          priceSort === "high-low"
                            ? theme.background
                            : theme.text,
                      }}
                    >
                      High to Low
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* PRICE RANGE */}

                <Text
                  className="mb-2 mt-4 text-xs font-semibold"
                  style={{
                    color: theme.secondaryText,
                  }}
                >
                  Price range
                </Text>

                <View className="flex-row items-center">
                  <TextInput
                    value={String(priceRange[0])}
                    keyboardType="numeric"
                    onChangeText={(value) => {
                      const number = Number(value.replace(/\D/g, ""));

                      setPriceRange([
                        Math.min(number, priceRange[1]),
                        priceRange[1],
                      ]);

                      setPriceChanged(true);
                    }}
                    className="flex-1 rounded-lg border px-3 py-2.5 text-sm"
                    style={{
                      color: theme.text,
                      backgroundColor: theme.secondary,
                      borderColor: theme.border,
                    }}
                    placeholder="Min"
                    placeholderTextColor={theme.secondaryText}
                  />

                  <Text
                    className="mx-2 text-xs"
                    style={{
                      color: theme.secondaryText,
                    }}
                  >
                    to
                  </Text>

                  <TextInput
                    value={String(priceRange[1])}
                    keyboardType="numeric"
                    onChangeText={(value) => {
                      const number = Number(value.replace(/\D/g, ""));

                      setPriceRange([
                        priceRange[0],
                        Math.max(number, priceRange[0]),
                      ]);

                      setPriceChanged(true);
                    }}
                    className="flex-1 rounded-lg border px-3 py-2.5 text-sm"
                    style={{
                      color: theme.text,
                      backgroundColor: theme.secondary,
                      borderColor: theme.border,
                    }}
                    placeholder="Max"
                    placeholderTextColor={theme.secondaryText}
                  />
                </View>

                <Text
                  className="mt-2 text-[11px]"
                  style={{
                    color: theme.secondaryText,
                  }}
                >
                  Available: ₹{filters.price.min.toLocaleString("en-IN")} - ₹
                  {filters.price.max.toLocaleString("en-IN")}
                </Text>
              </View>
            ) : null}
          </View>

          {/* CLEAR */}

          {activeFilterCount > 0 ? (
            <TouchableOpacity
              onPress={handleClear}
              className="items-center rounded-xl border py-3"
              style={{
                backgroundColor: theme.secondary,
                borderColor: theme.border,
              }}
              activeOpacity={0.7}
            >
              <Text
                className="text-sm font-semibold"
                style={{
                  color: theme.accent,
                }}
              >
                Clear Filters
              </Text>
            </TouchableOpacity>
          ) : null}
                  
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
