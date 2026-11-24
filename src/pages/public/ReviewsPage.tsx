import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Star, CheckCircle, MessageSquareQuote, ArrowRight } from 'lucide-react';
import { reviewService } from '@/services/reviewService';
import { formatDate } from '@/utils';
import { BRAND, ROUTES } from '@/constants';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Review } from '@/types';

export const ReviewsPage: React.FC = () => {
  const { t, isBangla } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    reviewService.getAllReviews('approved')
      .then((data: any) => {
        if (isMounted) setReviews(data);
      })
      .catch((err: unknown) => {
        console.error('Error fetching reviews:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
      : '৫.০';

  const ratingCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    if (ratingCounts[r.rating] !== undefined) {
      ratingCounts[r.rating]++;
    }
  });

  return (
    <>
      <Helmet>
        <title>{`গ্রাহকদের রিভিউ — ${BRAND.nameBn}`}</title>
      </Helmet>

      <div className="max-w-content mx-auto px-4 py-8 font-bangla">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-[#292329] mb-2">
            {isBangla ? 'গ্রাহকদের মতামত ও রিভিউ' : 'Customer Reviews'}
          </h1>
          <p className="text-xs md:text-sm text-[#77717A]">
            {isBangla
              ? 'আমাদের গ্রাহকদের বাস্তব অভিজ্ঞতা ও মূল্যায়ন। প্রতিটি রিভিউ সত্য ও যাচাইকৃত।'
              : 'Real feedback and genuine ratings from verified shoppers.'}
          </p>
        </div>

        {/* Overview Box */}
        <div className="bg-white border border-[#F0E2E8] rounded-3xl p-6 md:p-8 shadow-sm mb-12 max-w-3xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Score */}
            <div className="text-center md:border-r md:border-[#F0E2E8] pr-0 md:pr-8">
              <span className="text-5xl font-extrabold text-[#D45D83]">{averageRating}</span>
              <div className="flex items-center justify-center gap-1 my-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-5 h-5 fill-amber-400 stroke-amber-400" />
                ))}
              </div>
              <p className="text-xs text-[#77717A]">
                {totalReviews}টি যাচাইকৃত পর্যালোচনার উপর ভিত্তি করে
              </p>
            </div>

            {/* Distribution bars */}
            <div className="space-y-2 text-xs">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = ratingCounts[rating] || 0;
                const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <span className="w-6 font-bold text-[#292329]">{rating}★</span>
                    <div className="flex-1 h-2 bg-[#FFF0F5] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#D45D83] rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-[#77717A]">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Reviews List */}
        {isLoading ? (
          <div className="text-center py-12 text-[#77717A]">লোড হচ্ছে...</div>
        ) : reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white border border-[#F0E2E8] rounded-3xl p-6 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#FFF0F5] text-[#D45D83] font-bold text-xs flex items-center justify-center">
                      {rev.userName ? rev.userName[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#292329]">{rev.userName}</h4>
                      <p className="text-[10px] text-[#77717A]">
                        {rev.createdAt ? formatDate(rev.createdAt, 'bn') : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                    ))}
                  </div>
                </div>

                {rev.title && (
                  <h3 className="font-bold text-sm text-[#292329]">{rev.title}</h3>
                )}

                <p className="text-xs text-[#77717A] leading-relaxed">{rev.body}</p>

                <div className="flex items-center justify-between pt-2 border-t border-[#F0E2E8] text-[11px] text-[#77717A]">
                  <Link
                    to={`/product/${rev.productSlug}`}
                    className="text-[#D45D83] hover:underline truncate max-w-xs"
                  >
                    পণ্য দেখুন →
                  </Link>
                  {rev.isVerifiedPurchase && (
                    <span className="flex items-center gap-1 text-green-600 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" /> যাচাইকৃত ক্রয়
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white border border-[#F0E2E8] rounded-3xl p-8 max-w-md mx-auto">
            <MessageSquareQuote className="w-12 h-12 text-[#D45D83]/30 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#292329]">এখনও কোনো রিভিউ নেই</h3>
            <p className="text-xs text-[#77717A] mt-1 mb-6">
              পণ্য কিনে আপনার মূল্যবান মতামত আমাদের সাথে শেয়ার করুন।
            </p>
            <Link
              to={ROUTES.PRODUCTS}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#D45D83] text-white rounded-xl text-xs font-bold hover:bg-[#B8446C] transition-colors"
            >
              <span>কেনাকাটা করুন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default ReviewsPage;
