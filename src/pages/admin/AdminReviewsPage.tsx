import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Star, CheckCircle, XCircle, Trash2, Check, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { reviewService } from '@/services/reviewService';
import { formatDate } from '@/utils';
import type { Review, ReviewStatus } from '@/types';

export const AdminReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      const data = await reviewService.getAllReviews();
      setReviews(data);
    } catch {
      toast.error('রিভিউ লোড করতে ব্যর্থ হয়েছে');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleUpdateStatus = async (reviewId: string, status: ReviewStatus) => {
    setActionLoadingId(reviewId);
    try {
      await reviewService.updateReviewStatus(reviewId, status);
      toast.success(status === 'approved' ? 'রিভিউ অনুমোদিত হয়েছে' : 'রিভিউ বাতিল করা হয়েছে');
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, status } : r))
      );
    } catch {
      toast.error('স্ট্যাটাস আপডেট ব্যর্থ হয়েছে');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filtered = reviews.filter((r) => {
    if (statusFilter === 'all') return true;
    return r.status === statusFilter;
  });

  return (
    <>
      <Helmet>
        <title>রিভিউ মডারেশন — অ্যাডমিন</title>
      </Helmet>

      <div className="space-y-6 font-bangla">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[#292329]">
              গ্রাহক রিভিউ মডারেশন
            </h1>
            <p className="text-xs text-[#77717A]">
              গ্রাহকদের জমা দেওয়া রিভিউ অনুমোদন বা যাচাই করুন ({reviews.length}টি মোট)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-3 py-2 bg-white border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
            >
              <option value="all">সকল রিভিউ</option>
              <option value="pending">অপেক্ষমাণ (Pending)</option>
              <option value="approved">অনুমোদিত (Approved)</option>
              <option value="rejected">বাতিলকৃত (Rejected)</option>
            </select>

            <button
              type="button"
              onClick={loadReviews}
              className="p-2 bg-white border border-[#F0E2E8] rounded-xl hover:bg-gray-50 text-[#77717A]"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Reviews List */}
        <div className="bg-white border border-[#F0E2E8] rounded-2xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-[#77717A]">লোড হচ্ছে...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#77717A]">
              কোনো রিভিউ পাওয়া যায়নি
            </div>
          ) : (
            <div className="divide-y divide-[#F0E2E8]">
              {filtered.map((rev) => (
                <div key={rev.id} className="p-4 md:p-6 space-y-3 hover:bg-[#FFF8FA]/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#FFF0F5] text-[#D45D83] font-bold text-xs flex items-center justify-center">
                        {rev.userName ? rev.userName[0].toUpperCase() : 'U'}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#292329]">{rev.userName}</h4>
                        <p className="text-[11px] text-[#77717A]">
                          পণ্য: <span className="font-medium text-[#D45D83]">{rev.productSlug}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < rev.rating
                                ? 'fill-amber-400 stroke-amber-400'
                                : 'stroke-gray-300'
                            }`}
                          />
                        ))}
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rev.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : rev.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {rev.status === 'approved'
                          ? 'অনুমোদিত'
                          : rev.status === 'rejected'
                          ? 'বাতিল'
                          : 'অপেক্ষমাণ'}
                      </span>
                    </div>
                  </div>

                  {rev.title && (
                    <h5 className="font-bold text-xs text-[#292329]">{rev.title}</h5>
                  )}

                  <p className="text-xs text-[#77717A] leading-relaxed bg-[#FFF8FA] p-3 rounded-xl border border-[#F0E2E8]">
                    {rev.body}
                  </p>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-2 text-[11px] text-[#77717A]">
                    <span>
                      তারিখ: {rev.createdAt ? formatDate(rev.createdAt, 'bn') : '—'}
                    </span>

                    <div className="flex items-center gap-2">
                      {rev.status !== 'approved' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(rev.id, 'approved')}
                          disabled={actionLoadingId === rev.id}
                          className="px-3 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg font-bold flex items-center gap-1 transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>অনুমোদন করুন</span>
                        </button>
                      )}

                      {rev.status !== 'rejected' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(rev.id, 'rejected')}
                          disabled={actionLoadingId === rev.id}
                          className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-bold flex items-center gap-1 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>বাতিল করুন</span>
                        </button>
                      )}
                    </div>
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

export default AdminReviewsPage;
