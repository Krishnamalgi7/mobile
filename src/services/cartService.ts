import { API_URL } from "@/constants/config";
import { getToken } from "@/services/authService";

function normalizeImageUrl(imageUrl?: string) {
  if (!imageUrl) {
    return imageUrl;
  }

  if (API_URL && imageUrl.startsWith(`${API_URL}/`)) {
    return imageUrl;
  }

  if (imageUrl.startsWith("/")) {
    return `${API_URL}${imageUrl}`;
  }

  return imageUrl;
}

export type CartPhone = {
  _id: string;
  name: string;
  price: number;
  discountPercentage?: number;
  discountPrice?: number;
  totalPrice?: number;
  image?: string;
  images?: string[];
  brand?: unknown;
  variant?: unknown;
  ram?: unknown;
  rom?: unknown;
  quantity: number;
  isActive: boolean;
};

export type CartItem = {
  phoneId: CartPhone;
  quantity: number;
};

export type Cart = {
  items: CartItem[];
};

const getAuthHeaders = async () => {
  const token = await getToken();

  if (!token) {
    throw new Error("Please login to continue");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const getCart = async (): Promise<Cart> => {
  const response = await fetch(`${API_URL}/api/cart/get-cart`, {
    method: "GET",
    headers: await getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch cart");
  }

  return {
    ...data.cart,
    items: data.cart.items.map((item: CartItem) => ({
      ...item,
      phoneId: {
        ...item.phoneId,
        image: normalizeImageUrl(item.phoneId.image),
        images: item.phoneId.images
          ?.map(normalizeImageUrl)
          .filter((image): image is string => image !== undefined),
      },
    })),
  };
};

const cartListeners = new Set<() => void>();

export const subscribeToCartChanges = (listener: () => void) => {
  cartListeners.add(listener);

  return () => {
    cartListeners.delete(listener);
  };
};

const notifyCartChanged = () => {
  cartListeners.forEach((listener) => listener());
};

export const addToCart = async (phoneId: string, quantity?: number) => {
  const response = await fetch(`${API_URL}/api/cart/add`, {
    method: "POST",
    headers: await getAuthHeaders(),
    body: JSON.stringify({
      phoneId,
      ...(quantity !== undefined ? { quantity } : {}),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to add phone to cart");
  }
  notifyCartChanged();
  return data.cart;
};

export const updateCartQuantity = async (phoneId: string, quantity: number) => {
  const response = await fetch(`${API_URL}/api/cart/update-quantity`, {
    method: "PATCH",
    headers: await getAuthHeaders(),
    body: JSON.stringify({
      phoneId,
      quantity,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update cart quantity");
  }

  notifyCartChanged();
  return data.cart;
};

export const removeFromCart = async (phoneId: string) => {
  const response = await fetch(`${API_URL}/api/cart/remove-from-cart`, {
    method: "DELETE",
    headers: await getAuthHeaders(),
    body: JSON.stringify({ phoneId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to remove phone from cart");
  }

  notifyCartChanged();
  return data.cart;
};

export const createCustomerInvoice = async () => {
  const response = await fetch(
    `${API_URL}/api/invoices/create-customer-invoice`,
    {
      method: "POST",
      headers: await getAuthHeaders(),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create invoice");
  }

  notifyCartChanged();

  return data.invoice;
};
