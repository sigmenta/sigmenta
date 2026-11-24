// ─── Admin First-Time Setup Page ─────────────────────────────────────────────
// এই page শুধু প্রথমবার কাজ করে — যখন কোনো admin নেই।
// একবার admin তৈরি হলে এই page আর কাজ করবে না।
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { ROUTES, COLLECTIONS, BRAND } from '@/constants';
import { Eye, EyeOff, ShieldCheck, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

type Step = 'checking' | 'allowed' | 'blocked';

export default function AdminSetupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('checking');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // প্রথমে check করো — admin setup হয়েছে কিনা
  useEffect(() => {
    async function checkAdminExists() {
      try {
        // Check adminConfig/initialized marker
        const { getDoc } = await import('firebase/firestore');
        const initDoc = await getDoc(doc(db, 'adminConfig', 'initialized'));
        if (initDoc.exists()) {
          setStep('blocked');
          return;
        }
        // Double-check: query users for any admin
        const q = query(
          collection(db, COLLECTIONS.USERS),
          where('role', 'in', ['admin', 'super_admin'])
        );
        const snap = await getDocs(q);
        if (snap.size > 0) {
          setStep('blocked');
        } else {
          setStep('allowed');
        }
      } catch {
        setStep('allowed'); // firestore error — allow setup
      }
    }
    checkAdminExists();
  }, []);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !confirmPassword) {
      setError('সব field পূরণ করুন।');
      return;
    }
    if (password.length < 6) {
      setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }
    if (password !== confirmPassword) {
      setError('পাসওয়ার্ড দুটো মিলছে না।');
      return;
    }

    setLoading(true);

    try {
      let uid: string;

      // চেষ্টা করো new account তৈরি করতে
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        uid = cred.user.uid;
      } catch (createErr: unknown) {
        const code = (createErr as { code?: string })?.code;
        if (code === 'auth/email-already-in-use') {
          // Account আছে — login করার চেষ্টা করো
          try {
            const cred = await signInWithEmailAndPassword(auth, email, password);
            uid = cred.user.uid;
          } catch (loginErr: unknown) {
            const loginCode = (loginErr as { code?: string })?.code;
            if (
              loginCode === 'auth/invalid-credential' ||
              loginCode === 'auth/wrong-password'
            ) {
              setError(
                'এই ইমেইলে Firebase এ account আছে কিন্তু পাসওয়ার্ড ভুল। ' +
                'অন্য একটি ইমেইল ব্যবহার করুন অথবা Firebase Console থেকে এই account টি আগে delete করুন।'
              );
            } else {
              setError('লগইন ব্যর্থ: ' + ((loginErr as { message?: string })?.message ?? 'অজানা error'));
            }
            setLoading(false);
            return;
          }
        } else if (code === 'auth/weak-password') {
          setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
          setLoading(false);
          return;
        } else if (code === 'auth/invalid-email') {
          setError('সঠিক ইমেইল দিন।');
          setLoading(false);
          return;
        } else if (code === 'auth/operation-not-allowed') {
          setError('Firebase Console এ Email/Password authentication enable করুন: Authentication → Sign-in method → Email/Password → Enable।');
          setLoading(false);
          return;
        } else {
          throw createErr;
        }
      }

      // Firestore এ super_admin হিসেবে save করো
      await setDoc(
        doc(db, COLLECTIONS.USERS, uid),
        {
          uid,
          email,
          displayName: 'সুপার অ্যাডমিন',
          role: 'super_admin',
          isActive: true,
          addresses: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Setup সম্পন্ন হয়েছে — এই marker লিখলে আর কেউ setup করতে পারবে না
      await setDoc(doc(db, 'adminConfig', 'initialized'), {
        initializedAt: serverTimestamp(),
        initializedBy: email,
      });

      toast.success('✅ সুপার অ্যাডমিন তৈরি সফল! এখন লগইন করুন।');
      navigate(ROUTES.ADMIN_LOGIN, { replace: true });
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/operation-not-allowed') {
        setError('Firebase Console এ Email/Password authentication enable করুন: Authentication → Sign-in method → Email/Password → Enable।');
      } else {
        setError('সমস্যা হয়েছে: ' + ((err as { message?: string })?.message ?? 'অজানা error'));
      }
      setLoading(false);
    }
  };

  // ─── Checking state ───────────────────────────────────────────────────────────
  if (step === 'checking') {
    return (
      <div className="min-h-screen bg-[#FFF8FA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-[#F7C8D5] border-t-[#D45D83] animate-spin" />
          <p className="text-sm text-[#77717A]">চেক করা হচ্ছে...</p>
        </div>
      </div>
    );
  }

  // ─── Blocked: admin already exists ───────────────────────────────────────────
  if (step === 'blocked') {
    return (
      <>
        <Helmet><title>Setup — {BRAND.nameBn}</title></Helmet>
        <div className="min-h-screen bg-gradient-to-br from-[#FFF8FA] to-pink-100 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8 border border-pink-100 text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-amber-500" />
            </div>
            <h2 className="text-lg font-bold text-[#292329] mb-2">Setup সম্পন্ন হয়েছে</h2>
            <p className="text-sm text-gray-500 mb-6">
              ইতিমধ্যে একজন অ্যাডমিন আছেন।<br />
              এই page আর কাজ করবে না।
            </p>
            <button
              onClick={() => navigate(ROUTES.ADMIN_LOGIN)}
              className="w-full py-2.5 bg-[#D45D83] text-white font-semibold rounded-xl text-sm hover:bg-[#B8446C] transition-all"
            >
              অ্যাডমিন লগইনে যান
            </button>
          </div>
        </div>
      </>
    );
  }

  // ─── Allowed: first-time setup form ──────────────────────────────────────────
  return (
    <>
      <Helmet><title>প্রথমবার Setup — {BRAND.nameBn}</title></Helmet>

      <div className="min-h-screen bg-gradient-to-br from-[#FFF8FA] to-pink-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-pink-100 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck size={32} className="text-[#D45D83]" />
            </div>
            <h1 className="text-xl font-bold text-[#292329]">প্রথম অ্যাডমিন তৈরি</h1>
            <p className="text-sm text-gray-500 mt-1">
              এটি শুধু একবার কাজ করবে।
            </p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-pink-100">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-700">
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSetup} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  অ্যাডমিন ইমেইল
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="admin@example.com"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D45D83]/30 focus:border-[#D45D83] transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  পাসওয়ার্ড <span className="text-gray-400">(কমপক্ষে ৬ অক্ষর)</span>
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D45D83]/30 focus:border-[#D45D83] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  পাসওয়ার্ড নিশ্চিত করুন
                </label>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D45D83]/30 focus:border-[#D45D83] transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#D45D83] hover:bg-[#B8446C] text-white font-semibold rounded-xl text-sm transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    তৈরি হচ্ছে...
                  </span>
                ) : (
                  'সুপার অ্যাডমিন তৈরি করুন'
                )}
              </button>
            </form>

            <p className="text-xs text-gray-400 text-center mt-4">
              অ্যাডমিন তৈরির পর এই page নিষ্ক্রিয় হয়ে যাবে।
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
