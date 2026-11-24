// ─── Women's Favorite — App Providers ───────────────────────────────────────

import React, { type ReactNode } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/features/auth/AuthContext';
import { COLORS } from '@/constants';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Nests all global context providers in the correct order:
 *
 * 1. HelmetProvider  — manages document <head> (SEO)
 * 2. BrowserRouter   — routing context (must wrap everything that uses Router hooks)
 * 3. LanguageProvider — i18n (Bangla / English)
 * 4. ThemeProvider   — dark/light mode preference
 * 5. AuthProvider    — Firebase auth + Firestore UserProfile
 * 6. Toaster         — react-hot-toast notifications (rendered outside component tree)
 */
export function AppProviders({ children }: AppProvidersProps): React.JSX.Element {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <LanguageProvider>
          <ThemeProvider>
            <AuthProvider>
              {children}

              {/* Global toast notifications */}
              <Toaster
                position="top-center"
                gutter={12}
                containerStyle={{ top: 20 }}
                toastOptions={{
                  // Default duration for all toasts
                  duration: 3500,

                  // Default style
                  style: {
                    background: COLORS.white,
                    color: COLORS.dark,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '0.75rem',
                    padding: '12px 16px',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    boxShadow:
                      '0 4px 6px -1px rgba(212, 93, 131, 0.1), 0 2px 4px -1px rgba(212, 93, 131, 0.06)',
                    maxWidth: '380px',
                  },

                  // Success toasts use brand pink accent
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: COLORS.primary,
                      secondary: COLORS.white,
                    },
                    style: {
                      background: COLORS.bgLight,
                      borderColor: COLORS.soft,
                    },
                  },

                  // Error toasts use brand error red
                  error: {
                    duration: 4500,
                    iconTheme: {
                      primary: COLORS.error,
                      secondary: COLORS.white,
                    },
                    style: {
                      borderColor: '#FCA5A5',
                    },
                  },
                }}
              />
            </AuthProvider>
          </ThemeProvider>
        </LanguageProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}
