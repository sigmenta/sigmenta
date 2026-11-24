// ─── Women's Favorite — Account Dashboard Page ──────────────────────────────
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  doc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';
import {
  User,
  Package,
  MapPin,
  Heart,
  Pencil,
  X,
  Check,
  Trash2,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { db } from '@/lib/firebase';
import { useAuth } from '@/features/auth/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ROUTES,
  COLLECTIONS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_LABELS_EN,
  ORDER_STATUS_COLORS,
  BRAND,
} from '@/constants';
import type { Order } from '@/types';

/* ── Helpers ── */
const formatDate = (ts: { toDate?: () => Date } | null | undefined, isBangla = true): string => {
  if (!ts || typeof ts.toDate !== 'function') return '—';
  return ts.toDate().toLocaleDateString(isBangla ? 'bn-BD' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatPrice = (amount: number, isBangla = true): string =>
  `৳${amount.toLocaleString(isBangla ? 'bn-BD' : 'en-US')}`;

/* ── Profile Edit Schema ── */
const BDPhoneRegex = /^(?:\+8801|8801|01)[3-9]\d{8}$/;

const profileSchema = z.object({
  displayName: z.string().min(2, 'নাম কমপক্ষে ২ অক্ষরের হতে হবে').max(60),
  phoneNumber: z
    .string()
    .refine(
      (v) => v === '' || BDPhoneRegex.test(v),
      'সঠিক বাংলাদেশি মোবাইল নম্বর দিন'
    )
    .optional()
    .or(z.literal('')),
  photoURL: z
    .string()
    .url('সঠিক URL দিন')
    .optional()
    .or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

/* ── Sidebar tabs ── */
type Tab = 'profile' | 'orders' | 'addresses' | 'wishlist';

const TABS: { id: Tab; icon: React.ElementType; labelBn: string; labelEn: string }[] = [
  { id: 'profile', icon: User, labelBn: 'প্রোফাইল', labelEn: 'Profile' },
  { id: 'orders', icon: Package, labelBn: 'অর্ডার', labelEn: 'Orders' },
  { id: 'addresses', icon: MapPin, labelBn: 'ঠিকানা', labelEn: 'Addresses' },
  { id: 'wishlist', icon: Heart, labelBn: 'পছন্দের তালিকা', labelEn: 'Wishlist' },
];

/* ══════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════ */
export default function AccountPage(): React.ReactElement {
  const navigate = useNavigate();
  const { user, firebaseUser, isLoading } = useAuth();
  const { t, isBangla } = useLanguage();

  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [wishlistCount] = useState<number>(0); // loaded from localStorage/context

  /* Redirect if not logged in */
  useEffect(() => {
    if (!isLoading && !user) {
      navigate(ROUTES.LOGIN, { state: { from: ROUTES.ACCOUNT } });
    }
  }, [user, isLoading, navigate]);

  /* Fetch recent orders */
  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      setOrdersLoading(true);
      try {
        const q = query(
          collection(db, COLLECTIONS.ORDERS),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
        const snap = await getDocs(q);
        setRecentOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
      } catch {
        /* silent */
      } finally {
        setOrdersLoading(false);
      }
    };
    void fetchOrders();
  }, [user]);

  /* Form */
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName ?? '',
      phoneNumber: user?.phoneNumber ?? '',
      photoURL: user?.photoURL ?? '',
    },
  });

  /* Sync form when user changes */
  useEffect(() => {
    if (user) {
      reset({
        displayName: user.displayName ?? '',
        phoneNumber: user.phoneNumber ?? '',
        photoURL: user.photoURL ?? '',
      });
    }
  }, [user, reset]);

  const onProfileSave = async (data: ProfileFormData): Promise<void> => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), {
        displayName: data.displayName,
        phoneNumber: data.phoneNumber ?? '',
        photoURL: data.photoURL ?? '',
        updatedAt: serverTimestamp(),
      });
      toast.success(isBangla ? 'প্রোফাইল আপডেট হয়েছে!' : 'Profile updated successfully!');
      setIsEditing(false);
    } catch {
      toast.error(isBangla ? 'আপডেট ব্যর্থ হয়েছে। আবার চেষ্টা করুন।' : 'Update failed. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRequest = async (): Promise<void> => {
    if (!user) return;
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), {
        deletionRequestedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success(isBangla ? 'অ্যাকাউন্ট মুছে ফেলার অনুরোধ পাঠানো হয়েছে।' : 'Account deletion request submitted.');
      setShowDeleteModal(false);
    } catch {
      toast.error(isBangla ? 'অনুরোধ পাঠানো ব্যর্থ হয়েছে।' : 'Failed to submit request.');
    }
  };

  /* ── Avatar Initials ── */
  const getInitials = (name: string): string =>
    name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#FFF8FA] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#D45D83] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{isBangla ? 'আমার অ্যাকাউন্ট' : 'My Account'} — {BRAND.name}</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="min-h-screen bg-[#FFF8FA]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* ── Page Title ── */}
          <h1 className="text-2xl font-bold text-[#292329] mb-6">
            {isBangla ? 'আমার অ্যাকাউন্ট' : 'My Account'}
          </h1>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* ── Sidebar ── */}
            <aside className="lg:w-64 shrink-0">
              {/* Avatar + name card */}
              <div className="bg-white rounded-2xl border border-[#F0E2E8] p-5 mb-4 text-center">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-16 h-16 rounded-full mx-auto mb-3 object-cover border-2 border-[#F7C8D5]"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full mx-auto mb-3 bg-gradient-to-br from-[#D45D83] to-[#B8446C] flex items-center justify-center text-white font-bold text-xl">
                    {getInitials(user.displayName || 'U')}
                  </div>
                )}
                <p className="font-semibold text-[#292329] text-sm">{user.displayName}</p>
                <p className="text-[#77717A] text-xs truncate">{user.email}</p>
                {!firebaseUser?.emailVerified && (
                  <span className="inline-block mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    {isBangla ? 'ইমেইল যাচাই বাকি' : 'Email verification pending'}
                  </span>
                )}
              </div>

              {/* Nav tabs */}
              <nav className="bg-white rounded-2xl border border-[#F0E2E8] overflow-hidden">
                {TABS.map(({ id, icon: Icon, labelBn, labelEn }) => (
                  <button
                    key={id}
                    onClick={() => {
                      if (id === 'orders') {
                        navigate(ROUTES.ACCOUNT_ORDERS);
                        return;
                      }
                      if (id === 'addresses') {
                        navigate(ROUTES.ACCOUNT_ADDRESSES);
                        return;
                      }
                      if (id === 'wishlist') {
                        navigate(ROUTES.ACCOUNT_WISHLIST);
                        return;
                      }
                      setActiveTab(id);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-colors border-b border-[#F0E2E8] last:border-b-0 ${
                      activeTab === id && id === 'profile'
                        ? 'text-[#D45D83] bg-[#FFF8FA]'
                        : 'text-[#77717A] hover:text-[#D45D83] hover:bg-[#FFF8FA]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {isBangla ? labelBn : labelEn}
                    <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-50" />
                  </button>
                ))}
              </nav>
            </aside>

            {/* ── Main Content ── */}
            <main className="flex-1">
              {activeTab === 'profile' && (
                <div className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl border border-[#F0E2E8] p-5 text-center">
                      <p className="text-3xl font-bold text-[#D45D83]">
                        {recentOrders.length}
                      </p>
                      <p className="text-xs text-[#77717A] mt-1">
                        {isBangla ? 'মোট অর্ডার' : 'Total Orders'}
                      </p>
                    </div>
                    <div className="bg-white rounded-2xl border border-[#F0E2E8] p-5 text-center">
                      <p className="text-3xl font-bold text-[#D45D83]">{wishlistCount}</p>
                      <p className="text-xs text-[#77717A] mt-1">
                        {isBangla ? 'পছন্দের পণ্য' : 'Wishlist Items'}
                      </p>
                    </div>
                  </div>

                  {/* Profile Card */}
                  <div className="bg-white rounded-2xl border border-[#F0E2E8] p-6">
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-lg font-bold text-[#292329]">
                        {isBangla ? 'প্রোফাইল তথ্য' : 'Profile Information'}
                      </h2>
                      {!isEditing && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="flex items-center gap-1.5 text-sm text-[#D45D83] hover:text-[#B8446C] font-medium transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                          {isBangla ? 'সম্পাদনা' : 'Edit'}
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <form onSubmit={handleSubmit(onProfileSave)} className="space-y-4">
                        {/* Display Name */}
                        <div>
                          <label className="block text-sm font-medium text-[#292329] mb-1.5">
                            {isBangla ? 'পুরো নাম' : 'Full Name'}
                          </label>
                          <input
                            type="text"
                            {...register('displayName')}
                            className={`w-full px-4 py-3 rounded-xl border text-[#292329] bg-[#FFF8FA] focus:outline-none focus:ring-2 focus:ring-[#D45D83] text-sm ${
                              errors.displayName ? 'border-red-400' : 'border-[#F0E2E8]'
                            }`}
                          />
                          {errors.displayName && (
                            <p className="mt-1 text-xs text-red-500">
                              {errors.displayName.message}
                            </p>
                          )}
                        </div>

                        {/* Phone */}
                        <div>
                          <label className="block text-sm font-medium text-[#292329] mb-1.5">
                            {isBangla ? 'মোবাইল নম্বর' : 'Phone Number'}
                          </label>
                          <input
                            type="tel"
                            placeholder="01XXXXXXXXX"
                            {...register('phoneNumber')}
                            className={`w-full px-4 py-3 rounded-xl border text-[#292329] bg-[#FFF8FA] focus:outline-none focus:ring-2 focus:ring-[#D45D83] text-sm ${
                              errors.phoneNumber ? 'border-red-400' : 'border-[#F0E2E8]'
                            }`}
                          />
                          {errors.phoneNumber && (
                            <p className="mt-1 text-xs text-red-500">
                              {errors.phoneNumber.message}
                            </p>
                          )}
                        </div>

                        {/* Photo URL */}
                        <div>
                          <label className="block text-sm font-medium text-[#292329] mb-1.5">
                            {isBangla ? 'প্রোফাইল ছবির URL ' : 'Profile Photo URL '}
                            <span className="text-[#77717A] font-normal">
                              ({isBangla ? 'ঐচ্ছিক' : 'Optional'})
                            </span>
                          </label>
                          <input
                            type="url"
                            placeholder="https://..."
                            {...register('photoURL')}
                            className={`w-full px-4 py-3 rounded-xl border text-[#292329] bg-[#FFF8FA] focus:outline-none focus:ring-2 focus:ring-[#D45D83] text-sm ${
                              errors.photoURL ? 'border-red-400' : 'border-[#F0E2E8]'
                            }`}
                          />
                          {errors.photoURL && (
                            <p className="mt-1 text-xs text-red-500">{errors.photoURL.message}</p>
                          )}
                        </div>

                        {/* Email (readonly) */}
                        <div>
                          <label className="block text-sm font-medium text-[#292329] mb-1.5">
                            {isBangla ? 'ইমেইল ' : 'Email '}
                            <span className="text-[#77717A] font-normal">
                              ({isBangla ? 'পরিবর্তনযোগ্য নয়' : 'Cannot be changed'})
                            </span>
                          </label>
                          <input
                            type="email"
                            value={user.email}
                            disabled
                            className="w-full px-4 py-3 rounded-xl border border-[#F0E2E8] text-[#77717A] bg-gray-50 text-sm cursor-not-allowed"
                          />
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button
                            type="submit"
                            disabled={isSaving}
                            className="flex items-center gap-2 bg-[#D45D83] hover:bg-[#B8446C] text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-60"
                          >
                            {isSaving ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            {isBangla ? 'সংরক্ষণ করুন' : 'Save Changes'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditing(false);
                              reset();
                            }}
                            className="flex items-center gap-2 text-[#77717A] hover:text-[#292329] px-5 py-2.5 rounded-xl font-medium text-sm border border-[#F0E2E8] hover:border-[#D45D83] transition-colors"
                          >
                            <X className="w-4 h-4" />
                            {isBangla ? 'বাতিল' : 'Cancel'}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <dl className="space-y-4">
                        {[
                          { label: isBangla ? 'পুরো নাম' : 'Full Name', value: user.displayName || '—' },
                          { label: isBangla ? 'ইমেইল' : 'Email', value: user.email || '—' },
                          {
                            label: isBangla ? 'মোবাইল নম্বর' : 'Phone Number',
                            value: user.phoneNumber || (isBangla ? 'দেওয়া হয়নি' : 'Not provided'),
                          },
                          {
                            label: isBangla ? 'অ্যাকাউন্ট তৈরির তারিখ' : 'Account Created',
                            value: formatDate(user.createdAt, isBangla),
                          },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex flex-col sm:flex-row sm:gap-4">
                            <dt className="text-xs text-[#77717A] sm:w-40 shrink-0">{label}</dt>
                            <dd className="text-sm font-medium text-[#292329]">{value}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </div>

                  {/* Recent Orders */}
                  <div className="bg-white rounded-2xl border border-[#F0E2E8] p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-[#292329]">
                        {isBangla ? 'সাম্প্রতিক অর্ডার' : 'Recent Orders'}
                      </h2>
                      <Link
                        to={ROUTES.ACCOUNT_ORDERS}
                        className="text-sm text-[#D45D83] hover:text-[#B8446C] font-medium"
                      >
                        {isBangla ? 'সব দেখুন' : 'View All'}
                      </Link>
                    </div>

                    {ordersLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
                        ))}
                      </div>
                    ) : recentOrders.length === 0 ? (
                      <p className="text-sm text-[#77717A] text-center py-6">
                        {isBangla ? 'কোনো অর্ডার নেই। কেনাকাটা শুরু করুন!' : 'No orders yet. Start shopping!'}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {recentOrders.map((order) => (
                          <Link
                            key={order.id}
                            to={ROUTES.ACCOUNT_ORDER_DETAIL.replace(':orderId', order.id)}
                            className="flex items-center justify-between p-3.5 rounded-xl border border-[#F0E2E8] hover:border-[#D45D83] hover:bg-[#FFF8FA] transition-all group"
                          >
                            <div>
                              <p className="text-sm font-semibold text-[#292329] group-hover:text-[#D45D83] transition-colors">
                                {order.orderReference}
                              </p>
                              <p className="text-xs text-[#77717A]">
                                {formatDate(order.createdAt, isBangla)} · {order.items.length}{' '}
                                {isBangla ? 'পণ্য' : 'items'}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span
                                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                  ORDER_STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {(isBangla
                                  ? ORDER_STATUS_LABELS[order.status]
                                  : ORDER_STATUS_LABELS_EN[order.status]) ?? order.status}
                              </span>
                              <span className="text-sm font-bold text-[#292329]">
                                {formatPrice(order.total, isBangla)}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Danger Zone */}
                  <div className="bg-white rounded-2xl border border-red-100 p-6">
                    <h2 className="text-base font-bold text-red-600 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      {isBangla ? 'বিপদ জোন' : 'Danger Zone'}
                    </h2>
                    <p className="text-sm text-[#77717A] mb-4">
                      {isBangla
                        ? 'অ্যাকাউন্ট মুছে ফেলার অনুরোধ করলে আমাদের টিম ৭ কার্যদিবসের মধ্যে প্রক্রিয়া করবে।'
                        : 'If you request account deletion, our team will process it within 7 business days.'}
                    </p>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 border border-red-200 hover:bg-red-50 px-4 py-2.5 rounded-xl font-medium transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      {isBangla ? 'অ্যাকাউন্ট মুছে ফেলার অনুরোধ' : 'Request Account Deletion'}
                    </button>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-[#292329] text-center mb-2">
              {isBangla ? 'অ্যাকাউন্ট মুছে ফেলার অনুরোধ' : 'Request Account Deletion'}
            </h3>
            <p className="text-sm text-[#77717A] text-center mb-6">
              {isBangla
                ? 'এই অনুরোধ পাঠানোর পরে আমাদের টিম যোগাযোগ করবে। আপনার ডেটা নিরাপদে মুছে ফেলা হবে।'
                : 'Our team will contact you after receiving this request. Your data will be deleted safely.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteRequest}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                {isBangla ? 'অনুরোধ পাঠান' : 'Submit Request'}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 border border-[#F0E2E8] text-[#77717A] hover:text-[#292329] font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                {isBangla ? 'বাতিল' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
