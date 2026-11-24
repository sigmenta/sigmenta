import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, Heart, ShoppingBag, User as UserIcon, Menu, X,
  ChevronDown, Phone, ShieldCheck, LogOut, Package
} from 'lucide-react';
import { BRAND, ROUTES } from '@/constants';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/features/auth/AuthContext';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { categoryService } from '@/services/categoryService';
import { settingsService, getLocalSettings } from '@/services/settingsService';
import type { Category } from '@/types';


export const Header: React.FC = () => {
  const { language, setLanguage, t, isBangla } = useLanguage();
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const cartItemCount = useCartStore((state) => state.getItemCount());
  const wishlistItemCount = useWishlistStore((state) => state.getItemCount());

  const [categories, setCategories] = useState<Category[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  const [siteSettings, setSiteSettings] = useState(getLocalSettings());
  const dropdownRef = useRef<HTMLDivElement>(null);


  // Load and listen to live site settings (logo, name, etc.)
  useEffect(() => {
    let isMounted = true;
    const updateFromLocal = () => {
      setSiteSettings(getLocalSettings());
    };

    updateFromLocal();
    window.addEventListener('wf_settings_updated', updateFromLocal);

    settingsService.getSiteSettings()
      .then((data) => {
        if (isMounted && data) setSiteSettings(data);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
      window.removeEventListener('wf_settings_updated', updateFromLocal);
    };
  }, []);

  // Load categories for navigation dropdown
  useEffect(() => {
    let isMounted = true;
    categoryService.getCategories(true)
      .then((data: Category[]) => {
        if (isMounted) setCategories(data);
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  // Handle scroll shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
        setCategoriesDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`${ROUTES.SEARCH}?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setUserDropdownOpen(false);
      navigate(ROUTES.HOME);
    } catch {
      // handled in context
    }
  };

  return (
    <header className="sticky top-0 z-header w-full bg-white transition-shadow duration-300">
      {/* Top utility bar */}
      <div className="bg-[#FFF0F5] border-b border-[#F0E2E8] py-1.5 px-4 text-xs text-[#77717A] hidden md:block">
        <div className="max-w-content mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium text-[#D45D83]">
              <Phone className="w-3.5 h-3.5" />
              <span>{BRAND.phone}</span>
            </span>
            <span>|</span>
            <span>{isBangla ? 'সারা বাংলাদেশে ক্যাশ অন ডেলিভারি' : 'Cash on Delivery all over Bangladesh'}</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Language toggle */}

            <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-full border border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setLanguage('bn')}
                className={`px-1.5 py-0.5 text-xs rounded transition-colors ${
                  isBangla ? 'bg-[var(--color-primary)] text-white font-medium' : 'text-[#77717A] hover:text-[var(--color-primary)]'
                }`}
              >
                বাং
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-1.5 py-0.5 text-xs rounded transition-colors ${
                  !isBangla ? 'bg-[var(--color-primary)] text-white font-medium' : 'text-[#77717A] hover:text-[var(--color-primary)]'
                }`}
              >
                EN
              </button>
            </div>
            {isAdmin && (
              <Link
                to={ROUTES.ADMIN_DASHBOARD}
                className="inline-flex items-center gap-1 text-[var(--color-primary)] font-semibold hover:underline"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isBangla ? 'অ্যাডমিন ড্যাশবোর্ড' : 'Admin'}</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main navigation header */}
      <div className={`px-4 transition-all duration-300 ${isScrolled ? 'py-2.5 shadow-header' : 'py-3.5'}`}>
        <div className="max-w-content mx-auto flex items-center justify-between gap-4">
          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 text-[#292329] hover:text-[#D45D83] rounded-lg focus:outline-none"
            aria-label="মেনু খুলুন"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Brand Logo */}
          <Link to={ROUTES.HOME} className="flex items-center gap-2.5 sm:gap-3 group flex-shrink-0 py-0.5">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-black border border-neutral-800 p-1 flex items-center justify-center shadow-xs group-hover:border-neutral-500 transition-all flex-shrink-0 overflow-hidden">
              <img
                src={siteSettings?.logoUrl || '/logo-icon.png'}
                alt={siteSettings?.siteName || BRAND.name}
                onError={(e) => { (e.target as HTMLImageElement).src = '/logo-icon.png'; }}
                className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-sans font-black text-xl sm:text-2xl text-[var(--color-dark)] tracking-wider group-hover:opacity-80 transition-opacity leading-tight flex items-center gap-0.5">
                <span>{siteSettings?.siteName && !siteSettings.siteName.toLowerCase().includes('women') ? siteSettings.siteName : BRAND.name}</span>
                <span className="text-[10px] font-normal uppercase text-[var(--color-text-muted)] -mt-1.5">™</span>
              </span>
              <span className="text-[9px] sm:text-[10px] font-extrabold tracking-widest uppercase text-[var(--color-text-muted)] -mt-0.5">
                {siteSettings?.tagline && !siteSettings.tagline.toLowerCase().includes('bangladesh premium') && !siteSettings.tagline.toLowerCase().includes('women') ? siteSettings.tagline : BRAND.tagline}
              </span>
            </div>
          </Link>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                placeholder={t('search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-[#FFF8FA] border border-[#F0E2E8] rounded-full focus:outline-none focus:ring-2 focus:ring-[#D45D83]/20 focus:border-[#D45D83] transition-all text-[#292329] placeholder-[#77717A]"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#77717A]" />
            </form>
          </div>

          {/* Desktop Nav Links & Action Icons */}
          <div className="flex items-center gap-2 sm:gap-4" ref={dropdownRef}>
            {/* Desktop Nav Items */}
            <nav className="hidden lg:flex items-center gap-6 mr-2 font-bangla">
              <Link to={ROUTES.HOME} className="text-sm font-medium text-[#292329] hover:text-[#D45D83] transition-colors">
                {t('nav.home')}
              </Link>
              <Link to={ROUTES.PRODUCTS} className="text-sm font-medium text-[#292329] hover:text-[#D45D83] transition-colors">
                {t('nav.products')}
              </Link>
            </nav>

            {/* Wishlist Icon */}
            <Link
              to={ROUTES.WISHLIST}
              className="relative p-2 text-[#292329] hover:text-[#D45D83] rounded-full hover:bg-[#FFF0F5] transition-colors"
              aria-label={t('nav.wishlist')}
            >
              <Heart className="w-5 h-5" />
              {wishlistItemCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-[#D45D83] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-scale-in">
                  {wishlistItemCount}
                </span>
              )}
            </Link>

            {/* Cart Icon */}
            <Link
              to={ROUTES.CART}
              className="relative p-2 text-[#292329] hover:text-[#D45D83] rounded-full hover:bg-[#FFF0F5] transition-colors"
              aria-label={t('nav.cart')}
            >
              <ShoppingBag className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-[#D45D83] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-cart-bump">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* Account / Profile Button */}
            <div className="relative">
              {user ? (
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-full hover:bg-[#FFF0F5] transition-colors border border-transparent hover:border-[#F0E2E8]"
                  aria-label="ব্যবহারকারী অ্যাকাউন্ট"
                >
                  <div className="w-7 h-7 rounded-full bg-[#D45D83] text-white font-medium text-xs flex items-center justify-center">
                    {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#77717A] hidden sm:block" />
                </button>
              ) : (
                <Link
                  to={ROUTES.LOGIN}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF0F5] text-[#D45D83] hover:bg-[#D45D83] hover:text-white rounded-full text-xs font-semibold transition-colors"
                >
                  <UserIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('nav.login')}</span>
                </Link>
              )}

              {/* User Account Dropdown */}
              {user && userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-[#F0E2E8] rounded-2xl shadow-modal py-2 z-dropdown font-bangla">
                  <div className="px-4 py-2 border-b border-[#F0E2E8]">
                    <p className="text-xs font-semibold text-[#292329] truncate">{user.displayName || 'গ্রাহক'}</p>
                    <p className="text-[11px] text-[#77717A] truncate">{user.email}</p>
                  </div>

                  <Link
                    to={ROUTES.ACCOUNT}
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-[#292329] hover:bg-[#FFF0F5] hover:text-[#D45D83] transition-colors"
                  >
                    <UserIcon className="w-4 h-4" />
                    <span>{t('account.profile')}</span>
                  </Link>

                  <Link
                    to={ROUTES.ACCOUNT_ORDERS}
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-[#292329] hover:bg-[#FFF0F5] hover:text-[#D45D83] transition-colors"
                  >
                    <Package className="w-4 h-4" />
                    <span>{t('order.my_orders')}</span>
                  </Link>

                  {isAdmin && (
                    <Link
                      to={ROUTES.ADMIN_DASHBOARD}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-[#D45D83] font-semibold hover:bg-[#FFF0F5] transition-colors border-t border-[#F0E2E8]"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>{isBangla ? 'অ্যাডমিন প্যানেল' : 'Admin Panel'}</span>
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-[#F0E2E8]"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('nav.logout')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Bar below logo */}
        <div className="mt-2.5 md:hidden">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              placeholder={t('search.placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-[#FFF8FA] border border-[#F0E2E8] rounded-full focus:outline-none focus:ring-1 focus:ring-[#D45D83] text-[#292329]"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#77717A]" />
          </form>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-sidebar flex md:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 font-bangla">
            <div className="flex items-center justify-between p-4 border-b border-[#F0E2E8]">
              <Link to={ROUTES.HOME} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-black border border-neutral-800 p-0.5 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img
                    src={siteSettings?.logoUrl || '/logo-icon.png'}
                    alt={siteSettings?.siteName || BRAND.name}
                    onError={(e) => { (e.target as HTMLImageElement).src = '/logo-icon.png'; }}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-sans font-black text-sm text-[var(--color-dark)] tracking-wider leading-tight">
                    {siteSettings?.siteName || BRAND.name}™
                  </span>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--color-text-muted)] -mt-0.5">
                    {siteSettings?.tagline || BRAND.tagline}
                  </span>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-[#77717A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <nav className="space-y-1">
                <Link
                  to={ROUTES.HOME}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center py-2.5 px-3 rounded-xl text-sm font-medium text-[#292329] hover:bg-[#FFF0F5] hover:text-[var(--color-primary)]"
                >
                  {t('nav.home')}
                </Link>
                <Link
                  to={ROUTES.PRODUCTS}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center py-2.5 px-3 rounded-xl text-sm font-medium text-[#292329] hover:bg-[#FFF0F5] hover:text-[var(--color-primary)]"
                >
                  {t('nav.products')}
                </Link>
                <Link
                  to={ROUTES.WISHLIST}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl text-sm font-medium text-[#292329] hover:bg-[#FFF0F5] hover:text-[var(--color-primary)]"
                >
                  <span>{t('nav.wishlist')}</span>
                  {wishlistItemCount > 0 && (
                    <span className="bg-[var(--color-primary)] text-white text-xs px-2 py-0.5 rounded-full font-bold">
                      {wishlistItemCount}
                    </span>
                  )}
                </Link>
                <Link
                  to={ROUTES.CART}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl text-sm font-medium text-[#292329] hover:bg-[#FFF0F5] hover:text-[var(--color-primary)]"
                >
                  <span>{t('nav.cart')}</span>
                  {cartItemCount > 0 && (
                    <span className="bg-[var(--color-primary)] text-white text-xs px-2 py-0.5 rounded-full font-bold">
                      {cartItemCount}
                    </span>
                  )}
                </Link>
              </nav>

              {/* Mobile theme chooser */}

              <div className="pt-2 border-t border-[#F0E2E8]">
                <p className="text-xs font-bold text-[#77717A] uppercase tracking-wider mb-2 px-1">
                  {t('nav.categories')}
                </p>
                <div className="space-y-1">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/category/${cat.slug}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between py-2 px-3 rounded-lg text-sm text-[#292329] hover:bg-[#FFF0F5] hover:text-[var(--color-primary)]"
                    >
                      <span>{isBangla ? cat.nameBn : (cat.nameEn || cat.nameBn)}</span>
                      {cat.icon && <span className="text-xs">{cat.icon}</span>}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile language & auth in drawer bottom */}
            <div className="p-4 border-t border-[#F0E2E8] bg-[#FFF8FA] flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLanguage('bn')}
                  className={`text-xs px-2 py-1 rounded-md ${isBangla ? 'bg-[#D45D83] text-white font-bold' : 'text-[#77717A]'}`}
                >
                  বাংলা
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`text-xs px-2 py-1 rounded-md ${!isBangla ? 'bg-[#D45D83] text-white font-bold' : 'text-[#77717A]'}`}
                >
                  English
                </button>
              </div>
              {user ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs text-red-600 font-medium"
                >
                  {t('nav.logout')}
                </button>
              ) : (
                <Link
                  to={ROUTES.LOGIN}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs text-[#D45D83] font-bold"
                >
                  {t('nav.login')}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
