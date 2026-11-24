// ─── Search Bar Component ──────────────────────────────────────────────────────
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  KeyboardEvent,
} from 'react';
import { Search, X, Clock, TrendingUp, Loader2 } from 'lucide-react';
import { productService } from '@/services/productService';
import { db } from '@/lib/firebase';
import { COLLECTIONS, SEARCH_CONFIG, STORAGE_KEYS } from '@/constants';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ProductSummary } from '@/types';

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (q: string) => void;
  inline?: boolean; // desktop inline mode
}

const SearchBar: React.FC<SearchBarProps> = ({
  isOpen,
  onClose,
  onSearch,
  inline = false,
}) => {
  const { t, isBangla } = useLanguage();
  const [query_, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<ProductSummary[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Load recent searches */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES);
      if (raw) setRecentSearches(JSON.parse(raw) as string[]);
    } catch {
      // ignore
    }
  }, []);

  /* Focus input when open */
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSuggestions([]);
    }
  }, [isOpen]);

  /* Debounced search using productService */
  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    try {
      const results = await productService.searchProducts(q, SEARCH_CONFIG.MAX_SUGGESTIONS);
      setSuggestions(results as ProductSummary[]);
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetchSuggestions(query_);
    }, SEARCH_CONFIG.DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query_, fetchSuggestions]);

  const saveRecentSearch = (q: string) => {
    try {
      const updated = [q, ...recentSearches.filter((s) => s !== q)].slice(
        0,
        SEARCH_CONFIG.MAX_RECENT_SEARCHES
      );
      setRecentSearches(updated);
      localStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleSubmit = (q: string = query_) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    saveRecentSearch(trimmed);
    onSearch(trimmed);
    onClose();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const items = suggestions.length > 0 ? suggestions : [];
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      if (focusedIndex >= 0 && items[focusedIndex]) {
        const item = items[focusedIndex];
        const name = isBangla ? item.nameBn : item.nameEn ?? item.nameBn;
        handleSubmit(name);
      } else {
        handleSubmit();
      }
    }
  };

  const clearRecentSearch = (s: string) => {
    const updated = recentSearches.filter((r) => r !== s);
    setRecentSearches(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const showSuggestions = query_.length >= SEARCH_CONFIG.MIN_QUERY_LENGTH;
  const showRecent = !showSuggestions && recentSearches.length > 0;

  const content = (
    <div className={`relative ${inline ? '' : 'w-full max-w-2xl mx-auto'}`}>
      {/* Input */}
      <div className="relative flex items-center">
        <Search
          size={18}
          className="absolute left-3.5 text-[#77717A] pointer-events-none"
        />
        <input
          ref={inputRef}
          type="search"
          value={query_}
          onChange={(e) => {
            setQuery(e.target.value);
            setFocusedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          placeholder={t('search.placeholder')}
          aria-label={t('nav.search')}
          aria-expanded={showSuggestions || showRecent}
          aria-autocomplete="list"
          className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-[#F0E2E8]
            bg-white text-[#292329] text-sm placeholder:text-[#77717A]/70
            focus:outline-none focus:ring-2 focus:ring-[#D45D83]/40 focus:border-[#D45D83]
            transition-colors"
        />
        {(query_ || isLoading) && (
          <button
            type="button"
            onClick={() => { setQuery(''); setSuggestions([]); inputRef.current?.focus(); }}
            aria-label={t('common.clear')}
            className="absolute right-3 text-[#77717A] hover:text-[#D45D83] transition-colors"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <X size={16} />
            )}
          </button>
        )}
      </div>

      {/* Dropdown */}
      {(showSuggestions || showRecent) && (
        <div
          role="listbox"
          aria-label={t('search.suggestions')}
          className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl
            shadow-xl border border-[#F0E2E8] overflow-hidden z-50 max-h-80 overflow-y-auto"
        >
          {showRecent && (
            <>
              <p className="px-4 pt-3 pb-1 text-xs font-semibold text-[#77717A] uppercase tracking-wide">
                {t('search.recent')}
              </p>
              {recentSearches.map((s, i) => (
                <div
                  key={i}
                  role="option"
                  aria-selected={false}
                  className="flex items-center justify-between px-4 py-2.5
                    hover:bg-[#FFF8FA] cursor-pointer group"
                  onClick={() => { setQuery(s); inputRef.current?.focus(); }}
                >
                  <span className="flex items-center gap-2.5 text-sm text-[#292329]">
                    <Clock size={14} className="text-[#77717A]" />
                    {s}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); clearRecentSearch(s); }}
                    className="text-[#77717A] opacity-0 group-hover:opacity-100 hover:text-[#D45D83] transition-all"
                    aria-label="সরিয়ে দিন"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </>
          )}

          {showSuggestions && suggestions.length > 0 && (
            <>
              <p className="px-4 pt-3 pb-1 text-xs font-semibold text-[#77717A] uppercase tracking-wide">
                {t('search.suggestions')}
              </p>
              {suggestions.map((p, i) => (
                <div
                  key={p.id}
                  role="option"
                  aria-selected={focusedIndex === i}
                  onClick={() => handleSubmit(isBangla ? p.nameBn : p.nameEn ?? p.nameBn)}
                  className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                    focusedIndex === i ? 'bg-[#FFF8FA]' : 'hover:bg-[#FFF8FA]'
                  }`}
                >
                  {p.primaryImage ? (
                    <img
                      src={p.primaryImage}
                      alt=""
                      className="w-9 h-9 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-[#F7C8D5]/40 flex items-center justify-center shrink-0">
                      <TrendingUp size={14} className="text-[#D45D83]" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-[#292329] line-clamp-1">
                      {isBangla ? p.nameBn : p.nameEn ?? p.nameBn}
                    </p>
                    <p className="text-xs text-[#D45D83] font-medium">
                      ৳{(p.salePrice ?? p.regularPrice).toLocaleString('bn-BD')}
                    </p>
                  </div>
                </div>
              ))}
            </>
          )}

          {showSuggestions && !isLoading && suggestions.length === 0 && (
            <p className="px-4 py-5 text-sm text-[#77717A] text-center">
              {t('search.no_results')}
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (inline) return content;

  // Modal / overlay mode for mobile
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[150] bg-black/40 backdrop-blur-sm flex flex-col"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white px-4 pt-4 pb-3 shadow-md">
        <div className="flex items-center gap-2">
          {content}
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-sm font-medium text-[#D45D83] px-2 py-1"
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
