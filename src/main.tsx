// ─── Women's Favorite — App Entry Point ─────────────────────────────────────

import React from 'react';
import { createRoot } from 'react-dom/client';
import '@/styles/globals.css';
import App from './app/App';

// Auto-reload if dynamic import fails due to a new deployment
window.addEventListener('vite:preloadError', () => {
  console.warn('[Vite] Dynamic import preload error detected. Reloading page...');
  window.location.reload();
});


const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(
    '[main.tsx] Root element #root not found. ' +
    'Ensure public/index.html contains <div id="root"></div>.',
  );
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
