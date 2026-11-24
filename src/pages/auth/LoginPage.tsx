// ─── Women's Favorite — Login Page ─────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { Eye, EyeOff, LogIn, ShoppingBag, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/features/auth/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ROUTES, COLLECTIONS, BRAND } from '@/constants';

function getErrorMessage(code: string, fallbackMessage?: string): string {
  const map: Record<string, string> = {
    'auth/invalid-credential': 'ইমেইল বা পাসওয়ার্ড ভুল। আবার চেষ্টা করুন।',
    'auth/invalid-email': 'ইমেইল ঠিকানাটি সঠিক নয়।',
    'auth/user-disabled': 'এই অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে।',
    'auth/user-not-found': 'এই ইমেইলে কোনো অ্যাকাউন্ট নেই।',
    'auth/wrong-password': 'পাসওয়ার্ড ভুল। আবার চেষ্টা করুন।',
    'auth/too-many-requests': 'অনেকবার ব্যর্থ চেষ্টা। কিছুক্ষণ পরে আবার চেষ্টা করুন।',
    'auth/network-request-failed': 'নেটওয়ার্ক সমস্যা। আপনার ইন্টারনেট সংযোগ চেক করুন।',
    'auth/popup-closed-by-user': 'Google সাইন-ইন পপআপ উইন্ডো বন্ধ করা হয়েছে।',
    'auth/cancelled-popup-request': 'Google সাইন-ইন প্রক্রিয়া বাতিল করা হয়েছে।',
    'auth/popup-blocked': 'ব্রাউজারে পপআপ ব্লক করা হয়েছে। অনুগ্রহ করে ব্রাউজারের পপআপ এলাউ (Allow) করুন।',
    'auth/operation-not-allowed': 'ফায়ারবেস কনসোলে Google সাইন-ইন চালু (Enable) করা নেই! Firebase Console > Authentication > Sign-in method-এ গিয়ে Google অন করুন।',
    'auth/unauthorized-domain': 'এই ডোমেইনটি Firebase-এ অনুমোদিত নয়। অনুগ্রহ করে http://localhost:5173 ব্যবহার করুন।',
    'auth/configuration-not-found': 'Google সাইন-ইন কনফিগারেশন পাওয়া যায়নি। Firebase Console-এ Google Provider সেটআপ করুন।',
  };
  return map[code] ?? fallbackMessage ?? 'একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।';
}

/* ── Zod Schema ── */
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'ইমেইল আবশ্যক')
    .email('সঠিক ইমেইল দিন'),
  password: z
    .string()
    .min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে'),
});

type LoginFormData = z.infer<typeof loginSchema>;

/* ── Google Provider ── */
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

/* ══════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════ */
export default function LoginPage(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading } = useAuth();
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  /* Redirect if already logged in */
  useEffect(() => {
    if (!isLoading && user) {
      const from = (location.state as { from?: string } | null)?.from ?? ROUTES.HOME;
      navigate(from, { replace: true });
    }
  }, [user, isLoading, navigate, location.state]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  /* ── Email/Password Login ── */
  const onSubmit = async (data: LoginFormData): Promise<void> => {
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast.success('সফলভাবে লগইন হয়েছে! 🎉');
      const from = (location.state as { from?: string } | null)?.from ?? ROUTES.HOME;
      navigate(from, { replace: true });
    } catch (err: unknown) {
      console.error('[Login Error]:', err);
      const errObj = err as { code?: string; message?: string };
      const code = errObj.code ?? '';
      toast.error(getErrorMessage(code, errObj.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Google Sign-In ── */
  const handleGoogleSignIn = async (): Promise<void> => {
    setIsGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      /* Create Firestore profile if this is a new user */
      const userRef = doc(db, COLLECTIONS.USERS, firebaseUser.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          uid: firebaseUser.uid,
          email: firebaseUser.email ?? '',
          emailVerified: firebaseUser.emailVerified,
          displayName: firebaseUser.displayName ?? 'ব্যবহারকারী',
          photoURL: firebaseUser.photoURL ?? null,
          phoneNumber: firebaseUser.phoneNumber ?? null,
          role: 'customer',
          isActive: true,
          addresses: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        });
      }

      toast.success('Google দিয়ে সফলভাবে লগইন হয়েছে! 🎉');
      const from = (location.state as { from?: string } | null)?.from ?? ROUTES.HOME;
      navigate(from, { replace: true });
    } catch (err: unknown) {
      console.error('[Google Sign-In Error]:', err);
      const errObj = err as { code?: string; message?: string };
      const code = errObj.code ?? '';
      toast.error(getErrorMessage(code, errObj.message));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>লগইন — {BRAND.name}</title>
        <meta name="description" content="আপনার Sigmenta অ্যাকাউন্টে লগইন করুন।" />
      </Helmet>

      <div className="min-h-screen bg-[var(--color-bg-light)] flex flex-col lg:flex-row">
        {/* ── Left decorative panel (desktop) ── */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-neutral-950 via-neutral-900 to-slate-900 flex-col items-center justify-center p-12 relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-[-80px] right-[-80px] w-64 h-64 bg-white/5 rounded-full" />
          <div className="absolute bottom-[-60px] left-[-60px] w-48 h-48 bg-white/5 rounded-full" />

          <div className="relative z-10 text-center text-white max-w-sm">
            <div className="bg-black border border-neutral-800 p-2.5 rounded-2xl shadow-xl inline-block mx-auto mb-6">
              <img src="/logo.png" alt="Sigmenta" className="h-16 w-auto object-contain" />
            </div>
            <h1 className="text-3xl font-black mb-2 tracking-wide">{BRAND.name}™</h1>
            <p className="text-neutral-400 text-sm uppercase tracking-widest font-extrabold mb-8">{BRAND.tagline}</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { icon: '🛍️', label: 'প্রিমিয়াম পোশাক' },
                { icon: '🚚', label: 'দ্রুত ডেলিভারি' },
                { icon: '💳', label: 'নিরাপদ পেমেন্ট' },
                { icon: '↩️', label: 'সহজ রিটার্ন' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-white/10 rounded-xl p-3 flex items-center gap-2 backdrop-blur-sm"
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium text-xs sm:text-sm">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Login Form ── */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 py-10">
          <div className="w-full max-w-md">
            {/* Top Navigation */}
            <div className="flex items-center justify-between mb-6">
              <Link
                to={ROUTES.HOME}
                className="inline-flex items-center gap-1.5 text-xs text-[#77717A] hover:text-[var(--color-primary)] transition-colors font-bangla font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>হোমে ফিরে যান</span>
              </Link>
            </div>

            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-6">
              <Link to={ROUTES.HOME} className="inline-flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl bg-black border border-neutral-800 p-1 flex items-center justify-center flex-shrink-0 shadow-xs">
                  <img src="/logo-icon.png" alt="Sigmenta Logo" className="w-full h-full object-contain" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-sans font-black text-xl text-[var(--color-dark)] leading-tight tracking-wider">
                    Sigmenta™
                  </span>
                  <span className="text-[10px] font-extrabold tracking-widest uppercase text-[var(--color-text-muted)] -mt-0.5">
                    {BRAND.tagline}
                  </span>
                </div>
              </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-[#F0E2E8] p-7 sm:p-8">
              <h2 className="text-2xl font-bold text-[#292329] mb-1">{t('auth.login')}</h2>
              <p className="text-[#77717A] text-sm mb-6">
                আপনার অ্যাকাউন্টে প্রবেশ করুন
              </p>

              {/* Google Sign-In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isSubmitting}
                className="w-full flex items-center justify-center gap-3 border-2 border-[#F0E2E8] rounded-xl py-3 px-4 text-[#292329] font-medium hover:bg-[#FFF8FA] hover:border-[#D45D83] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mb-5"
              >
                {isGoogleLoading ? (
                  <div className="w-5 h-5 border-2 border-[#D45D83] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                Google দিয়ে লগইন করুন
              </button>

              {/* Divider */}
              <div className="relative flex items-center mb-5">
                <div className="flex-1 border-t border-[#F0E2E8]" />
                <span className="px-3 text-[#77717A] text-sm bg-white">অথবা</span>
                <div className="flex-1 border-t border-[#F0E2E8]" />
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                {/* Email */}
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
                      errors.email
                        ? 'border-red-400 ring-1 ring-red-300'
                        : 'border-[#F0E2E8]'
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-[#292329] mb-1.5"
                  >
                    {t('auth.password')}
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      {...register('password')}
                      className={`w-full px-4 py-3 pr-11 rounded-xl border text-[#292329] placeholder-[#77717A] bg-[#FFF8FA] focus:outline-none focus:ring-2 focus:ring-[#D45D83] focus:border-[#D45D83] transition-colors text-sm ${
                        errors.password
                          ? 'border-red-400 ring-1 ring-red-300'
                          : 'border-[#F0E2E8]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77717A] hover:text-[#D45D83] transition-colors"
                      aria-label={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                  )}
                </div>

                {/* Forgot password */}
                <div className="flex justify-end">
                  <Link
                    to={ROUTES.FORGOT_PASSWORD}
                    className="text-sm text-[#D45D83] hover:text-[#B8446C] font-medium transition-colors"
                  >
                    {t('auth.forgot_password')}
                  </Link>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting || isGoogleLoading}
                  className="w-full bg-[#D45D83] hover:bg-[#B8446C] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 text-base shadow-md shadow-[#D45D83]/20"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      লগইন করুন
                    </>
                  )}
                </button>
              </form>

              {/* Register link */}
              <p className="mt-6 text-center text-sm text-[#77717A]">
                {t('auth.no_account')}{' '}
                <Link
                  to={ROUTES.REGISTER}
                  className="text-[#D45D83] hover:text-[#B8446C] font-semibold transition-colors"
                >
                  নিবন্ধন করুন
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
