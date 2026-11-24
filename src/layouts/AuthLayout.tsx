import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BRAND, ROUTES } from '@/constants';
import { useLanguage } from '@/contexts/LanguageContext';

interface AuthLayoutProps {
  children?: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#FFF8FA] font-bangla">
      {children ?? <Outlet />}
    </div>
  );
};

export default AuthLayout;
