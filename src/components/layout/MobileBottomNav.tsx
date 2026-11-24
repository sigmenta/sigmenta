import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Grid, Heart, ShoppingBag, User } from 'lucide-react';
import { ROUTES } from '@/constants';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';

export const MobileBottomNav: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation();

  const cartItemCount = useCartStore((state) => state.getItemCount());
  const wishlistItemCount = useWishlistStore((state) => state.getItemCount());

  const navItems = [
    {
      label: t('nav.home'),
      path: ROUTES.HOME,
      icon: Home,
      exact: true,
    },
    {
      label: t('nav.products'),
      path: ROUTES.PRODUCTS,
      icon: Grid,
      exact: false,
    },
    {
      label: t('nav.wishlist'),
      path: ROUTES.WISHLIST,
      icon: Heart,
      badge: wishlistItemCount,
      exact: false,
    },
    {
      label: t('nav.cart'),
      path: ROUTES.CART,
      icon: ShoppingBag,
      badge: cartItemCount,
      exact: false,
    },
    {
      label: t('nav.account'),
      path: ROUTES.ACCOUNT,
      icon: User,
      exact: false,
    },
  ];

  const isActive = (path: string, exact: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#F0E2E8] shadow-bottom-nav px-2 pb-[env(safe-area-inset-bottom,0px)]"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const active = isActive(item.path, item.exact);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 text-center transition-colors font-bangla ${
                active ? 'text-[var(--color-primary)]' : 'text-[#77717A] hover:text-[var(--color-dark)]'
              }`}
            >
              <div className="relative">
                <IconComponent className={`w-5 h-5 ${active ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[var(--color-primary)] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] mt-1 font-medium ${active ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
