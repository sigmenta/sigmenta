import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, Truck, ArrowRight, Zap, Award } from 'lucide-react';
import { BRAND, ROUTES } from '@/constants';
import { useLanguage } from '@/contexts/LanguageContext';

export const AboutPage: React.FC = () => {
  const { isBangla } = useLanguage();

  return (
    <>
      <Helmet>
        <title>{`আমাদের সম্পর্কে — ${BRAND.nameBn}`}</title>
        <meta name="description" content="Sigmenta™ — Wear Your Style এর গল্প, লক্ষ্য ও দৃষ্টিভঙ্গি।" />
      </Helmet>

      <div className="max-w-content mx-auto px-4 py-8 font-bangla">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-slate-100 to-white border border-[var(--color-border)] rounded-3xl p-8 md:p-14 mb-12 text-center max-w-4xl mx-auto shadow-sm">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[var(--color-border)] rounded-full text-xs font-bold text-[var(--color-primary)] mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>আমাদের গল্প</span>
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-[var(--color-dark)] leading-tight mb-4 tracking-tight">
            Sigmenta™ — Wear Your Style
          </h1>
          <p className="text-sm md:text-base text-[var(--color-text-muted)] max-w-2xl mx-auto leading-relaxed">
            {isBangla
              ? 'সিগমেন্টা (Sigmenta™) একটি আধুনিক লাইফস্টাইল ব্র্যান্ড—ছেলে ও মেয়ে উভয়ের জন্য ট্রেন্ডি, আরামদায়ক ও প্রিমিয়াম কোয়ালিটির ফ্যাশন ওয়্যার নির্ভরযোগ্যতার সাথে পৌঁছে দেওয়াই আমাদের ব্রত।'
              : 'Sigmenta™ is a modern unisex fashion and lifestyle brand dedicated to bringing you premium, stylish, and comfortable apparel.'}
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white border border-[var(--color-border)] rounded-3xl p-8 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-[var(--color-primary)] flex items-center justify-center mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-[var(--color-dark)] mb-3">আমাদের লক্ষ্য (Mission)</h2>
            <p className="text-xs md:text-sm text-[var(--color-text-muted)] leading-relaxed">
              তরুণ-তরুণী ও ফ্যাশন সচেতন সকলের কাছে আধুনিক ও প্রিমিয়াম মানের পোশাক পৌঁছে দেওয়া। আমরা নিশ্চিত করি সেরা ফেব্রিক, নিখুঁত স্টিচিং ও আকর্ষণীয় ডিজাইন, যাতে আপনি আত্মবিশ্বাসের সাথে নিজের স্টাইল ফুটিয়ে তুলতে পারেন।
            </p>
          </div>

          <div className="bg-white border border-[var(--color-border)] rounded-3xl p-8 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-[var(--color-primary)] flex items-center justify-center mb-4">
              <Award className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-[var(--color-dark)] mb-3">আমাদের দৃষ্টিভঙ্গি (Vision)</h2>
            <p className="text-xs md:text-sm text-[var(--color-text-muted)] leading-relaxed">
              বাংলাদেশে লাইফস্টাইল ও ফ্যাশন ই-কমার্সে সততা ও সেবার সর্বোচ্চ মাপকাঠি স্থাপন করা। প্রতিটি অর্ডারে সঠিক পণ্য এবং দ্রুততম হোম ডেলিভারির মাধ্যমে দীর্ঘমেয়াদী বিশ্বাস গড়ে তোলা।
            </p>
          </div>
        </div>

        {/* Brand Values */}
        <div className="bg-white border border-[var(--color-border)] rounded-3xl p-8 md:p-12 mb-12 shadow-sm">
          <h2 className="text-2xl font-bold text-[var(--color-dark)] text-center mb-8">
            আমাদের মূল্যবোধ ও প্রতিশ্রুতি
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-[var(--color-primary)] flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-[var(--color-dark)] mb-1">১০০% প্রিমিয়াম কোয়ালিটি</h3>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                উন্নত ফেব্রিক এবং আরামদায়ক ফিটিং যা আপনাকে দেয় দীর্ঘস্থায়ী স্বাচ্ছন্দ্য।
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-[var(--color-primary)] flex items-center justify-center mx-auto mb-3">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-[var(--color-dark)] mb-1">দ্রুততম ডেলিভারি</h3>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                ঢাকা এবং সারা বাংলাদেশে সবচেয়ে দ্রুত ও নিরাপদ হোম ডেলিভারি সুবিধা।
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-[var(--color-primary)] flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-[var(--color-dark)] mb-1">গ্রাহক সন্তুষ্টি</h3>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                সহজ রিটার্ন এবং সার্বক্ষণিক কাস্টমার কেয়ার সাপোর্ট আপনার কেনাকাটা রাখে নিশ্চিন্ত।
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-neutral-900 text-white rounded-3xl p-8 md:p-12 text-center shadow-lg">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-3">
            আপনার পছন্দের পোশাকটি বেছে নিন আজই
          </h2>
          <p className="text-xs md:text-sm text-neutral-300 max-w-xl mx-auto mb-6">
            সিগমেন্টার নতুন কালেকশন ঘুরে দেখুন এবং নিজের স্টাইলকে করুন আরও আকর্ষণীয়।
          </p>
          <Link
            to={ROUTES.PRODUCTS}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-neutral-900 rounded-full font-bold text-xs hover:bg-neutral-100 transition-colors shadow-sm"
          >
            <span>পণ্যসমূহ দেখুন</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </>
  );
};

export default AboutPage;
