import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Home, ShoppingBag, ArrowLeft } from 'lucide-react';
import { BRAND, ROUTES } from '@/constants';
import { useLanguage } from '@/contexts/LanguageContext';

export const NotFoundPage: React.FC = () => {
  const { t, isBangla } = useLanguage();

  return (
    <>
      <Helmet>
        <title>{`৪০৪ — পৃষ্ঠা পাওয়া যায়নি | ${BRAND.nameBn}`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 font-bangla">
        <div className="max-w-md w-full text-center bg-white border border-[#F0E2E8] rounded-3xl p-8 md:p-12 shadow-sm">
          {/* 404 Badge */}
          <div className="inline-block px-4 py-1.5 bg-[#FFF0F5] border border-[#F0E2E8] text-[#D45D83] font-bold text-sm rounded-full mb-4">
            ত্রুটি ৪০৪
          </div>

          <h1 className="text-6xl md:text-7xl font-display font-extrabold text-[#D45D83] tracking-tight mb-4">
            404
          </h1>

          <h2 className="text-xl md:text-2xl font-bold text-[#292329] mb-2">
            {t('page.not_found')}
          </h2>

          <p className="text-xs md:text-sm text-[#77717A] leading-relaxed mb-8">
            {isBangla
              ? 'আপনি যে পৃষ্ঠাটি খুঁজছেন তা সরানো হয়েছে বা লিংকটি সঠিক নয়।'
              : 'The page you are looking for does not exist or has been moved.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={ROUTES.HOME}
              className="w-full sm:w-auto px-6 py-3 bg-[#D45D83] hover:bg-[#B8446C] text-white font-bold rounded-2xl text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Home className="w-4 h-4" />
              <span>{t('nav.home')}</span>
            </Link>

            <Link
              to={ROUTES.PRODUCTS}
              className="w-full sm:w-auto px-6 py-3 bg-[#FFF0F5] hover:bg-[#F7C8D5] text-[#D45D83] font-bold rounded-2xl text-xs transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{t('nav.products')}</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFoundPage;
