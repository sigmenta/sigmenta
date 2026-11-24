// ─── Women's Favorite — Forgot Password Page ───────────────────────────────
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { sendPasswordResetEmail } from 'firebase/auth';
import { ArrowLeft, Mail, CheckCircle2, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';

import { auth } from '@/lib/firebase';
import { useLanguage } from '@/contexts/LanguageContext';
import { ROUTES, BRAND } from '@/constants';

/* ── Helpers ── */
function getResetErrorMessage(code: string): string {
  const map: Record<string, string> = {
    'auth/user-not-found': 'এই ইমেইলে কোনো অ্যাকাউন্ট নেই।',
    'auth/invalid-email': 'ইমেইল ঠিকানাটি সঠিক নয়।',
    'auth/network-request-failed': 'নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।',
    'auth/too-many-requests': 'অনেকবার চেষ্টা হয়েছে। কিছুক্ষণ পরে আবার করুন।',
  };
  return map[code] ?? 'একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।';
}

/* ── Zod Schema ── */
const forgotSchema = z.object({
  email: z
    .string()
    .min(1, 'ইমেইল আবশ্যক')
    .email('সঠিক ইমেইল ঠিকানা দিন'),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

/* ══════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════ */
export default function ForgotPasswordPage(): React.ReactElement {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotFormData): Promise<void> => {
    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, data.email, {
        url: `${window.location.origin}${ROUTES.LOGIN}`,
      });
      setSuccessEmail(data.email);
      toast.success('রিসেট লিংক পাঠানো হয়েছে!');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      toast.error(getResetErrorMessage(code));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>পাসওয়ার্ড রিসেট — {BRAND.name}</title>
        <meta
          name="description"
          content="আপনার পাসওয়ার্ড রিসেট করুন।"
        />
      </Helmet>

      <div className="min-h-screen bg-[#FFF8FA] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Top Navigation & Logo */}
          <div className="flex items-center justify-between mb-4">
            <Link
              to={ROUTES.LOGIN}
              className="inline-flex items-center gap-1.5 text-xs text-[#77717A] hover:text-[#D45D83] transition-colors font-bangla font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>লগইনে ফিরে যান</span>
            </Link>
          </div>

          <div className="text-center mb-6">
            <Link to={ROUTES.HOME} className="inline-flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-black border border-neutral-800 p-1 flex items-center justify-center flex-shrink-0 shadow-xs">
                <img src="/logo-icon.png" alt="Sigmenta Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-sans font-black text-2xl text-[var(--color-dark)] leading-tight tracking-wider">
                  Sigmenta™
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-text-muted)] -mt-0.5">
                  {BRAND.tagline}
                </span>
              </div>
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-md border border-[#F0E2E8] p-8">
            {successEmail ? (
              /* ── Success State ── */
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-9 h-9 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-[#292329] mb-2">
                  ইমেইল পাঠানো হয়েছে!
                </h2>
                <p className="text-[#77717A] text-sm mb-2">
                  পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে:
                </p>
                <p className="text-[#D45D83] font-semibold text-sm mb-4 break-all">
                  {successEmail}
                </p>
                <div className="bg-[#FFF8FA] border border-[#F0E2E8] rounded-xl p-4 text-left mb-6">
                  <p className="text-xs text-[#77717A] leading-relaxed">
                    📧 ইমেইলটি না পেলে স্প্যাম ফোল্ডার চেক করুন।<br />
                    🔗 লিংকটি ২৪ ঘণ্টার মধ্যে ব্যবহার করুন।<br />
                    🔄 প্রয়োজনে আবার পাঠাতে পারেন।
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSuccessEmail(null)}
                  className="text-sm text-[#D45D83] hover:text-[#B8446C] font-medium transition-colors"
                >
                  ভিন্ন ইমেইল ব্যবহার করুন
                </button>
              </div>
            ) : (
              /* ── Form State ── */
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-[#FFF8FA] rounded-full flex items-center justify-center border border-[#F0E2E8]">
                    <Mail className="w-5 h-5 text-[#D45D83]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#292329]">
                      {t('auth.reset_password')}
                    </h2>
                    <p className="text-[#77717A] text-xs">
                      ইমেইলে রিসেট লিংক পাঠানো হবে
                    </p>
                  </div>
                </div>

                <p className="text-sm text-[#77717A] mb-5">
                  আপনার অ্যাকাউন্টের ইমেইল দিন। আমরা পাসওয়ার্ড রিসেট করার
                  লিংক পাঠাবো।
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-[#292329] mb-1.5"
                    >
                      {t('auth.email')}
                    </label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="example@email.com"
                      {...register('email')}
                      className={`w-full px-4 py-3 rounded-xl border text-[#292329] placeholder-[#77717A] bg-[#FFF8FA] focus:outline-none focus:ring-2 focus:ring-[#D45D83] focus:border-[#D45D83] transition-colors text-sm ${
                        errors.email ? 'border-red-400' : 'border-[#F0E2E8]'
                      }`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#D45D83] hover:bg-[#B8446C] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 text-base shadow-md shadow-[#D45D83]/20"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Mail className="w-5 h-5" />
                        রিসেট লিংক পাঠান
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {/* Back to login */}
            <div className="mt-6 pt-5 border-t border-[#F0E2E8]">
              <Link
                to={ROUTES.LOGIN}
                className="flex items-center justify-center gap-2 text-sm text-[#77717A] hover:text-[#D45D83] transition-colors font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                লগইন পেজে ফিরে যান
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
