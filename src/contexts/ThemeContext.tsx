import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ThemeContextValue, SiteTheme } from '@/types';
import { getLocalSettings } from '@/services/settingsService';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const STORAGE_KEY = 'sigmenta_theme' as const;

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
ThemeContext.displayName = 'ThemeContext';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getInitialTheme(): SiteTheme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as SiteTheme | null;
    if (stored && ['unisex', 'bw', 'dark', 'royal'].includes(stored)) {
      return stored;
    }
    // Fallback: check site settings default
    const settings = getLocalSettings();
    if (settings?.theme && ['unisex', 'bw', 'dark', 'royal'].includes(settings.theme)) {
      return settings.theme;
    }
  } catch {
    // ignore
  }
  return 'unisex'; // Default modern unisex theme
}

function applyThemeToDOM(theme: SiteTheme): void {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);

  root.classList.remove('theme-unisex', 'theme-bw', 'theme-dark', 'theme-royal');
  root.classList.add(`theme-${theme}`);

  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function ThemeProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [theme, setThemeState] = useState<SiteTheme>(() => getInitialTheme());

  // Sync to DOM whenever theme changes
  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  // Listen to Admin settings updates
  useEffect(() => {
    const onSettingsUpdate = () => {
      // If user hasn't explicitly set a personal override in localStorage, use admin setting
      const userChoice = localStorage.getItem(STORAGE_KEY);
      if (!userChoice) {
        const settings = getLocalSettings();
        if (settings?.theme && ['unisex', 'bw', 'dark', 'royal'].includes(settings.theme)) {
          setThemeState(settings.theme);
        }
      }
    };

    window.addEventListener('wf_settings_updated', onSettingsUpdate);
    return () => window.removeEventListener('wf_settings_updated', onSettingsUpdate);
  }, []);

  const setTheme = useCallback((newTheme: SiteTheme): void => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback((): void => {
    setThemeState((prev) => (prev === 'dark' ? 'unisex' : 'dark'));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      isDark: theme === 'dark',
      theme,
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
