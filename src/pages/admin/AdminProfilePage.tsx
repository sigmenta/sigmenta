import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import {
  User, Lock, Save, LogOut, ShieldCheck, Mail, Phone
} from 'lucide-react';
import { updatePassword, updateProfile } from 'firebase/auth';
import toast from 'react-hot-toast';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/features/auth/AuthContext';
import { userService } from '@/services/userService';
import { ROUTES } from '@/constants';

export const AdminProfilePage: React.FC = () => {
  const { user, firebaseUser, signOut } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [isUpdatingInfo, setIsUpdatingInfo] = useState(false);

  // Password update
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firebaseUser) return;

    setIsUpdatingInfo(true);
    try {
      if (displayName.trim() !== firebaseUser.displayName) {
        await updateProfile(firebaseUser, { displayName: displayName.trim() });
      }

      await userService.updateUserProfile(user.uid, {
        displayName: displayName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
      });

      toast.success('প্রোফাইল তথ্য আপডেট সম্পন্ন');
    } catch {
      toast.error('প্রোফাইল আপডেট ব্যর্থ হয়েছে');
    } finally {
      setIsUpdatingInfo(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;

    if (newPassword.length < 6) {
      toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('পাসওয়ার্ড দুটি মিলছে না');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await updatePassword(firebaseUser, newPassword);
      toast.success('পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'পাসওয়ার্ড পরিবর্তন করতে পুনরায় লগইন প্রয়োজন হতে পারে');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate(ROUTES.ADMIN_LOGIN);
  };

  return (
    <>
      <Helmet>
        <title>অ্যাডমিন প্রোফাইল — Sigmenta</title>
      </Helmet>

      <div className="space-y-6 font-bangla max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[#292329]">
              অ্যাডমিন প্রোফাইল সেটিংস
            </h1>
            <p className="text-xs text-[#77717A]">
              আপনার অ্যাকাউন্টের বিবরণ এবং পাসওয়ার্ড পরিচালনা করুন
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>লগআউট</span>
          </button>
        </div>

        {/* Profile Details Card */}
        <div className="bg-white border border-[#F0E2E8] rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#FFF0F5] text-[#D45D83] font-extrabold text-2xl flex items-center justify-center border border-[#F0E2E8]">
              {user?.displayName ? user.displayName[0].toUpperCase() : 'A'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#292329]">{user?.displayName || 'অ্যাডমিন'}</h2>
              <p className="text-xs text-[#77717A]">{user?.email}</p>
              <span className="inline-block mt-1 px-2.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-bold uppercase">
                {user?.role || 'admin'}
              </span>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4 border-t border-[#F0E2E8] pt-6">
            <h3 className="font-bold text-sm text-[#292329]">ব্যক্তিগত তথ্য আপডেট</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#292329] mb-1">পূর্ণ নাম</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#292329] mb-1">ফোন নম্বর</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3.5 py-2.5 text-xs border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isUpdatingInfo}
              className="px-6 py-2.5 bg-[#D45D83] hover:bg-[#B8446C] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              {isUpdatingInfo ? 'আপডেট হচ্ছে...' : 'তথ্য সংরক্ষণ করুন'}
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-white border border-[#F0E2E8] rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-[#F0E2E8] pb-3">
            <Lock className="w-4 h-4 text-[#D45D83]" />
            <h3 className="font-bold text-sm text-[#292329]">পাসওয়ার্ড পরিবর্তন করুন</h3>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#292329] mb-1">
                  নতুন পাসওয়ার্ড
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="কমপক্ষে ৬ অক্ষর"
                  className="w-full px-3.5 py-2.5 text-xs border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#292329] mb-1">
                  পাসওয়ার্ড নিশ্চিত করুন
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="একই পাসওয়ার্ড পুনরায় লিখুন"
                  className="w-full px-3.5 py-2.5 text-xs border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isUpdatingPassword || !newPassword}
              className="px-6 py-2.5 bg-[#292329] hover:bg-black disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-colors"
            >
              {isUpdatingPassword ? 'পরিবর্তন হচ্ছে...' : 'পাসওয়ার্ড পরিবর্তন করুন'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default AdminProfilePage;
