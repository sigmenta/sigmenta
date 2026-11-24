// ─── Admin Login Page ─────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { ROUTES, COLLECTIONS, BRAND } from '@/constants';
import { Eye, EyeOff, ShieldAlert, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('ইমেইল ও পাসওয়ার্ড দিন।');
      return;
    }

    setLoading(true);

    try {
      // 1. Sign in with Firebase Auth
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const uid = credential.user.uid;

      // 2. Check Firestore user doc
      const userRef = doc(db, COLLECTIONS.USERS, uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        setError('অ্যাডমিন প্রোফাইল খুঁজে পাওয়া যায়নি।');
        await signOut(auth);
        setLoading(false);
        return;
      }

      const role = userDoc.data()?.role;
      if (role !== 'admin' && role !== 'super_admin') {
        setError('এই অ্যাকাউন্টে অ্যাডমিন অ্যাক্সেস নেই।');
        await signOut(auth);
        setLoading(false);
        return;
      }

      toast.success('অ্যাডমিন প্যানেলে স্বাগতম!');
      navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        setError('ইমেইল বা পাসওয়ার্ড ভুল। আবার চেষ্টা করুন।');
      } else if (code === 'auth/too-many-requests') {
        setError('অনেকবার ব্যর্থ চেষ্টা। কিছুক্ষণ পর আবার চেষ্টা করুন।');
      } else if (code === 'auth/network-request-failed') {
        setError('নেটওয়ার্ক সমস্যা। ইন্টারনেট সংযোগ চেক করুন।');
      } else {
        setError('লগইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
      }
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>অ্যাডমিন লগইন — {BRAND.nameBn}</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-3 p-3 bg-white rounded-2xl shadow-sm border border-slate-200 mb-3">
              <div className="w-12 h-12 rounded-xl bg-black border border-neutral-800 p-1 flex items-center justify-center flex-shrink-0">
                <img src="/logo-icon.png" alt="Sigmenta Logo" className="w-full h-full object-contain" />
              </div>
              <div className="text-left">
                <h1 className="text-lg font-black text-neutral-900 leading-tight tracking-wider">Sigmenta™</h1>
                <p className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-widest">{BRAND.tagline}</p>
              </div>
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs font-semibold text-white">
                <Lock size={12} />
                <span>অ্যাডমিন কন্ট্রোল প্যানেল</span>
              </div>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-pink-100">
            <h2 className="text-lg font-semibold text-[#292329] mb-5">লগইন করুন</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-700">
                <ShieldAlert size={16} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  ইমেইল ঠিকানা
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  পাসওয়ার্ড
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D45D83]/30 focus:border-[#D45D83] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#D45D83] hover:bg-[#B8446C] text-white font-semibold rounded-xl text-sm transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    লগইন হচ্ছে...
                  </span>
                ) : (
                  'লগইন করুন'
                )}
              </button>
            </form>

            <p className="text-xs text-gray-400 text-center mt-5">
              এই পৃষ্ঠাটি শুধুমাত্র অ্যাডমিনদের জন্য।<br />
              নতুন অ্যাকাউন্ট তৈরি এখান থেকে সম্ভব নয়।
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
