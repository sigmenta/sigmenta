// ─── ProductSort — Women's Favorite ──────────────────────────────────────────
import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpDown, ChevronDown, Check } from 'lucide-react';
import { clsx } from 'clsx';
import type { ProductSortKey } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

/* ── Sort options ── */
interface SortOption {
  key: ProductSortKey;
  labelBn: string;
  labelEn: string;
}

const SORT_OPTIONS: SortOption[] = [
  { key: 'newest', labelBn: 'সর্বশেষ', labelEn: 'Newest' },
  { key: 'popularity', labelBn: 'জনপ্রিয়তা', labelEn: 'Popularity' },
  { key: 'rating', labelBn: 'সর্বোচ্চ রেটিং', labelEn: 'Highest Rating' },
  { key: 'price_asc', labelBn: 'মূল্য: কম থেকে বেশি', labelEn: 'Price: Low to High' },
  { key: 'price_desc', labelBn: 'মূল্য: বেশি থেকে কম', labelEn: 'Price: High to Low' },
  { key: 'name_asc', labelBn: 'নাম (ক-খ)', labelEn: 'Name A-Z' },
];

/* ── Props ── */
interface ProductSortProps {
  value: ProductSortKey;
  onChange: (key: ProductSortKey) => void;
  className?: string;
}

/* ════════════════════════════════════════════════════════════════════════ */
export default function ProductSort({ value, onChange, className }: ProductSortProps) {
  const { t, isBangla } = useLanguage();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selected = SORT_OPTIONS.find((o) => o.key === value) ?? SORT_OPTIONS[0];

  /* close on outside click */
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  /* close on Escape */
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  function handleSelect(key: ProductSortKey) {
    onChange(key);
    setOpen(false);
  }

  return (
    <div ref={dropdownRef} className={clsx('relative', className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={clsx(
          'flex items-center gap-2 px-4 py-2.5',
          'bg-white border border-[#F0E2E8] rounded-xl text-sm font-medium text-[#292329]',
          'shadow-sm hover:border-[#D45D83] transition-colors duration-150',
          'min-w-[160px] justify-between',
          open && 'border-[#D45D83] ring-2 ring-[#D45D83]/20'
        )}
      >
        <span className="flex items-center gap-1.5">
          <ArrowUpDown size={14} className="text-[#D45D83]" />
          {isBangla ? selected.labelBn : selected.labelEn}
        </span>
        <ChevronDown
          size={14}
          className={clsx('text-gray-400 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          className={clsx(
            'absolute right-0 top-full mt-2 z-30',
            'w-56 bg-white rounded-2xl border border-[#F0E2E8] shadow-xl',
            'py-2 overflow-hidden',
            'animate-in fade-in slide-in-from-top-1 duration-150'
          )}
        >
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.key}
              role="option"
              aria-selected={option.key === value}
              type="button"
              onClick={() => handleSelect(option.key)}
              className={clsx(
                'w-full flex items-center justify-between px-4 py-2.5 text-sm text-left',
                'transition-colors duration-100',
                option.key === value
                  ? 'bg-[#D45D83]/10 text-[#D45D83] font-medium'
                  : 'text-gray-600 hover:bg-[#FFF8FA]'
              )}
            >
              {isBangla ? option.labelBn : option.labelEn}
              {option.key === value && <Check size={14} className="text-[#D45D83]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
