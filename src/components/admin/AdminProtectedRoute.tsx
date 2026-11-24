// ─── Admin Protected Route ────────────────────────────────────────────────────
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/constants';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}

export function AdminProtectedRoute({
  children,
  requireSuperAdmin = false,
}: AdminProtectedRouteProps) {
  const { user, isLoading, isAdmin, isSuperAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#D45D83] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to={ROUTES.ADMIN_LOGIN} replace />;
  }

  if (requireSuperAdmin && !isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">প্রবেশাধিকার নেই</h2>
          <p className="text-gray-500">এই পৃষ্ঠাটি শুধুমাত্র সুপার অ্যাডমিনের জন্য।</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default AdminProtectedRoute;
