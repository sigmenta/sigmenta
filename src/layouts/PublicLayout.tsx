// ─── Public Layout ────────────────────────────────────────────────────────────
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { BRAND } from '@/constants';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import ChatBot from '@/components/common/ChatBot';

interface PublicLayoutProps {
  children?: React.ReactNode;
  title?: string;
  description?: string;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({
  children,
  title,
  description,
}) => {
  const pageTitle = title
    ? `${title} — ${BRAND.nameBn}`
    : `${BRAND.nameBn} | ${BRAND.tagline}`;

  const pageDescription = description ?? BRAND.description;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:site_name" content={BRAND.nameBn} />
      </Helmet>

      {/* Announcement bar sits above everything */}
      <AnnouncementBar />

      {/* Sticky header */}
      <Header />

      {/* Main content — pb-20 on mobile to clear the bottom nav */}
      <main className="min-h-screen bg-[var(--color-bg-light)] pb-20 md:pb-0">
        <React.Suspense
          fallback={
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div
                className="w-8 h-8 rounded-full border-3 border-[var(--color-primary-light)] border-t-[var(--color-primary)] animate-spin"
                role="status"
                aria-label="লোড হচ্ছে..."
              />
              <p className="text-xs text-[var(--color-text-muted)] font-bangla">লোড হচ্ছে...</p>
            </div>
          }
        >
          {children ?? <Outlet />}
        </React.Suspense>
      </main>

      <Footer />

      {/* Floating 24/7 AI Shopping Assistant & WhatsApp Helpline */}
      <ChatBot />

      {/* Bottom nav is hidden on md+ via its own className */}
      <MobileBottomNav />
    </>
  );
};

export default PublicLayout;
