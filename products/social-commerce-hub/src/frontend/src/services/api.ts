export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[] | null;
  timestamp: string;
}

export interface FeedItemDto {
  id: string;
  merchantId: string;
  storeName: string;
  storeSlug: string;
  title: string;
  price: number;
  mediaUrl: string;
  isVideo: boolean;
  stockQuantity: number;
  rating: number;
}

export interface MerchantDto {
  id: string;
  storeName: string;
  slug: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

export interface ProductDto {
  id: string;
  merchantId: string;
  title: string;
  price: number;
  mediaUrl: string;
  isVideo: boolean;
  stockQuantity: number;
  createdAt: string;
}

export interface MerchantDetailsDto {
  id: string;
  storeName: string;
  slug: string;
  email: string;
  totalProducts: number;
  totalOrders: number;
  averageRating: number;
  products: ProductDto[];
}

export interface OrderItemDto {
  productId: string;
  productTitle: string;
  unitPrice: number;
  quantity: number;
}

export interface OrderDto {
  id: string;
  merchantId: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  totalAmount: number;
  platformFeeAmount: number;
  merchantNetAmount: number;
  status: string;
  paymentOrderId?: string;
  createdAt: string;
  items: OrderItemDto[];
}

export interface MerchantDashboardDto {
  merchantId: string;
  storeName: string;
  balance: number;
  totalOrdersCount: number;
  totalGrossSales: number;
  totalNetEarnings: number;
  totalPlatformFees: number;
  totalProductsCount: number;
  recentOrders: OrderDto[];
}

export interface MerchantLedgerEntryDto {
  id: string;
  merchantId: string;
  orderId?: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

export interface ReviewDto {
  id: string;
  productId: string;
  orderId: string;
  customerName: string;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export interface CreateOrderRequest {
  merchantId: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  items: { productId: string; quantity: number }[];
}

export interface CaptureOrderResult {
  isSuccess: boolean;
  transactionId: string;
  status: string;
  order?: OrderDto;
  errorMessage?: string;
}

const API_BASE = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options?.headers,
    },
  });

  const payload: ApiResponse<T> = await response.json();

  if (!response.ok || !payload.success) {
    const errorDetails = payload.errors?.join(', ') || payload.message || 'API request failed';
    throw new Error(errorDetails);
  }

  return payload.data;
}

export const api = {
  // Discovery Feed
  async getFeed(page = 1, pageSize = 20): Promise<FeedItemDto[]> {
    return request<FeedItemDto[]>(`/feed?page=${page}&pageSize=${pageSize}`);
  },

  // Merchants & Stores
  async createMerchant(data: { storeName: string; slug: string; email: string }): Promise<MerchantDto> {
    return request<MerchantDto>('/merchants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMerchantBySlug(slug: string): Promise<MerchantDetailsDto> {
    return request<MerchantDetailsDto>(`/merchants/${slug}`);
  },

  async addProduct(merchantId: string, data: {
    title: string;
    price: number;
    mediaUrl: string;
    isVideo?: boolean;
    stockQuantity: number;
  }): Promise<ProductDto> {
    return request<ProductDto>(`/merchants/${merchantId}/products`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMerchantOrders(merchantId: string): Promise<OrderDto[]> {
    return request<OrderDto[]>(`/merchants/${merchantId}/orders`);
  },

  async getMerchantDashboard(merchantId: string): Promise<MerchantDashboardDto> {
    return request<MerchantDashboardDto>(`/merchants/${merchantId}/dashboard`);
  },

  async getMerchantLedger(merchantId: string): Promise<MerchantLedgerEntryDto[]> {
    return request<MerchantLedgerEntryDto[]>(`/merchants/${merchantId}/ledger`);
  },

  // Orders & Checkout
  async createOrder(data: CreateOrderRequest): Promise<OrderDto> {
    return request<OrderDto>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getOrder(id: string): Promise<OrderDto> {
    return request<OrderDto>(`/orders/${id}`);
  },

  async captureOrder(id: string, data: { paymentOrderId: string; payerId: string }): Promise<CaptureOrderResult> {
    return request<CaptureOrderResult>(`/orders/${id}/capture`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateOrderStatus(id: string, status: string): Promise<OrderDto> {
    return request<OrderDto>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // Verified Reviews
  async getReviews(productId: string): Promise<ReviewDto[]> {
    return request<ReviewDto[]>(`/products/${productId}/reviews`);
  },

  async submitReview(productId: string, data: {
    orderId: string;
    customerName: string;
    customerEmail: string;
    rating: number;
    comment: string;
  }): Promise<ReviewDto> {
    return request<ReviewDto>(`/products/${productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
