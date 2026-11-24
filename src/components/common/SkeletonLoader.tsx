// ─── Skeleton Loader Components ───────────────────────────────────────────────
import React from 'react';

/* ── Generic Skeleton ── */
interface SkeletonProps {
  width?: string;
  height?: string;
  rounded?: string;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = 'w-full',
  height = 'h-4',
  rounded = 'rounded-md',
  className = '',
}) => (
  <div
    aria-hidden="true"
    className={[
      'bg-gradient-to-r from-[#F0E2E8] via-[#FFF8FA] to-[#F0E2E8]',
      'bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]',
      width,
      height,
      rounded,
      className,
    ]
      .filter(Boolean)
      .join(' ')}
  />
);

/* ── Product Card Skeleton ── */
export const ProductCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#F0E2E8]">
    {/* Image placeholder */}
    <Skeleton height="h-52" rounded="rounded-none" />
    <div className="p-3 space-y-2">
      <Skeleton height="h-4" width="w-3/4" />
      <Skeleton height="h-3" width="w-1/2" />
      <div className="flex items-center gap-2 pt-1">
        <Skeleton height="h-5" width="w-16" />
        <Skeleton height="h-4" width="w-12" />
      </div>
      <Skeleton height="h-8" rounded="rounded-xl" />
    </div>
  </div>
);

/* ── Product Detail Skeleton ── */
export const ProductDetailSkeleton: React.FC = () => (
  <div className="max-w-5xl mx-auto px-4 py-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Gallery */}
      <div className="space-y-3">
        <Skeleton height="h-80 md:h-[450px]" rounded="rounded-2xl" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height="h-16" width="w-16" rounded="rounded-xl" />
          ))}
        </div>
      </div>
      {/* Info */}
      <div className="space-y-4">
        <Skeleton height="h-7" width="w-4/5" />
        <Skeleton height="h-4" width="w-1/3" />
        <div className="flex gap-3">
          <Skeleton height="h-6" width="w-20" />
          <Skeleton height="h-6" width="w-16" />
        </div>
        <Skeleton height="h-3" width="w-full" />
        <Skeleton height="h-3" width="w-5/6" />
        <Skeleton height="h-3" width="w-3/4" />
        <div className="space-y-2 pt-2">
          <Skeleton height="h-4" width="w-20" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height="h-9" width="w-14" rounded="rounded-lg" />
            ))}
          </div>
        </div>
        <Skeleton height="h-11" rounded="rounded-xl" />
      </div>
    </div>
  </div>
);

/* ── Order Card Skeleton ── */
export const OrderCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl p-4 border border-[#F0E2E8] space-y-3">
    <div className="flex justify-between items-start">
      <div className="space-y-1.5">
        <Skeleton height="h-4" width="w-28" />
        <Skeleton height="h-3" width="w-20" />
      </div>
      <Skeleton height="h-6" width="w-20" rounded="rounded-full" />
    </div>
    <div className="flex gap-3">
      <Skeleton height="h-14" width="w-14" rounded="rounded-xl" />
      <div className="flex-1 space-y-1.5">
        <Skeleton height="h-4" width="w-3/4" />
        <Skeleton height="h-3" width="w-1/2" />
      </div>
    </div>
    <div className="flex justify-between pt-1">
      <Skeleton height="h-4" width="w-24" />
      <Skeleton height="h-8" width="w-24" rounded="rounded-lg" />
    </div>
  </div>
);

/* ── Table Row Skeleton ── */
export const TableRowSkeleton: React.FC<{ cols?: number }> = ({ cols = 5 }) => (
  <tr className="border-b border-[#F0E2E8]">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <Skeleton height="h-4" width={i === 0 ? 'w-8' : 'w-full'} />
      </td>
    ))}
  </tr>
);

export default Skeleton;
