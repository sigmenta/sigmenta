import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  ShieldCheck, UserPlus, Trash2, AlertTriangle, Shield, CheckCircle, Info
} from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { db } from '@/lib/firebase';
import { useAuth } from '@/features/auth/AuthContext';
import { COLLECTIONS, USER_ROLES } from '@/constants';
import type { UserProfile, UserRole } from '@/types';

export const AdminRolesPage: React.FC = () => {
  const { user, isSuperAdmin } = useAuth();
  const [admins, setAdmins] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Grant role state
  const [emailToPromote, setEmailToPromote] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [isPromoting, setIsPromoting] = useState(false);

  const loadAdmins = async () => {
    setIsLoading(true);
    try {
      const q = query(
        collection(db, COLLECTIONS.USERS),
        where('role', 'in', [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN])
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ uid: d.id, ...d.data() })) as UserProfile[];
      setAdmins(list);
    } catch (err) {
      toast.error('অ্যাডমিন তালিকা লোড করা যায়নি');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleGrantRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      toast.error('শুধুমাত্র সুপার অ্যাডমিন রোল প্রদান করতে পারেন');
      return;
    }

    if (!emailToPromote.trim()) {
      toast.error('ইমেইল আবশ্যক');
      return;
    }

    setIsPromoting(true);
    try {
      // Find user by email
      const q = query(
        collection(db, COLLECTIONS.USERS),
        where('email', '==', emailToPromote.trim().toLowerCase())
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        toast.error('এই ইমেইলে কোনো নিবন্ধিত গ্রাহক অ্যাকাউন্ট পাওয়া যায়নি');
        return;
      }

      const targetDoc = snap.docs[0];
      await updateDoc(doc(db, COLLECTIONS.USERS, targetDoc.id), {
        role: selectedRole,
        updatedAt: serverTimestamp(),
      });

      toast.success(`সফলভাবে ${selectedRole === 'super_admin' ? 'সুপার অ্যাডমিন' : 'অ্যাডমিন'} রোল প্রদান করা হয়েছে`);
      setEmailToPromote('');
      loadAdmins();
    } catch {
      toast.error('রোল পরিবর্তন ব্যর্থ হয়েছে');
    } finally {
      setIsPromoting(false);
    }
  };

  const handleRevokeRole = async (targetUid: string, email: string) => {
    if (targetUid === user?.uid) {
      toast.error('আপনি নিজের অ্যাক্সেস বাতিল করতে পারবেন না');
      return;
    }

    if (!window.confirm(`আপনি কি "${email}" এর অ্যাডমিন সুবিধা বাতিল করতে চান?`)) return;

    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, targetUid), {
        role: USER_ROLES.CUSTOMER,
        updatedAt: serverTimestamp(),
      });

      toast.success('অ্যাডমিন রোল সফলভাবে প্রত্যাহার করা হয়েছে');
      loadAdmins();
    } catch {
      toast.error('রোল প্রত্যাহার ব্যর্থ হয়েছে');
    }
  };

  return (
    <>
      <Helmet>
        <title>অ্যাডমিন রোল ও পারমিশন — Sigmenta</title>
      </Helmet>

      <div className="space-y-6 font-bangla max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#292329]">
            অ্যাডমিন রোল ও পারমিশন ব্যবস্থাপনা
          </h1>
          <p className="text-xs text-[#77717A]">
            সিস্টেমে অনুমোদিত অ্যাডমিনিস্ট্রেটরদের তালিকা ও নতুন রোল বণ্টন
          </p>
        </div>

        {/* Security Warning Notice */}
        <div className="p-4 bg-[#FFF0F5] border border-[#F0E2E8] rounded-2xl flex items-start gap-3 text-xs text-[#292329]">
          <Shield className="w-5 h-5 text-[#D45D83] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-[#D45D83]">উচ্চ নিরাপত্তা সতর্কতা:</p>
            <p>
              অ্যাডমিন অধিকার শুধুমাত্র বিশ্বস্ত দায়িত্বশীল ব্যক্তিদের প্রদান করুন। সিস্টেমের সমস্ত সংবেদনশীল ডেটা এবং পেমেন্ট সেটিংসের নিয়ন্ত্রণ অ্যাডমিন প্যানেলে সংরক্ষিত।
            </p>
          </div>
        </div>

        {/* Grant Role Card */}
        {isSuperAdmin && (
          <div className="bg-white border border-[#F0E2E8] rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-[#F0E2E8] pb-3">
              <UserPlus className="w-4 h-4 text-[#D45D83]" />
              <h2 className="text-sm font-bold text-[#292329]">নতুন অ্যাডমিন অনুমোদন করুন</h2>
            </div>

            <form onSubmit={handleGrantRole} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#292329] mb-1">
                    নিবন্ধিত গ্রাহকের ইমেইল
                  </label>
                  <input
                    type="email"
                    value={emailToPromote}
                    onChange={(e) => setEmailToPromote(e.target.value)}
                    placeholder="user@example.com"
                    required
                    className="w-full px-3.5 py-2.5 text-xs border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#292329] mb-1">
                    অনুমোদিত রোল
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2.5 text-xs border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                  >
                    <option value="admin">সাধারণ অ্যাডমিন (Admin)</option>
                    <option value="super_admin">সুপার অ্যাডমিন (Super Admin)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPromoting}
                className="px-6 py-2.5 bg-[#D45D83] hover:bg-[#B8446C] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                {isPromoting ? 'অনুমোদন হচ্ছে...' : 'রোল অনুমোদন করুন'}
              </button>
            </form>
          </div>
        )}

        {/* Current Admins List */}
        <div className="bg-white border border-[#F0E2E8] rounded-3xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#F0E2E8]">
            <h2 className="text-sm font-bold text-[#292329]">
              বর্তমান অনুমোদিত অ্যাডমিনবৃন্দ ({admins.length} জন)
            </h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-[#77717A]">লোড হচ্ছে...</div>
          ) : (
            <div className="divide-y divide-[#F0E2E8]">
              {admins.map((adm) => (
                <div key={adm.uid} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#FFF0F5] text-[#D45D83] font-bold text-xs flex items-center justify-center">
                      {adm.displayName ? adm.displayName[0].toUpperCase() : 'A'}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#292329]">{adm.displayName || 'অ্যাডমিন'}</h4>
                      <p className="text-[11px] text-[#77717A]">{adm.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        adm.role === 'super_admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {adm.role === 'super_admin' ? 'সুপার অ্যাডমিন' : 'অ্যাডমিন'}
                    </span>

                    {isSuperAdmin && adm.uid !== user?.uid && (
                      <button
                        type="button"
                        onClick={() => handleRevokeRole(adm.uid, adm.email)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="রোল প্রত্যাহার করুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminRolesPage;
