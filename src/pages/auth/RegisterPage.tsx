// ─── Women's Favorite — Register Page ──────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Eye, EyeOff, UserPlus, ShoppingBag, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/features/auth/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ROUTES, COLLECTIONS, BRAND } from '@/constants';

/* ── Helpers ── */
function getRegisterErrorMessage(code: string): string {
  const map: Record<string, string> = {
    'auth/email-already-in-use': 'এই ইমেইলে ইতিমধ্যে অ্যাকাউন্ট আছে।',
    'auth/invalid-email': 'ইমেইল ঠিকানাটি সঠিক নয়।',
    'auth/weak-password': 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।',
    'auth/network-request-failed': 'নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।',
    'auth/operation-not-allowed': 'এই ধরনের নিবন্ধন অনুমোদিত নয়।',
  };
  return map[code] ?? 'নিবন্ধন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।';
}

/* ── Zod Schema ── */
const BDPhoneRegex = /^(?:\+8801|8801|01)[3-9]\d{8}$/;

const registerSchema = z
  .object({
    displayName: z
      .string()
      .min(2, 'নাম কমপক্ষে ২ অক্ষরের হতে হবে')
      .max(60, 'নাম সর্বোচ্চ ৬০ অক্ষরের হতে পারে'),
    phone: z
      .string()
      .min(1, 'মোবাইল নম্বর আবশ্যক')
      .regex(BDPhoneRegex, 'সঠিক বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 01XXXXXXXXX)'),
    email: z
      .string()
      .min(1, 'ইমেইল আবশ্যক')
      .email('সঠিক ইমেইল দিন'),
    password: z
      .string()
      .min(8, 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে')
      .regex(/[A-Z]/, 'কমপক্ষে একটি বড় হাতের অক্ষর থাকতে হবে')
      .regex(/[0-9]/, 'কমপক্ষে একটি সংখ্যা থাকতে হবে'),
    confirmPassword: z.string().min(1, 'পাসওয়ার্ড নিশ্চিত করুন'),
    agreeToTerms: z.literal(true, {
      errorMap: () => ({ message: 'শর্তাবলী মেনে নিতে হবে' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'পাসওয়ার্ড দুটি মিলছে না',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

/* ══════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════ */
export default function RegisterPage(): React.ReactElement {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* Redirect if already logged in */
  useEffect(() => {
    if (!isLoading && user) {
      navigate(ROUTES.HOME, { replace: true });
    }
  }, [user, isLoading, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData): Promise<void> => {
    setIsSubmitting(true);
    try {
      /* 1. Create Firebase Auth user */
      const credential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const firebaseUser = credential.user;

      /* 2. Update displayName in Firebase Auth */
      await updateProfile(firebaseUser, { displayName: data.displayName });

      /* 3. Create Firestore UserProfile */
      await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), {
        uid: firebaseUser.uid,
        email: data.email,
        emailVerified: false,
        displayName: data.displayName,
        phoneNumber: data.phone,
        photoURL: null,
        role: 'customer',
        isActive: true,
        addresses: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });

      /* 4. Send email verification */
      await sendEmailVerification(firebaseUser);

      toast.success('নিবন্ধন সফল! স্বাগতম 🎉 ইমেইল যাচাই করুন।');
      navigate(ROUTES.HOME, { replace: true });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      toast.error(getRegisterErrorMessage(code));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>নিবন্ধন — {BRAND.name}</title>
        <meta
          name="description"
          content="Sigmenta-এ নিবন্ধন করুন এবং প্রিমিয়াম ফ্যাশন উপভোগ করুন।"
        />
      </Helmet>

      <div className="min-h-screen bg-[var(--color-bg-light)] flex items-center justify-center p-4 py-10">
        <div className="w-full max-w-lg">
          {/* Top Navigation & Logo */}
          <div className="flex items-center justify-between mb-4">
            <Link
              to={ROUTES.HOME}
              className="inline-flex items-center gap-1.5 text-xs text-[#77717A] hover:text-[var(--color-primary)] transition-colors font-bangla font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>হোমে ফিরে যান</span>
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
            <h2 className="text-2xl font-bold text-[#292329] mb-1">{t('auth.register')}</h2>
            <p className="text-[#77717A] text-sm mb-6">
              নতুন অ্যাকাউন্ট তৈরি করুন — সম্পূর্ণ বিনামূল্যে
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {/* Full Name */}
              <div>
                <label
                  htmlFor="displayName"
                  className="block text-sm font-medium text-[#292329] mb-1.5"
                >
                  {t('auth.name')} <span className="text-red-500">*</span>
                </label>
                <input
                  id="displayName"
                  type="text"
                  autoComplete="name"
                  placeholder="আপনার পুরো নাম"
                  {...register('displayName')}
                  className={`w-full px-4 py-3 rounded-xl border text-[#292329] placeholder-[#77717A] bg-[#FFF8FA] focus:outline-none focus:ring-2 focus:ring-[#D45D83] focus:border-[#D45D83] transition-colors text-sm ${
                    errors.displayName ? 'border-red-400' : 'border-[#F0E2E8]'
                  }`}
                />
                {errors.displayName && (
                  <p className="mt-1 text-xs text-red-500">{errors.displayName.message}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-[#292329] mb-1.5"
                >
                  {t('auth.phone')} <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="01XXXXXXXXX"
                  {...register('phone')}
                  className={`w-full px-4 py-3 rounded-xl border text-[#292329] placeholder-[#77717A] bg-[#FFF8FA] focus:outline-none focus:ring-2 focus:ring-[#D45D83] focus:border-[#D45D83] transition-colors text-sm ${
                    errors.phone ? 'border-red-400' : 'border-[#F0E2E8]'
                  }`}
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-[#292329] mb-1.5"
                >
                  {t('auth.email')} <span className="text-red-500">*</span>
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

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[#292329] mb-1.5"
                >
                  {t('auth.password')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="কমপক্ষে ৮ অক্ষর"
                    {...register('password')}
                    className={`w-full px-4 py-3 pr-11 rounded-xl border text-[#292329] placeholder-[#77717A] bg-[#FFF8FA] focus:outline-none focus:ring-2 focus:ring-[#D45D83] focus:border-[#D45D83] transition-colors text-sm ${
                      errors.password ? 'border-red-400' : 'border-[#F0E2E8]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77717A] hover:text-[#D45D83] transition-colors"
                    aria-label={showPassword ? 'লুকান' : 'দেখুন'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-[#292329] mb-1.5"
                >
                  {t('auth.confirm_password')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="পাসওয়ার্ড আবার দিন"
                    {...register('confirmPassword')}
                    className={`w-full px-4 py-3 pr-11 rounded-xl border text-[#292329] placeholder-[#77717A] bg-[#FFF8FA] focus:outline-none focus:ring-2 focus:ring-[#D45D83] focus:border-[#D45D83] transition-colors text-sm ${
                      errors.confirmPassword ? 'border-red-400' : 'border-[#F0E2E8]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77717A] hover:text-[#D45D83] transition-colors"
                    aria-label={showConfirm ? 'লুকান' : 'দেখুন'}
                  >
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start gap-2.5">
                <input
                  id="agreeToTerms"
                  type="checkbox"
                  {...register('agreeToTerms')}
                  className="mt-0.5 w-4 h-4 accent-[#D45D83] cursor-pointer rounded"
                />
                <label htmlFor="agreeToTerms" className="text-sm text-[#77717A] cursor-pointer">
                  আমি{' '}
                  <Link
                    to={ROUTES.TERMS}
                    target="_blank"
                    className="text-[#D45D83] hover:underline font-medium"
                  >
                    শর্তাবলী
                  </Link>{' '}
                  ও{' '}
                  <Link
                    to={ROUTES.PRIVACY_POLICY}
                    target="_blank"
                    className="text-[#D45D83] hover:underline font-medium"
                  >
                    গোপনীয়তা নীতি
                  </Link>{' '}
                  মেনে নিচ্ছি।
                </label>
              </div>
              {errors.agreeToTerms && (
                <p className="text-xs text-red-500 -mt-2">{errors.agreeToTerms.message}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#D45D83] hover:bg-[#B8446C] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 text-base shadow-md shadow-[#D45D83]/20 mt-2"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    অ্যাকাউন্ট তৈরি করুন
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#77717A]">
              {t('auth.have_account')}{' '}
              <Link
                to={ROUTES.LOGIN}
                className="text-[#D45D83] hover:text-[#B8446C] font-semibold transition-colors"
              >
                লগইন করুন
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
