import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { FileText, Save, Eye, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsService } from '@/services/settingsService';
import { useAuth } from '@/features/auth/AuthContext';
import { sanitizeHtml, formatDate } from '@/utils';
import type { LegalPage, LegalPageKey } from '@/types';

const POLICY_TABS: { key: LegalPageKey; label: string }[] = [
  { key: 'privacy-policy', label: 'গোপনীয়তা নীতি (Privacy)' },
  { key: 'terms-and-conditions', label: 'শর্তাবলী (Terms)' },
  { key: 'refund-policy', label: 'রিফান্ড নীতি (Refund)' },
  { key: 'shipping-policy', label: 'শিপিং নীতি (Shipping)' },
];

export const AdminLegalPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedKey, setSelectedKey] = useState<LegalPageKey>('privacy-policy');
  const [titleBn, setTitleBn] = useState('');
  const [contentBn, setContentBn] = useState('');
  const [lastUpdated, setLastUpdated] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    settingsService.getLegalPage(selectedKey)
      .then((data: any) => {
        if (!isMounted) return;
        if (data) {
          setTitleBn(data.titleBn || '');
          setContentBn(data.contentBn || '');
          setLastUpdated(data.lastUpdated);
        } else {
          setTitleBn(POLICY_TABS.find((t) => t.key === selectedKey)?.label || '');
          setContentBn('<p>নীতিমালার বিবরণ এখানে লিখুন...</p>');
          setLastUpdated(null);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [selectedKey]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      await settingsService.updateLegalPage(
        selectedKey,
        {
          titleBn: titleBn.trim(),
          contentBn: contentBn.trim(),
        },
        user.uid
      );

      toast.success('আইনি পাতা সফলভাবে সংরক্ষিত হয়েছে');
      setLastUpdated(new Date());
    } catch (err: any) {
      if (err?.code === 'permission-denied' || err?.message?.includes('permission')) {
        toast.error('❌ অনুমতি নেই! Admin account দিয়ে লগইন করুন।', { duration: 5000 });
      } else {
        toast.error('❌ সংরক্ষণ ব্যর্থ হয়েছে। আবার চেষ্টা করুন।', { duration: 5000 });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>আইনি পাতা ব্যবস্থাপনা — অ্যাডমিন</title>
      </Helmet>

      <div className="space-y-6 font-bangla max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[#292329]">
              আইনি পাতা ও পলিসি সম্পাদক
            </h1>
            <p className="text-xs text-[#77717A]">
              ওয়েবসাইটের গোপনীয়তা, রিটার্ন, শিপিং ও ব্যবহারের নীতিমালা সম্পাদনা করুন
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              className="px-4 py-2.5 bg-white border border-[#F0E2E8] hover:bg-gray-50 text-[#292329] font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
            >
              {previewMode ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{previewMode ? 'সম্পাদনা মোড' : 'প্রিভিউ দেখুন'}</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 bg-[#D45D83] hover:bg-[#B8446C] disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#F0E2E8] bg-white rounded-2xl p-1.5 shadow-sm overflow-x-auto gap-1">
          {POLICY_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setSelectedKey(tab.key);
                setPreviewMode(false);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                selectedKey === tab.key
                  ? 'bg-[#D45D83] text-white shadow-sm'
                  : 'text-[#77717A] hover:text-[#292329] hover:bg-[#FFF8FA]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Editor or Preview Box */}
        <div className="bg-white border border-[#F0E2E8] rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#292329] mb-1">
              পাতার শিরোনাম (বাংলা)
            </label>
            <input
              type="text"
              value={titleBn}
              onChange={(e) => setTitleBn(e.target.value)}
              disabled={previewMode}
              className="w-full px-4 py-2.5 text-xs border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#292329] mb-1">
              বিষয়বস্তু (HTML ফরম্যাট সমর্থিত)
            </label>

            {previewMode ? (
              <div
                className="p-6 bg-[#FFF8FA] border border-[#F0E2E8] rounded-2xl min-h-[300px] text-xs leading-relaxed text-[#292329] prose-brand"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(contentBn) }}
              />
            ) : (
              <textarea
                rows={14}
                value={contentBn}
                onChange={(e) => setContentBn(e.target.value)}
                className="w-full p-4 font-mono text-xs border border-[#F0E2E8] rounded-2xl text-[#292329] focus:outline-none focus:border-[#D45D83] leading-relaxed"
                placeholder="<p>অনুগ্রহ করে আপনার নীতিমালার বিস্তারিত এখানে লিখুন...</p>"
              />
            )}
          </div>

          {lastUpdated && (
            <p className="text-[11px] text-[#77717A] pt-2 border-t border-[#F0E2E8]">
              সর্বশেষ সংরক্ষিত হয়েছে: {formatDate(lastUpdated, 'bn')}
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminLegalPage;
