import type { OrderDto } from './api';

const GUEST_ORDERS_KEY = 'social_commerce_guest_orders';
const GUEST_LOYALTY_KEY = 'social_commerce_guest_loyalty_balance';

export const guestSession = {
  getGuestOrders(): OrderDto[] {
    try {
      const data = localStorage.getItem(GUEST_ORDERS_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveGuestOrder(order: OrderDto): void {
    try {
      const current = this.getGuestOrders();
      // Avoid duplicates
      const filtered = current.filter((o) => o.id !== order.id);
      const updated = [order, ...filtered];
      localStorage.setItem(GUEST_ORDERS_KEY, JSON.stringify(updated.slice(0, 30)));
    } catch (e) {
      console.warn('Failed to save guest order:', e);
    }
  },

  getGuestLoyaltyBalance(): number {
    try {
      const val = localStorage.getItem(GUEST_LOYALTY_KEY);
      return val ? parseFloat(val) : 50; // Welcome 50 EGP bonus cashback
    } catch {
      return 50;
    }
  },

  setGuestLoyaltyBalance(balance: number): void {
    try {
      localStorage.setItem(GUEST_LOYALTY_KEY, balance.toString());
    } catch {}
  },

  clearGuestSession(): void {
    try {
      localStorage.removeItem(GUEST_ORDERS_KEY);
    } catch {}
  },
};
