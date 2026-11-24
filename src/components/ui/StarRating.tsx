// ─── Star Rating Component ────────────────────────────────────────────────────
import React, { useState } from 'react';
import { Star } from 'lucide-react';

type StarSize = 'sm' | 'md' | 'lg';

interface StarRatingProps {
  rating: number;             // 0–5
  maxStars?: number;
  size?: StarSize;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  reviewCount?: number;
  showNumeric?: boolean;
  className?: string;
}

const starSizes: Record<StarSize, number> = {
  sm: 12,
  md: 16,
  lg: 22,
};

const textSizes: Record<StarSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxStars = 5,
  size = 'md',
  interactive = false,
  onChange,
  reviewCount,
  showNumeric = false,
  className = '',
}) => {
  const [hovered, setHovered] = useState<number | null>(null);

  const displayRating = hovered ?? rating;
  const starSize = starSizes[size];

  const renderStar = (index: number) => {
    const filled = displayRating >= index + 1;
    const halfFilled = !filled && displayRating >= index + 0.5;

    return (
      <span
        key={index}
        aria-hidden="true"
        className="relative inline-flex"
        style={{ width: starSize, height: starSize }}
        onMouseEnter={() => interactive && setHovered(index + 1)}
        onMouseLeave={() => interactive && setHovered(null)}
        onClick={() => interactive && onChange?.(index + 1)}
      >
        {/* Empty star background */}
        <Star
          size={starSize}
          className="text-gray-200 absolute inset-0"
          fill="currentColor"
          strokeWidth={0}
        />
        {/* Filled overlay */}
        {(filled || halfFilled) && (
          <span
            className="absolute inset-0 overflow-hidden"
            style={{ width: halfFilled ? '50%' : '100%' }}
          >
            <Star
              size={starSize}
              className="text-[#D45D83]"
              fill="currentColor"
              strokeWidth={0}
            />
          </span>
        )}
      </span>
    );
  };

  const ariaLabel = `${rating} / ${maxStars} সাপেক্ষে${reviewCount !== undefined ? ` — ${reviewCount} রিভিউ` : ''}`;

  return (
    <div
      role={interactive ? 'group' : 'img'}
      aria-label={ariaLabel}
      className={`inline-flex items-center gap-1 ${className}`}
    >
      <span className="flex gap-0.5" aria-hidden={!interactive}>
        {Array.from({ length: maxStars }, (_, i) => renderStar(i))}
      </span>

      {showNumeric && (
        <span className={`font-semibold text-[#292329] ${textSizes[size]}`}>
          {rating.toFixed(1)}
        </span>
      )}

      {reviewCount !== undefined && (
        <span className={`text-[#77717A] ${textSizes[size]}`}>
          ({reviewCount.toLocaleString('bn-BD')})
        </span>
      )}
    </div>
  );
};

export default StarRating;
