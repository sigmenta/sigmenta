// ─── Admin Layout ─────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingBag, Users, Tag, Star,
  Image, Truck, CreditCard, FileText, Settings, Shield,
  User, LogOut, ChevronLeft, ChevronRight, Menu, X,
  AlertTriangle, BarChart3
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { ROUTES, BRAND } from '@/constants';
import { settingsService, getLocalSettings } from '@/services/settingsService';
import toast from 'react-hot-toast';
import type { SiteTheme } from '@/types';


interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  superAdminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: 'ড্যাশবোর্ড', href: ROUTES.ADMIN_DASHBOARD, icon: <LayoutDashboard size={18} /> },
  { label: 'পণ্য', href: ROUTES.ADMIN_PRODUCTS, icon: <Package size={18} /> },
  { label: 'ক্যাটাগরি', href: ROUTES.ADMIN_CATEGORIES, icon: <Tag size={18} /> },
  { label: 'ইনভেন্টরি', href: ROUTES.ADMIN_INVENTORY, icon: <BarChart3 size={18} /> },
  { label: 'অর্ডার', href: ROUTES.ADMIN_ORDERS, icon: <ShoppingBag size={18} /> },
  { label: 'কাস্টমার', href: ROUTES.ADMIN_CUSTOMERS, icon: <Users size={18} /> },
  { label: 'কুপন', href: ROUTES.ADMIN_COUPONS, icon: <Tag size={18} /> },
  { label: 'রিভিউ', href: ROUTES.ADMIN_REVIEWS, icon: <Star size={18} /> },
  { label: 'ব্যানার', href: ROUTES.ADMIN_BANNERS, icon: <Image size={18} /> },
  { label: 'ডেলিভারি', href: ROUTES.ADMIN_DELIVERY, icon: <Truck size={18} /> },
  { label: 'পেমেন্ট', href: ROUTES.ADMIN_PAYMENTS, icon: <CreditCard size={18} /> },
  { label: 'আইনি পাতা', href: ROUTES.ADMIN_LEGAL, icon: <FileText size={18} /> },
  { label: 'সেটিংস', href: ROUTES.ADMIN_SETTINGS, icon: <Settings size={18} /> },
  { label: 'রোল ম্যানেজার', href: ROUTES.ADMIN_ROLES, icon: <Shield size={18} />, superAdminOnly: true },
];

interface AdminLayoutProps {
  children?: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isSuperAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [siteSettings, setSiteSettings] = useState(getLocalSettings());
  const [adminTheme, setAdminTheme] = useState<SiteTheme>('unisex');

  useEffect(() => {
    let isMounted = true;
    const update = () => {
      const s = getLocalSettings();
      setSiteSettings(s);
      if (s?.theme) setAdminTheme(s.theme as SiteTheme);
    };
    update();
    window.addEventListener('wf_settings_updated', update);
    settingsService.getSiteSettings().then((d) => {
      if (isMounted && d) {
        setSiteSettings(d);
        if (d.theme) setAdminTheme(d.theme as SiteTheme);
      }
    }).catch(() => {});
    return () => {
      isMounted = false;
      window.removeEventListener('wf_settings_updated', update);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('লগআউট সফল হয়েছে');
      navigate(ROUTES.ADMIN_LOGIN);
    } catch {
      toast.error('লগআউট ব্যর্থ হয়েছে');
    }
  };

  const isActive = (href: string) => {
    if (href === ROUTES.ADMIN_DASHBOARD) return location.pathname === href;
    return location.pathname.startsWith(href);
  };

  const filteredNavItems = navItems.filter(
    (item) => !item.superAdminOnly || isSuperAdmin
  );


  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 ${collapsed ? 'justify-center' : ''}`}>
        {collapsed ? (
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-black border border-neutral-800 flex items-center justify-center p-0.5">
            <img
              src={siteSettings?.logoUrl || '/logo-icon.png'}
              alt="Sigmenta"
              onError={(e) => { (e.target as HTMLImageElement).src = '/logo-icon.png'; }}
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-black border border-neutral-800 flex items-center justify-center p-0.5 flex-shrink-0">
                <img
                  src={siteSettings?.logoUrl || '/logo-icon.png'}
                  alt={siteSettings?.siteName || BRAND.name}
                  onError={(e) => { (e.target as HTMLImageElement).src = '/logo-icon.png'; }}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="overflow-hidden">
                <p className="font-sans font-black text-neutral-900 text-sm leading-tight truncate tracking-wide">
                  {siteSettings?.siteName || BRAND.name}™
                </p>
                <p className="text-[10px] text-neutral-500 font-extrabold tracking-wider uppercase truncate">
                  {siteSettings?.tagline || BRAND.tagline}
                </p>
              </div>
            </div>
            <span className="text-[10px] bg-neutral-900 text-white font-bold px-1.5 py-0.5 rounded">
              ADMIN
            </span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {filteredNavItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isActive(item.href)
                ? 'bg-[#D45D83] text-white shadow-sm'
                : 'text-gray-600 hover:bg-pink-50 hover:text-[#D45D83]'
            } ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? item.label : undefined}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-100 p-2 space-y-0.5">
        <Link
          to={ROUTES.ADMIN_PROFILE}
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-pink-50 hover:text-[#D45D83] transition-all ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'প্রোফাইল' : undefined}
        >
          <User size={18} className="flex-shrink-0" />
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="truncate text-xs font-semibold">{user?.displayName || 'Admin'}</p>
              <p className="truncate text-xs text-gray-400">{user?.email}</p>
            </div>
          )}
        </Link>
        <button
          onClick={handleSignOut}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-all ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'লগআউট' : undefined}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>লগআউট</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex" data-admin-theme={adminTheme}>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-gray-100 shadow-sm transition-all duration-200 flex-shrink-0 ${
          collapsed ? 'w-16' : 'w-56'
        }`}
      >
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-16 -right-3 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 z-10"
          style={{ position: 'fixed', left: collapsed ? '52px' : '212px', transition: 'left 0.2s' }}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 shadow-xl transform transition-transform md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-3 right-3 p-1 hover:bg-gray-100 rounded-lg"
        >
          <X size={18} />
        </button>
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 hover:bg-gray-100 rounded-lg"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#D45D83] rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">WF</span>
            </div>
            <span className="font-semibold text-sm text-[#292329]">অ্যাডমিন</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;

// ─── Exported Admin Helpers ──────────────────────────────────────────────────

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[#292329]">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2.5 flex-wrap">{actions}</div>}
    </div>
  );
}

export interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  color?: string;
  subtext?: string;
  urgent?: boolean;
}

export function MetricCard({ label, value, icon, color = '#D45D83', subtext, urgent }: MetricCardProps) {
  return (
    <div className={`bg-white rounded-xl p-4 md:p-5 border shadow-sm hover:shadow-md transition-shadow ${
      urgent ? 'border-red-200 ring-1 ring-red-100 bg-red-50/20' : 'border-gray-100'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs md:text-sm font-medium ${urgent ? 'text-red-700 font-semibold' : 'text-gray-500'}`}>
          {label}
        </span>
        {icon && (
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${color}15`, color }}
          >
            {icon}
          </div>
        )}
      </div>
      <div className={`text-lg md:text-2xl font-bold tracking-tight ${urgent ? 'text-red-700' : 'text-[#292329]'}`}>
        {value}
      </div>
      {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
    </div>
  );
}

export interface TableSkeletonProps {
  rows?: number;
  cols?: number;
}

export function TableSkeleton({ rows = 5, cols = 4 }: TableSkeletonProps) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="h-9 bg-gray-100 rounded flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export interface StatusBadgeProps {
  label: string;
  className?: string;
}

export function StatusBadge({ label, className = 'bg-gray-100 text-gray-700' }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'নিশ্চিত করুন',
  cancelLabel = 'বাতিল',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
        <h3 className="text-lg font-bold text-[#292329] mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">{message}</p>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'প্রক্রিয়াকরণ হচ্ছে...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
