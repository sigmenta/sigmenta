// ─── Women's Favorite — Root App Component ──────────────────────────────────

import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AppProviders } from './providers';
import AppRouter from './router';

// ─── Scroll Restoration ───────────────────────────────────────────────────────

/**
 * Restores scroll position to the top on every route change.
 * Must be rendered inside BrowserRouter (via AppProviders) to access useLocation.
 */
function ScrollRestoration(): null {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

import ErrorBoundary from '@/components/common/ErrorBoundary';

// ─── Inner App (has access to Router context) ─────────────────────────────────

function InnerApp(): React.JSX.Element {
  return (
    <>
      <ScrollRestoration />
      <ErrorBoundary>
        <AppRouter />
      </ErrorBoundary>
    </>
  );
}

// ─── Root App Component ───────────────────────────────────────────────────────

/**
 * Root component exported to main.tsx.
 * Wraps InnerApp in AppProviders so all context is available throughout
 * the component tree, including the router and auth context.
 */
export default function App(): React.JSX.Element {
  return (
    <AppProviders>
      <InnerApp />
    </AppProviders>
  );
}
