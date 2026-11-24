// ─── Loading Spinner Component ────────────────────────────────────────────────
import React from 'react';

type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  fullPage?: boolean;
  label?: string;
  className?: string;
}

const sizeMap: Record<SpinnerSize, { ring: string; text: string }> = {
  sm: { ring: 'h-4 w-4 border-2', text: 'text-xs' },
  md: { ring: 'h-8 w-8 border-2', text: 'text-sm' },
  lg: { ring: 'h-12 w-12 border-[3px]', text: 'text-base' },
  xl: { ring: 'h-16 w-16 border-4', text: 'text-lg' },
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  fullPage = false,
  label,
  className = '',
}) => {
  const { ring, text } = sizeMap[size];

  const spinner = (
    <div
      role="status"
      aria-label={label ?? 'লোড হচ্ছে...'}
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
    >
      <div
        aria-hidden="true"
        className={[
          'rounded-full border-[#F7C8D5] border-t-[#D45D83] animate-spin',
          ring,
        ].join(' ')}
      />
      {label && (
        <p className={`text-[#77717A] font-medium ${text}`}>{label}</p>
      )}
      <span className="sr-only">{label ?? 'লোড হচ্ছে...'}</span>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#FFF8FA]/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
