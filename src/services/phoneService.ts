import { API_URL } from "@/constants/config";

export type Phone = {
  _id: string;
  name: string;

  price: number;
  discountPercentage?: number;
  discountPrice?: number;
  totalPrice?: number;

  image?: string;
  images?: string[];

  isNewPhone?: boolean;
  quantity: number;

  averageRating?: number;
  ratingCount?: number;

  brand?: unknown;
  variant?: unknown;
  ram?: unknown;
  rom?: unknown;

  colorId?:
    | string
    | {
        _id: string;
        name: string;
      };

  description?: string;
};

export type PhonesResponse = {
  phones: Phone[];
  pagination: {
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

export type PhoneFilterItem = {
  _id: string;
  name?: string;
  value?: string;
  isActive: boolean;
};

export type PhoneFiltersResponse = {
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


function normalizeImageUrl(imageUrl?: string) {
  if (!imageUrl) {
    return imageUrl;
  }

 
  if (imageUrl.startsWith("/")) {
    return API_URL ? `${API_URL}${imageUrl}` : imageUrl;
  }
  
  if (API_URL) {
    try {
      const parsedUrl = new URL(imageUrl);

      if (
        parsedUrl.hostname === "localhost" ||
        parsedUrl.hostname === "127.0.0.1"
      ) {
        return `${API_URL}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
      }
    } catch {
      return imageUrl;
    }
  }

  return imageUrl;
}


export type PhoneQuery = {
  page?: number;
  limit?: number;
  search?: string;
  brand?: string;
  variant?: string;
  ram?: string;
  rom?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  priceSort?: "" | "low-high" | "high-low";
};

export async function getPhones(
  query: PhoneQuery = {},
): Promise<PhonesResponse> {
  const params = new URLSearchParams();

  if (query.page !== undefined) {
    params.set("page", String(query.page));
  }

  if (query.limit !== undefined) {
    params.set("limit", String(query.limit));
  }

  if (query.search?.trim()) {
    params.set("search", query.search.trim());
  }

  if (query.brand) {
    params.set("brand", query.brand);
  }

  if (query.variant) {
    params.set("variant", query.variant);
  }

  if (query.ram) {
    params.set("ram", query.ram);
  }

  if (query.rom) {
    params.set("rom", query.rom);
  }

  if (query.minPrice !== undefined) {
    params.set("minPrice", String(query.minPrice));
  }

  if (query.maxPrice !== undefined) {
    params.set("maxPrice", String(query.maxPrice));
  }

  if (query.minRating !== undefined) {
    params.set("minRating", String(query.minRating));
  }

  if (query.priceSort) {
    params.set("priceSort", query.priceSort);
  }

  const queryString = params.toString();

  const response = await fetch(
    `${API_URL}/api/phones${queryString ? `?${queryString}` : ""}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch phones");
  }

  const data: PhonesResponse = await response.json();

  data.phones = data.phones.map((phone) => ({
    ...phone,
    image: normalizeImageUrl(phone.image),
    images: phone.images
      ?.map(normalizeImageUrl)
      .filter((image): image is string => image !== undefined),
  }));

  return data;
}

export async function getPhoneById(phoneId: string): Promise<Phone> {
  const response = await fetch(`${API_URL}/api/phones/${phoneId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch phone details");
  }

  const data: Phone = await response.json();

  return {
    ...data,
    image: normalizeImageUrl(data.image),
    images: data.images
      ?.map((image) => normalizeImageUrl(image))
      .filter((image): image is string => image !== undefined),
  };
}

export async function getNewPhones(): Promise<PhonesResponse> {
  const response = await fetch(`${API_URL}/api/phones?isNewPhone=true&limit=3`);

  if (!response.ok) {
    throw new Error("Failed to fetch new phones");
  }

  const data: PhonesResponse = await response.json();

  data.phones = data.phones.map((phone) => ({
    ...phone,
    image: normalizeImageUrl(phone.image),
    images: phone.images
      ?.map((image) => normalizeImageUrl(image))
      .filter((image): image is string => image !== undefined),
  }));

  return data;
}

export type PhoneFiltersQuery = {
  brandId?: string;
  variantId?: string;
  ramId?: string;
  romId?: string;
  excludeBrand?: boolean;
};

export async function getPhoneFilters(
  query: PhoneFiltersQuery = {},
): Promise<PhoneFiltersResponse> {
  const params = new URLSearchParams();

  if (query.brandId) {
    params.set("brandId", query.brandId);
  }

  if (query.variantId) {
    params.set("variantId", query.variantId);
  }

  if (query.ramId) {
    params.set("ramId", query.ramId);
  }

  if (query.romId) {
    params.set("romId", query.romId);
  }

  if (query.excludeBrand) {
    params.set("excludeBrand", "true");
  }

  const queryString = params.toString();

  const response = await fetch(
    `${API_URL}/api/phones/filters${queryString ? `?${queryString}` : ""}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch phone filters");
  }

  return response.json();
}
