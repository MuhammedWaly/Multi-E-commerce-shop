import React, { useState, useEffect } from 'react';
import {
  api,
  type PlatformOverviewDto,
  type AdminMerchantDto,
  type AdminUserDto,
  type AdminOrderDto,
  type UserDto
} from '../services/api';
import type { Product } from '../types';

interface AdminPortalProps {
  currentUser: UserDto | null;
  onOpenAuthModal: () => void;
  products: Product[];
  onProductDeleted?: (id: string) => void;
  onMerchantDeleted?: (id: string) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  currentUser,
  onOpenAuthModal,
  products,
  onProductDeleted,
  onMerchantDeleted
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'merchants' | 'orders' | 'users' | 'moderation'>('overview');
  const [overview, setOverview] = useState<PlatformOverviewDto | null>(null);
  const [merchants, setMerchants] = useState<AdminMerchantDto[]>([]);
  const [orders, setOrders] = useState<AdminOrderDto[]>([]);
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isAdmin = currentUser?.role === 'Admin';

  const loadData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    setStatusMessage(null);
    try {
      const [overviewData, merchantsData, ordersData, usersData] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminMerchants(),
        api.getAdminOrders(),
        api.getAdminUsers()
      ]);
      setOverview(overviewData);
      setMerchants(merchantsData);
      setOrders(ordersData);
      setUsers(usersData);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to load platform administrator data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const handleToggleMerchantStatus = async (merchantId: string, currentActive: boolean) => {
    setActionLoading(`merchant-${merchantId}`);
    try {
      await api.updateMerchantStatus(merchantId, !currentActive);
      setMerchants(prev =>
        prev.map(m => (m.id === merchantId ? { ...m, isActive: !currentActive } : m))
      );
      setStatusMessage({
        type: 'success',
        text: `Store status successfully updated to ${!currentActive ? 'Active' : 'Suspended'}.`
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update store status.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteMerchant = async (merchantId: string, storeName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete store "${storeName}" and all its catalog products?`)) {
      return;
    }
    setActionLoading(`delete-merchant-${merchantId}`);
    try {
      await api.adminDeleteMerchant(merchantId);
      setMerchants(prev => prev.filter(m => m.id !== merchantId));
      if (onMerchantDeleted) {
        onMerchantDeleted(merchantId);
      }
      setStatusMessage({
        type: 'success',
        text: `Store "${storeName}" was permanently removed by platform administrator.`
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to delete store.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteProduct = async (productId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to remove violating product "${title}" from the platform?`)) {
      return;
    }
    setActionLoading(`product-${productId}`);
    try {
      await api.adminDeleteProduct(productId);
      if (onProductDeleted) {
        onProductDeleted(productId);
      }
      setStatusMessage({
        type: 'success',
        text: `Product "${title}" was permanently removed by administrator moderation.`
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to moderate product listing.' });
    } finally {
      setActionLoading(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <div className="bg-slate-900 border border-red-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border border-red-500/30">
            🛡️
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Platform Administration Access Required</h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
            You must be signed in with an authorized <span className="text-indigo-400 font-bold">Admin</span> role to access platform overview metrics, multi-store moderation, and fee ledger management.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onOpenAuthModal}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              Sign In as Administrator
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                🛡️ Platform Command Center
              </span>
              <span className="text-xs text-slate-400 font-mono">Role: {currentUser.role}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              SocialHub Administration & Governance
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Platform-wide GMV analytics, multi-tenant store moderation, and user security control.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className={loading ? 'animate-spin' : ''}>🔄</span>
              <span>{loading ? 'Refreshing...' : 'Refresh Metrics'}</span>
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className={`mt-4 p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/20 border border-rose-500/30 text-rose-300'
          }`}>
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)} className="ml-2 hover:opacity-75 cursor-pointer">✕</button>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: '📊 Platform Metrics', count: null },
          { id: 'merchants', label: '🏬 Stores Management', count: merchants.length },
          { id: 'orders', label: '📦 All Platform Orders', count: orders.length },
          { id: 'users', label: '👥 User Directory', count: users.length },
          { id: 'moderation', label: '🛡️ Content Moderation', count: products.length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== null && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-800 text-slate-400'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: Overview Metrics */}
      {activeTab === 'overview' && overview && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* GMV */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Gross Merchandise Volume (GMV)
              </div>
              <div className="text-2xl font-black text-white">
                {overview.totalGrossSales.toLocaleString()} <span className="text-sm font-normal text-indigo-400">EGP</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Total platform volume across all stores</p>
            </div>

            {/* Platform Revenue (5% Fee) */}
            <div className="bg-gradient-to-br from-indigo-950/80 to-purple-950/80 border border-indigo-500/40 rounded-2xl p-5 shadow-lg">
              <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Platform Commission</span>
                <span className="text-[10px] bg-indigo-500/20 px-2 py-0.5 rounded-full text-indigo-300 font-bold border border-indigo-500/30">
                  5.0% Fixed Take-Rate
                </span>
              </div>
              <div className="text-2xl font-black text-indigo-200">
                {overview.totalPlatformRevenue.toLocaleString()} <span className="text-sm font-normal text-indigo-300">EGP</span>
              </div>
              <p className="text-[11px] text-indigo-300/70 mt-2">SocialHub earned platform commission</p>
            </div>

            {/* Merchant Disbursements */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Net Merchant Disbursements
              </div>
              <div className="text-2xl font-black text-emerald-400">
                {overview.totalMerchantDisbursements.toLocaleString()} <span className="text-sm font-normal text-emerald-500">EGP</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Disbursed net earnings to boutique owners</p>
            </div>

            {/* Active Merchants & Orders */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Platform Activity
              </div>
              <div className="flex items-baseline gap-3">
                <div>
                  <span className="text-2xl font-black text-white">{overview.totalMerchantsCount}</span>
                  <span className="text-xs text-slate-400 ml-1">Stores</span>
                </div>
                <span className="text-slate-600">•</span>
                <div>
                  <span className="text-2xl font-black text-white">{overview.totalOrdersCount}</span>
                  <span className="text-xs text-slate-400 ml-1">Orders</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {overview.totalProductsCount} products listed • {overview.totalUsersCount} registered users
              </p>
            </div>
          </div>

          {/* Quick Platform Status Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Platform Architecture & Identity Health
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 font-mono block mb-1">Authentication Layer</span>
                <span className="font-bold text-white">ASP.NET Core JWT Bearer</span>
                <p className="text-slate-400 mt-1">PBKDF2 SHA-256 (100,000 iterations) with cryptographic salt</p>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 font-mono block mb-1">Multi-Tenancy Guard</span>
                <span className="font-bold text-emerald-400">Strict Tenant Isolation Active</span>
                <p className="text-slate-400 mt-1">Cross-store dashboard and ledger requests return 403 Forbidden</p>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 font-mono block mb-1">Payment Engine</span>
                <span className="font-bold text-indigo-400">Dynamic Split (95% / 5%)</span>
                <p className="text-slate-400 mt-1">Automated ledger double-entry credits per completed order</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Stores Management */}
      {activeTab === 'merchants' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Registered Boutiques & Stores ({merchants.length})</h3>
            <span className="text-xs text-slate-400">Toggle merchant status to suspend or reinstate storefronts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Store Name</th>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4">Owner Email</th>
                  <th className="py-3 px-4">Products</th>
                  <th className="py-3 px-4">Orders</th>
                  <th className="py-3 px-4">Total Sales</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {merchants.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-bold">
                        {m.storeName.charAt(0)}
                      </div>
                      <span>{m.storeName}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">/{m.slug}</td>
                    <td className="py-3 px-4 text-slate-300">{m.ownerEmail}</td>
                    <td className="py-3 px-4">{m.productsCount}</td>
                    <td className="py-3 px-4">{m.ordersCount}</td>
                    <td className="py-3 px-4 font-bold text-white">{m.totalSales.toLocaleString()} EGP</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        m.isActive
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {m.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleMerchantStatus(m.id, m.isActive)}
                          disabled={actionLoading === `merchant-${m.id}` || actionLoading === `delete-merchant-${m.id}`}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            m.isActive
                              ? 'bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30'
                              : 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30'
                          }`}
                        >
                          {actionLoading === `merchant-${m.id}`
                            ? 'Updating...'
                            : m.isActive
                            ? 'Suspend'
                            : 'Reactivate'}
                        </button>
                        <button
                          onClick={() => handleDeleteMerchant(m.id, m.storeName)}
                          disabled={actionLoading === `merchant-${m.id}` || actionLoading === `delete-merchant-${m.id}`}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 transition-all cursor-pointer"
                          title="Permanently remove store"
                        >
                          {actionLoading === `delete-merchant-${m.id}` ? '...' : '🗑️'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Platform Orders */}
      {activeTab === 'orders' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Platform-Wide Orders Ledger ({orders.length})</h3>
            <span className="text-xs text-slate-400">All customer transactions with automated 5% fee split</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Store</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Gross Total</th>
                  <th className="py-3 px-4 text-indigo-400">Platform Fee (5%)</th>
                  <th className="py-3 px-4 text-emerald-400">Merchant Net (95%)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400">#{o.id.slice(0, 8)}</td>
                    <td className="py-3 px-4 font-semibold text-white">{o.storeName}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200">{o.customerName}</div>
                      <div className="text-[10px] text-slate-400">{o.customerEmail}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-white">{o.totalAmount.toLocaleString()} EGP</td>
                    <td className="py-3 px-4 font-bold text-indigo-400">+{o.platformFeeAmount.toLocaleString()} EGP</td>
                    <td className="py-3 px-4 font-bold text-emerald-400">{o.merchantNetAmount.toLocaleString()} EGP</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        o.status === 'Paid' || o.status === 'Fulfilled'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(o.createdAtUtc).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: User Directory */}
      {activeTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Registered User Accounts ({users.length})</h3>
            <span className="text-xs text-slate-400">Role-Based Access Control (RBAC) Directory</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Associated Store</th>
                  <th className="py-3 px-4">Registration Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs">
                        {u.fullName.charAt(0)}
                      </div>
                      <span>{u.fullName}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'Admin'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : u.role === 'Merchant'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {u.storeSlug ? `/${u.storeSlug}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(u.createdAtUtc).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Content & Catalog Moderation */}
      {activeTab === 'moderation' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Product Catalog Moderation Queue</h3>
              <p className="text-xs text-slate-400">Review products published across all stores and moderate non-compliant listings</p>
            </div>
            <span className="text-xs text-indigo-400 font-bold bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30">
              {products.length} Active Listings
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="flex gap-3 p-3">
                  <img
                    src={p.mediaUrl}
                    alt={p.title}
                    className="w-16 h-16 object-cover rounded-lg bg-slate-900 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block truncate">
                      {p.storeName}
                    </span>
                    <h4 className="text-xs font-bold text-white truncate">{p.title}</h4>
                    <p className="text-xs font-bold text-emerald-400 mt-1">{p.price.toLocaleString()} EGP</p>
                    <span className="text-[10px] text-slate-500">Stock: {p.stockQuantity} units</span>
                  </div>
                </div>

                <div className="bg-slate-900/60 p-2.5 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Rating: ⭐ {p.rating}</span>
                  <button
                    onClick={() => handleDeleteProduct(p.id, p.title)}
                    disabled={actionLoading === `product-${p.id}`}
                    className="px-2.5 py-1 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white rounded-lg text-xs font-bold border border-red-500/30 transition-all cursor-pointer"
                  >
                    {actionLoading === `product-${p.id}` ? 'Removing...' : '🗑️ Remove Listing'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
