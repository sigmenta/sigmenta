import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone, Mail, MapPin, Facebook, Instagram, Send,
  Truck, BadgeCheck, RotateCcw, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BRAND, ROUTES } from '@/constants';
import { useLanguage } from '@/contexts/LanguageContext';
import { settingsService, getLocalSettings } from '@/services/settingsService';

export const Footer: React.FC = () => {
  const { t, isBangla } = useLanguage();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [siteSettings, setSiteSettings] = useState(getLocalSettings());

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

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim() && newsletterEmail.includes('@')) {
      toast.success(isBangla ? 'নিউজলেটারে সাবস্ক্রাইব করার জন্য ধন্যবাদ!' : 'Thank you for subscribing!');
      setNewsletterEmail('');
    } else {
      toast.error(isBangla ? 'অনুগ্রহ করে একটি সঠিক ইমেইল দিন' : 'Please provide a valid email address');
    }
  };

  const contactEmail = siteSettings?.contactEmail && !siteSettings.contactEmail.includes('women')
    ? siteSettings.contactEmail
    : 'support@sigmenta.com';

  const siteName = siteSettings?.siteName && !siteSettings.siteName.toLowerCase().includes('women')
    ? siteSettings.siteName
    : BRAND.name;

  const tagline = siteSettings?.tagline && !siteSettings.tagline.toLowerCase().includes('women') && !siteSettings.tagline.toLowerCase().includes('bangladesh premium')
    ? siteSettings.tagline
    : BRAND.tagline;

  return (
    <footer className="bg-[#0F172A] text-white pt-0 pb-20 md:pb-8 font-bangla border-t border-slate-800">
      {/* ── Brand Trust Features / নিতিমালা ও সেবা ── */}
      <div className="border-b border-slate-800 bg-slate-900/80 py-6 mb-10">
        <div className="max-w-content mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-xs md:text-sm font-bold text-white leading-tight">
                  {isBangla ? 'দ্রুত ডেলিভারি' : 'Fast Delivery'}
                </h4>
                <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                  {isBangla ? 'সারা বাংলাদেশে দ্রুত পৌঁছানো হয়' : 'Fast nationwide shipping'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                <BadgeCheck className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <h4 className="text-xs md:text-sm font-bold text-white leading-tight">
                  {isBangla ? '১০০% অরিজিনাল পণ্য' : '100% Original'}
                </h4>
                <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                  {isBangla ? 'সেরা কোয়ালিটি ফ্যাব্রিক নিশ্চিত' : 'Authentic premium quality'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h4 className="text-xs md:text-sm font-bold text-white leading-tight">
                  {isBangla ? 'সহজ রিটার্ন পলিসি' : 'Easy Return Policy'}
                </h4>
                <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                  {isBangla ? 'কোনো সমস্যা হলে সহজেই ফেরত দিন' : 'Simple replacement policy'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h4 className="text-xs md:text-sm font-bold text-white leading-tight">
                  {isBangla ? 'নিরাপদ পেমেন্ট' : 'Secure Payment'}
                </h4>
                <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                  {isBangla ? 'ক্যাশ অন ডেলিভারি, বিকাশ ও নগদ' : 'COD, bKash & Nagad'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-content mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-8">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to={ROUTES.HOME} className="inline-block group">
              <div className="flex items-center gap-3 bg-white/95 px-3.5 py-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="h-10 w-10 rounded-xl bg-black border border-neutral-800 p-1 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img
                    src={siteSettings?.logoUrl || '/logo-icon.png'}
                    alt={siteName}
                    onError={(e) => { (e.target as HTMLImageElement).src = '/logo-icon.png'; }}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-sans font-black text-lg text-neutral-900 leading-tight tracking-wider">
                    {siteName}™
                  </span>
                  <span className="text-[10px] text-neutral-600 font-extrabold tracking-widest uppercase">
                    {tagline}
                  </span>
                </div>
              </div>
            </Link>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-sm">
              {isBangla
                ? 'Sigmenta™ — Wear Your Style. তরুণ-তরুণী ও ফ্যাশন সচেতন সকলের জন্য প্রিমিয়াম পোশাক ও লাইফস্টাইল ব্র্যান্ড।'
                : 'Sigmenta™ — Wear Your Style. Premium apparel & lifestyle brand for modern fashion.'}
            </p>

            <div className="space-y-2 pt-1 text-xs md:text-sm text-slate-300">
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-mono text-white">{siteSettings?.contactPhone || BRAND.phone}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="text-slate-200">{contactEmail}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="text-slate-200">{siteSettings?.addressBn || (isBangla ? BRAND.address : BRAND.addressEn)}</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-2.5 pt-1">
              <a
                href={siteSettings?.socialMedia?.facebook || BRAND.socialMedia.facebook}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-blue-600 flex items-center justify-center text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href={siteSettings?.socialMedia?.instagram || BRAND.socialMedia.instagram}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-pink-600 flex items-center justify-center text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white mb-3.5 tracking-wider border-b border-slate-800 pb-2">
              {isBangla ? 'দ্রুত লিংক' : 'Quick Links'}
            </h4>
            <ul className="space-y-2.5 text-xs md:text-sm">
              <li>
                <Link to={ROUTES.HOME} className="text-slate-300 hover:text-white hover:underline transition-colors block">
                  {isBangla ? 'হোম' : 'Home'}
                </Link>
              </li>
              <li>
                <Link to={ROUTES.PRODUCTS} className="text-slate-300 hover:text-white hover:underline transition-colors block">
                  {isBangla ? 'পণ্য' : 'Products'}
                </Link>
              </li>
              <li>
                <Link to={ROUTES.ABOUT} className="text-slate-300 hover:text-white hover:underline transition-colors block">
                  {isBangla ? 'আমাদের সম্পর্কে' : 'About Us'}
                </Link>
              </li>
              <li>
                <Link to={ROUTES.CONTACT} className="text-slate-300 hover:text-white hover:underline transition-colors block">
                  {isBangla ? 'যোগাযোগ' : 'Contact'}
                </Link>
              </li>
              <li>
                <Link to={ROUTES.REVIEWS} className="text-slate-300 hover:text-white hover:underline transition-colors block">
                  {isBangla ? 'রিভিউ' : 'Reviews'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service & Policies */}
          <div>
            <h4 className="text-sm font-bold text-white mb-3.5 tracking-wider border-b border-slate-800 pb-2">
              {isBangla ? 'নীতিমালা' : 'Policies'}
            </h4>
            <ul className="space-y-2.5 text-xs md:text-sm">
              <li>
                <Link to={ROUTES.SHIPPING_POLICY} className="text-slate-300 hover:text-white hover:underline transition-colors block">
                  {isBangla ? 'শিপিং নীতি' : 'Shipping Policy'}
                </Link>
              </li>
              <li>
                <Link to={ROUTES.REFUND_POLICY} className="text-slate-300 hover:text-white hover:underline transition-colors block">
                  {isBangla ? 'ফেরত নীতি' : 'Refund Policy'}
                </Link>
              </li>
              <li>
                <Link to={ROUTES.PRIVACY_POLICY} className="text-slate-300 hover:text-white hover:underline transition-colors block">
                  {isBangla ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}
                </Link>
              </li>
              <li>
                <Link to={ROUTES.TERMS} className="text-slate-300 hover:text-white hover:underline transition-colors block">
                  {isBangla ? 'শর্তাবলী' : 'Terms & Conditions'}
                </Link>
              </li>
              <li>
                <Link to={ROUTES.ACCOUNT_ORDERS} className="text-slate-300 hover:text-white hover:underline transition-colors block">
                  {isBangla ? 'অর্ডার ট্র্যাক করুন' : 'Track Order'}
                </Link>
              </li>
            </ul>

          </div>

          {/* Newsletter Form */}
          <div>
            <h4 className="text-sm font-bold text-white mb-3.5 tracking-wider border-b border-slate-800 pb-2">
              {isBangla ? 'নিউজলেটার' : 'Newsletter'}
            </h4>
            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              {isBangla
                ? 'নতুন অফার ও বিশেষ ছাড়ের খবর পেতে ইমেইল সাবস্ক্রাইব করুন।'
                : 'Subscribe to receive updates on exclusive offers and seasonal collections.'}
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder={isBangla ? 'আপনার ইমেইল দিন' : 'Enter your email'}
                  className="w-full px-3.5 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-slate-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <span>{isBangla ? 'সাবস্ক্রাইব' : 'Subscribe'}</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Payment Method Badges */}
            <div className="pt-4">
              <p className="text-[11px] text-slate-400 mb-1.5 font-semibold">
                {isBangla ? 'পেমেন্ট পদ্ধতিসমূহ:' : 'Payment Methods:'}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-bold text-green-400">
                  COD
                </span>
                <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-bold text-[#E2136E]">
                  bKash
                </span>
                <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-bold text-[#F7941D]">
                  Nagad
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800/80 mt-8 pt-4 px-4">
        <div className="max-w-content mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <p>
            © {new Date().getFullYear()} {siteName}. {isBangla ? 'সর্বস্বত্ব সংরক্ষিত।' : 'All rights reserved.'}
          </p>
          <p className="flex items-center gap-1">
            <span>{isBangla ? 'বাংলাদেশে তৈরি' : 'Made with pride in Bangladesh'}</span>
            <span>🇧🇩</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
