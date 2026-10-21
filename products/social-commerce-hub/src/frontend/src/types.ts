export interface Product {
  id: string;
  merchantId: string;
  storeName: string;
  storeSlug: string;
  title: string;
  price: number;
  originalPrice?: number;
  mediaUrl: string;
  isVideo?: boolean;
  category: 'fashion' | 'leather' | 'accessories' | 'home';
  rating: number;
  reviewCount: number;
  stockQuantity: number;
  isFeatured?: boolean;
}

export interface Merchant {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
  rating: number;
  reviewsCount: number;
  verified: boolean;
  location: string;
  productCount: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type PaymentChannel = 'CashOnDelivery' | 'Fawry' | 'InstaPay' | 'PayPal';

export type SettlementStatus = 
  | 'PendingPayment'
  | 'PendingCollection'
  | 'PendingVerification'
  | 'Settled'
  | 'AwaitingPayment';

export interface PaymentDetails {
  channel: PaymentChannel;
  fawryReferenceNumber?: string;
  fawryExpiryDate?: string;
  senderMobileOrWallet?: string;
  senderReferenceNumber?: string;
  settlementStatus: SettlementStatus | string;
}
