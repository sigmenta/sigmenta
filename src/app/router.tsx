// ─── Women's Favorite — Application Router ───────────────────────────────────

import React, { Suspense, lazy, type ReactNode } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/constants';
import { useAuth } from '@/features/auth/AuthContext';

// ─── Loading Fallback ─────────────────────────────────────────────────────────

import PublicLayout from '@/layouts/PublicLayout';
import LegalPage from '@/pages/public/LegalPage';
import ProductDetailPage from '@/pages/public/ProductDetailPage';

// ─── Auto-retry helper for lazy imports on new deployments ──────────────────

function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await factory();
    } catch (error) {
      console.warn('[Router] Chunk load error, reloading page to fetch latest version...', error);
      window.location.reload();
      return new Promise<{ default: T }>(() => {});
    }
  });
}

// ─── Loading Fallback (Luxury Branded Experience) ────────────────────────────

function LoadingSpinner(): React.JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF8FA] px-4 font-bangla">
      <div className="flex flex-col items-center text-center p-8 bg-white/90 backdrop-blur-md border border-[#F0E2E8] rounded-3xl shadow-sm max-w-xs w-full">
        {/* Brand Logo with Animated Halo */}
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 p-2 flex items-center justify-center shadow-inner">
            <img src="/logo-icon.png" alt="Sigmenta" className="w-full h-full object-contain" />
          </div>
          <div
            className="absolute -inset-2 rounded-[22px] border-2 border-slate-200 border-t-slate-800 animate-spin"
            role="status"
            aria-label="লোড হচ্ছে..."
          />
        </div>
        <h3 className="font-sans font-black text-base text-slate-900 mb-1 tracking-wider">
          Sigmenta™
        </h3>
        <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
          <span>লোড হচ্ছে...</span>
        </p>
      </div>
    </div>
  );
}

function PageLoader(): React.JSX.Element {
  return <LoadingSpinner />;
}

// ─── Layout Lazy Imports ──────────────────────────────────────────────────────

const AdminLayout = lazyWithRetry(() => import('@/layouts/AdminLayout'));
const AuthLayout = lazyWithRetry(() => import('@/layouts/AuthLayout'));

// ─── Public Pages ─────────────────────────────────────────────────────────────

const HomePage = lazyWithRetry(() => import('@/pages/public/HomePage'));
const ProductsPage = lazyWithRetry(() => import('@/pages/public/ProductsPage'));
const CategoryPage = lazyWithRetry(() => import('@/pages/public/CategoryPage'));
const SearchPage = lazyWithRetry(() => import('@/pages/public/SearchPage'));
const CartPage = lazyWithRetry(() => import('@/pages/public/CartPage'));
const WishlistPage = lazyWithRetry(() => import('@/pages/public/WishlistPage'));
const ReviewsPage = lazyWithRetry(() => import('@/pages/public/ReviewsPage'));
const AboutPage = lazyWithRetry(() => import('@/pages/public/AboutPage'));
const ContactPage = lazyWithRetry(() => import('@/pages/public/ContactPage'));
const NotFoundPage = lazyWithRetry(() => import('@/pages/public/NotFoundPage'));


// ─── Auth Pages ───────────────────────────────────────────────────────────────

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));

// ─── Account Pages (protected) ───────────────────────────────────────────────

const CheckoutPage = lazy(() => import('@/pages/account/CheckoutPage'));
const AccountPage = lazy(() => import('@/pages/account/AccountPage'));
const OrdersPage = lazy(() => import('@/pages/account/OrdersPage'));
const OrderDetailPage = lazy(() => import('@/pages/account/OrderDetailPage'));

// ─── Admin Pages ──────────────────────────────────────────────────────────────

const AdminLoginPage = lazy(() => import('@/pages/admin/AdminLoginPage'));
const AdminSetupPage = lazy(() => import('@/pages/admin/AdminSetupPage'));
const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage'));
const AdminProductsPage = lazy(() => import('@/pages/admin/AdminProductsPage'));
const AdminProductFormPage = lazy(() => import('@/pages/admin/AdminProductFormPage'));
const AdminCategoriesPage = lazy(() => import('@/pages/admin/AdminCategoriesPage'));
const AdminOrdersPage = lazy(() => import('@/pages/admin/AdminOrdersPage'));
const AdminOrderDetailPage = lazy(() => import('@/pages/admin/AdminOrderDetailPage'));
const AdminCustomersPage = lazy(() => import('@/pages/admin/AdminCustomersPage'));
const AdminInventoryPage = lazy(() => import('@/pages/admin/AdminInventoryPage'));
const AdminCouponsPage = lazy(() => import('@/pages/admin/AdminCouponsPage'));
const AdminReviewsPage = lazy(() => import('@/pages/admin/AdminReviewsPage'));
const AdminBannersPage = lazy(() => import('@/pages/admin/AdminBannersPage'));
const AdminPaymentsPage = lazy(() => import('@/pages/admin/AdminPaymentsPage'));
const AdminDeliveryPage = lazy(() => import('@/pages/admin/AdminDeliveryPage'));
const AdminLegalPage = lazy(() => import('@/pages/admin/AdminLegalPage'));
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage'));
const AdminRolesPage = lazy(() => import('@/pages/admin/AdminRolesPage'));
const AdminProfilePage = lazy(() => import('@/pages/admin/AdminProfilePage'));

// ─── Protected Route Guards ───────────────────────────────────────────────────

interface GuardProps {
  children: ReactNode;
}

/**
 * Redirects unauthenticated users to /login.
 * Preserves the intended location so we can redirect back after login.
 */
function ProtectedRoute({ children }: GuardProps): React.JSX.Element {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingSpinner />;

  if (!user) {
    return (
      <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
    );
  }

  return <>{children}</>;
}

/**
 * Redirects non-admins to /admin/login.
 * Also handles the case where user is not authenticated at all.
 */
function AdminProtectedRoute({ children }: GuardProps): React.JSX.Element {
  const { user, isLoading, isAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingSpinner />;

  if (!user || !isAdmin) {
    return (
      <Navigate to={ROUTES.ADMIN_LOGIN} state={{ from: location }} replace />
    );
  }

  return <>{children}</>;
}

// ─── Router Component ─────────────────────────────────────────────────────────

export default function AppRouter(): React.JSX.Element {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>

        {/* ── Auth Routes (no layout / AuthLayout) ── */}
        <Route element={<AuthLayout />}>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
          <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        </Route>

        {/* ── Public Routes (PublicLayout) ── */}
        <Route element={<PublicLayout />}>
          <Route path={ROUTES.HOME} element={<HomePage />} />
          <Route path={ROUTES.PRODUCTS} element={<ProductsPage />} />
          <Route path={ROUTES.CATEGORY} element={<CategoryPage />} />
          <Route path={ROUTES.PRODUCT} element={<ProductDetailPage />} />
          <Route path={ROUTES.SEARCH} element={<SearchPage />} />
          <Route path={ROUTES.CART} element={<CartPage />} />
          <Route path={ROUTES.WISHLIST} element={<WishlistPage />} />
          <Route path={ROUTES.REVIEWS} element={<ReviewsPage />} />
          <Route path={ROUTES.ABOUT} element={<AboutPage />} />
          <Route path={ROUTES.CONTACT} element={<ContactPage />} />

          {/* Legal pages share the same component — the key prop forces remount */}
          <Route
            path={ROUTES.PRIVACY_POLICY}
            element={<LegalPage key="privacy-policy" pageKey="privacy-policy" />}
          />
          <Route
            path={ROUTES.TERMS}
            element={<LegalPage key="terms-and-conditions" pageKey="terms-and-conditions" />}
          />
          <Route
            path={ROUTES.REFUND_POLICY}
            element={<LegalPage key="refund-policy" pageKey="refund-policy" />}
          />
          <Route
            path={ROUTES.SHIPPING_POLICY}
            element={<LegalPage key="shipping-policy" pageKey="shipping-policy" />}
          />

          {/* Policy URL aliases (handles space, alternate spelling, or short URLs) */}
          <Route path="/refund" element={<Navigate to={ROUTES.REFUND_POLICY} replace />} />
          <Route path="/refund policy" element={<Navigate to={ROUTES.REFUND_POLICY} replace />} />
          <Route path="/refund%20policy" element={<Navigate to={ROUTES.REFUND_POLICY} replace />} />
          <Route path="/return" element={<Navigate to={ROUTES.REFUND_POLICY} replace />} />
          <Route path="/returns" element={<Navigate to={ROUTES.REFUND_POLICY} replace />} />
          <Route path="/return-policy" element={<Navigate to={ROUTES.REFUND_POLICY} replace />} />
          <Route path="/privacy" element={<Navigate to={ROUTES.PRIVACY_POLICY} replace />} />
          <Route path="/privacy policy" element={<Navigate to={ROUTES.PRIVACY_POLICY} replace />} />
          <Route path="/privacy%20policy" element={<Navigate to={ROUTES.PRIVACY_POLICY} replace />} />
          <Route path="/terms-and-conditions" element={<Navigate to={ROUTES.TERMS} replace />} />
          <Route path="/terms policy" element={<Navigate to={ROUTES.TERMS} replace />} />
          <Route path="/terms%20policy" element={<Navigate to={ROUTES.TERMS} replace />} />
          <Route path="/shipping" element={<Navigate to={ROUTES.SHIPPING_POLICY} replace />} />
          <Route path="/shipping policy" element={<Navigate to={ROUTES.SHIPPING_POLICY} replace />} />
          <Route path="/shipping%20policy" element={<Navigate to={ROUTES.SHIPPING_POLICY} replace />} />
          <Route path="/delivery-policy" element={<Navigate to={ROUTES.SHIPPING_POLICY} replace />} />

          {/* Protected account routes — nested inside PublicLayout */}
          <Route
            path={ROUTES.CHECKOUT}
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.ACCOUNT}
            element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.ACCOUNT_ORDERS}
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.ACCOUNT_ORDER_DETAIL}
            element={
              <ProtectedRoute>
                <OrderDetailPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* ── Admin Login & Setup (no admin layout) ── */}
        <Route path={ROUTES.ADMIN_LOGIN} element={<AdminLoginPage />} />
        <Route path="/admin/setup" element={<AdminSetupPage />} />

        {/* ── Admin Protected Routes (AdminLayout) ── */}
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          }
        >
          {/* Default /admin redirect to dashboard */}
          <Route index element={<Navigate to={ROUTES.ADMIN_DASHBOARD} replace />} />

          <Route
            path={ROUTES.ADMIN_DASHBOARD.replace('/admin/', '')}
            element={<DashboardPage />}
          />
          <Route
            path={ROUTES.ADMIN_PRODUCTS.replace('/admin/', '')}
            element={<AdminProductsPage />}
          />
          <Route
            path={ROUTES.ADMIN_PRODUCT_NEW.replace('/admin/', '')}
            element={<AdminProductFormPage />}
          />
          <Route
            path="products/:id/edit"
            element={<AdminProductFormPage />}
          />
          <Route
            path={ROUTES.ADMIN_CATEGORIES.replace('/admin/', '')}
            element={<AdminCategoriesPage />}
          />
          <Route
            path={ROUTES.ADMIN_ORDERS.replace('/admin/', '')}
            element={<AdminOrdersPage />}
          />
          <Route
            path="orders/:id"
            element={<AdminOrderDetailPage />}
          />
          <Route
            path={ROUTES.ADMIN_CUSTOMERS.replace('/admin/', '')}
            element={<AdminCustomersPage />}
          />
          <Route
            path={ROUTES.ADMIN_INVENTORY.replace('/admin/', '')}
            element={<AdminInventoryPage />}
          />
          <Route
            path={ROUTES.ADMIN_COUPONS.replace('/admin/', '')}
            element={<AdminCouponsPage />}
          />
          <Route
            path={ROUTES.ADMIN_REVIEWS.replace('/admin/', '')}
            element={<AdminReviewsPage />}
          />
          <Route
            path={ROUTES.ADMIN_BANNERS.replace('/admin/', '')}
            element={<AdminBannersPage />}
          />
          <Route
            path={ROUTES.ADMIN_PAYMENTS.replace('/admin/', '')}
            element={<AdminPaymentsPage />}
          />
          <Route
            path={ROUTES.ADMIN_DELIVERY.replace('/admin/', '')}
            element={<AdminDeliveryPage />}
          />
          <Route
            path={ROUTES.ADMIN_LEGAL.replace('/admin/', '')}
            element={<AdminLegalPage />}
          />
          <Route
            path={ROUTES.ADMIN_SETTINGS.replace('/admin/', '')}
            element={<AdminSettingsPage />}
          />
          <Route
            path={ROUTES.ADMIN_ROLES.replace('/admin/', '')}
            element={<AdminRolesPage />}
          />
          <Route
            path={ROUTES.ADMIN_PROFILE.replace('/admin/', '')}
            element={<AdminProfilePage />}
          />
        </Route>

        {/* ── 404 Catch-All ── */}
        <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />

      </Routes>
    </Suspense>
  );
}
