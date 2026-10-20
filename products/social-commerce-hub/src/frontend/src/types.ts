export interface Product {
  id: string;
  merchantId: string;
  storeName: string;
  storeSlug: string;
  title: string;
  price: number;
  originalPrice?: number;
  mediaUrl: string;
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
