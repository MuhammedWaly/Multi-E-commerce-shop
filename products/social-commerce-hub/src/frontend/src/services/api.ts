export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[] | null;
  timestamp: string;
}

export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  role: 'Customer' | 'Merchant' | 'Admin';
  merchantId?: string;
  storeSlug?: string;
  isEmailConfirmed?: boolean;
}

export interface UserProfileDto {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  role: string;
  merchantId?: string;
  storeSlug?: string;
  isEmailConfirmed: boolean;
  createdAtUtc: string;
}

export interface UpdateProfileRequest {
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordRequest {
  email: string;
  resetToken: string;
  newPassword: string;
}

export interface ConfirmEmailRequest {
  email: string;
  token: string;
}

export interface AuthResponseDto {
  token: string;
  user: UserDto;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  role?: string;
  storeName?: string;
  storeSlug?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
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

export interface PlatformOverviewDto {
  totalUsersCount: number;
  totalBuyersCount: number;
  totalMerchantsCount: number;
  totalProductsCount: number;
  totalOrdersCount: number;
  totalGrossSales: number;
  totalPlatformRevenue: number;
  totalMerchantDisbursements: number;
}

export interface AdminMerchantDto {
  id: string;
  storeName: string;
  slug: string;
  ownerEmail: string;
  isActive: boolean;
  productsCount: number;
  ordersCount: number;
  totalSales: number;
  createdAtUtc: string;
}

export interface AdminUserDto {
  id: string;
  email: string;
  fullName: string;
  role: string;
  merchantId?: string;
  storeSlug?: string;
  createdAtUtc: string;
}

export interface AdminOrderDto {
  id: string;
  merchantId: string;
  storeName: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  totalAmount: number;
  platformFeeAmount: number;
  merchantNetAmount: number;
  status: string;
  createdAtUtc: string;
}

export interface MediaUploadResponseDto {
  url: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  isVideo: boolean;
}

export interface SearchResultItemDto {
  id: string;
  type: 'Product' | 'Merchant';
  title: string;
  subtitle: string;
  slugOrUrl: string;
  price?: number;
  mediaUrl: string;
  isVideo: boolean;
  matchScore: number;
}

export interface SearchResponseDto {
  query: string;
  isFuzzyMatch: boolean;
  suggestedQuery?: string | null;
  products: SearchResultItemDto[];
  merchants: SearchResultItemDto[];
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
const TOKEN_KEY = 'socialhub_auth_token';
const USER_KEY = 'socialhub_auth_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getStoredUser(): UserDto | null {
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setStoredUser(user: UserDto | null) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const token = getStoredToken();
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...authHeaders,
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
  // Authentication & Profile
  async login(data: LoginRequest): Promise<AuthResponseDto> {
    const res = await request<AuthResponseDto>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setStoredToken(res.token);
    setStoredUser(res.user);
    return res;
  },

  async register(data: RegisterRequest): Promise<AuthResponseDto> {
    const res = await request<AuthResponseDto>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setStoredToken(res.token);
    setStoredUser(res.user);
    return res;
  },

  async getMe(): Promise<UserDto> {
    return request<UserDto>('/auth/me');
  },

  logout() {
    setStoredToken(null);
    setStoredUser(null);
  },

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

  async updateProduct(merchantId: string, productId: string, data: {
    title: string;
    price: number;
    mediaUrl: string;
    isVideo?: boolean;
    stockQuantity: number;
  }): Promise<ProductDto> {
    return request<ProductDto>(`/merchants/${merchantId}/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteProduct(merchantId: string, productId: string): Promise<boolean> {
    return request<boolean>(`/merchants/${merchantId}/products/${productId}`, {
      method: 'DELETE',
    });
  },

  // Smart Ranked & Fuzzy Search
  async search(query: string): Promise<SearchResponseDto> {
    return request<SearchResponseDto>(`/search?q=${encodeURIComponent(query)}`);
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

  async getMyOrders(): Promise<OrderDto[]> {
    return request<OrderDto[]>('/orders/my-orders');
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

  // Platform Admin Command Center
  async getAdminOverview(): Promise<PlatformOverviewDto> {
    return request<PlatformOverviewDto>('/admin/overview');
  },

  async getAdminMerchants(): Promise<AdminMerchantDto[]> {
    return request<AdminMerchantDto[]>('/admin/merchants');
  },

  async updateMerchantStatus(id: string, isActive: boolean): Promise<boolean> {
    return request<boolean>(`/admin/merchants/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  },

  async adminDeleteMerchant(id: string): Promise<boolean> {
    return request<boolean>(`/admin/merchants/${id}`, {
      method: 'DELETE',
    });
  },

  async getAdminUsers(): Promise<AdminUserDto[]> {
    return request<AdminUserDto[]>('/admin/users');
  },

  async getAdminOrders(): Promise<AdminOrderDto[]> {
    return request<AdminOrderDto[]>('/admin/orders');
  },

  async adminDeleteProduct(id: string): Promise<boolean> {
    return request<boolean>(`/admin/products/${id}`, {
      method: 'DELETE',
    });
  },

  // Media Uploads (Images & Videos)
  async uploadMedia(file: File): Promise<MediaUploadResponseDto> {
    const token = getStoredToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/media/upload', {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const payload: ApiResponse<MediaUploadResponseDto> = await response.json();
    if (!response.ok || !payload.success) {
      const errorDetails = payload.errors?.join(', ') || payload.message || 'Media upload failed';
      throw new Error(errorDetails);
    }
    return payload.data;
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

  // User Account Settings & Password Security
  async getProfile(): Promise<UserProfileDto> {
    return request<UserProfileDto>('/account/profile');
  },

  async updateProfile(data: UpdateProfileRequest): Promise<UserProfileDto> {
    return request<UserProfileDto>('/account/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async changePassword(data: ChangePasswordRequest): Promise<{ success: boolean }> {
    return request<{ success: boolean }>('/account/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    return request<{ message: string }>('/account/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(data: ResetPasswordRequest): Promise<{ success: boolean }> {
    return request<{ success: boolean }>('/account/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async confirmEmail(data: ConfirmEmailRequest): Promise<{ success: boolean }> {
    return request<{ success: boolean }>('/account/confirm-email', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async resendConfirmation(email: string): Promise<{ message: string }> {
    return request<{ message: string }>('/account/resend-confirmation', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
};
