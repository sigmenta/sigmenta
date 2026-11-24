// ─── Announcement Bar ─────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { COLLECTIONS } from '@/constants';
import { useLanguage } from '@/contexts/LanguageContext';
import type { SiteSettings } from '@/types';

const DISMISSED_KEY = 'wf_announcement_dismissed';

const AnnouncementBar: React.FC = () => {
  const { language, t } = useLanguage();
  const [announcement, setAnnouncement] = useState<SiteSettings['announcementBar'] | null>(null);
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISSED_KEY) === 'true') {
        setDismissed(true);
      }
    } catch {}

    const handleStorageUpdate = () => {
      try {
        const local = localStorage.getItem('wf_site_settings');
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed.announcementBar) {
            setAnnouncement(parsed.announcementBar);
          }
        }
      } catch {}
    };

    handleStorageUpdate();
    window.addEventListener('wf_settings_updated', handleStorageUpdate);

    let unsub: (() => void) | undefined;
    if (isFirebaseConfigured) {
      try {
        unsub = onSnapshot(doc(db, COLLECTIONS.SITE_SETTINGS, 'global'), (snap) => {
          if (snap.exists()) {
            const data = snap.data() as SiteSettings;
            if (data.announcementBar) {
              setAnnouncement(data.announcementBar);
            }
          }
        }, () => {});
      } catch {}
    }

    return () => {
      window.removeEventListener('wf_settings_updated', handleStorageUpdate);
      unsub?.();
    };
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISSED_KEY, 'true');
    } catch {
      // Ignore
    }
  };

  if (!announcement || !announcement.isActive || dismissed) return null;

  const sanitizeAnnouncement = (rawText?: string): string => {
    if (!rawText) return '⚡ সিগমেন্টা (Sigmenta™) তে স্বাগতম! সারা বাংলাদেশে দ্রুততম হোম ডেলিভারি। ৩,০০০+ টাকার অর্ডারে ফ্রি ডেলিভারি!';
    return rawText
      .replace(/উইমেন্স ফেভারিট/gi, 'সিগমেন্টা (Sigmenta™)')
      .replace(/উইমেনস ফেভারিট/gi, 'সিগমেন্টা (Sigmenta™)')
      .replace(/উইমেন ফেভারিট/gi, 'সিগমেন্টা (Sigmenta™)')
      .replace(/উইমেন্স/gi, 'সিগমেন্টা')
      .replace(/উইমেনস/gi, 'সিগমেন্টা')
      .replace(/Women's Favorite/gi, 'Sigmenta™')
      .replace(/Womens Favorite/gi, 'Sigmenta™')
      .replace(/Women Favorite/gi, 'Sigmenta™')
      .replace(/Women/gi, 'Sigmenta')
      .replace(/🌸/gi, '⚡');
  };

  const rawText =
    language === 'bn'
      ? announcement.textBn
      : announcement.textEn ?? announcement.textBn;

  const text = sanitizeAnnouncement(rawText);

  const bgColor = (announcement.backgroundColor && announcement.backgroundColor !== '#D45D83' && announcement.backgroundColor !== '#d45d83')
    ? announcement.backgroundColor
    : '#0F172A';
  const textColor = announcement.textColor ?? '#FFFFFF';

  return (
    <div
      role="banner"
      aria-label={t('announcement.default')}
      className="relative z-50 flex items-center justify-center px-10 py-2 text-sm font-medium"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {/* Scrolling on small viewports */}
      <div className="overflow-hidden max-w-full">
        <p className="whitespace-nowrap text-center animate-marquee md:animate-none">
          {text}
        </p>
      </div>

      {/* Dismiss button */}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label={t('common.close')}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 hover:bg-white/20 transition-colors"
        style={{ color: textColor }}
      >
        <X size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
};

export default AnnouncementBar;
