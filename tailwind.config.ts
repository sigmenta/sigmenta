import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';
import forms from '@tailwindcss/forms';
import aspectRatio from '@tailwindcss/aspect-ratio';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],

  theme: {
    extend: {
      /* ── Brand Colors ── */
      colors: {
        brand: {
          primary: 'var(--color-primary)',
          'primary-dark': 'var(--color-primary-hover)',
          'primary-light': 'var(--color-primary-light)',
          soft: 'var(--color-primary-light)',
          'soft-light': 'var(--color-primary-soft)',
          white: '#FFFFFF',
          dark: 'var(--color-dark)',
          muted: 'var(--color-text-muted)',
          'bg-light': 'var(--color-bg-light)',
          border: 'var(--color-border)',
          surface: 'var(--color-bg-light)',
          success: 'var(--color-success)',
          warning: 'var(--color-warning)',
          error: 'var(--color-error)',
          info: 'var(--color-info)',
        },
        pink: {
          50: '#FFF0F5',
          100: '#FFE1EC',
          200: '#FFC5D9',
          300: '#FFA0C0',
          400: '#F772A0',
          500: '#D45D83',
          600: '#B8446C',
          700: '#963358',
          800: '#742447',
          900: '#521836',
          950: '#2D0A1C',
        },
      },

      /* ── Typography ── */
      fontFamily: {
        sans: ['Inter', 'Hind Siliguri', 'system-ui', 'sans-serif'],
        bangla: ['Hind Siliguri', 'Noto Sans Bengali', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],   // 10px
        xs: ['0.75rem', { lineHeight: '1.125rem' }],    // 12px
        sm: ['0.875rem', { lineHeight: '1.375rem' }],   // 14px
        base: ['1rem', { lineHeight: '1.625rem' }],     // 16px
        lg: ['1.125rem', { lineHeight: '1.75rem' }],    // 18px
        xl: ['1.25rem', { lineHeight: '1.875rem' }],    // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px
        '3xl': ['1.875rem', { lineHeight: '2.375rem' }],// 30px
        '4xl': ['2.25rem', { lineHeight: '2.75rem' }],  // 36px
        '5xl': ['3rem', { lineHeight: '1.2' }],         // 48px
        '6xl': ['3.75rem', { lineHeight: '1.1' }],      // 60px
      },

      /* ── Spacing ── */
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
        '34': '8.5rem',
        '38': '9.5rem',
        '42': '10.5rem',
        '46': '11.5rem',
        '50': '12.5rem',
        '54': '13.5rem',
        '58': '14.5rem',
        '62': '15.5rem',
        '66': '16.5rem',
        '70': '17.5rem',
        '74': '18.5rem',
        '78': '19.5rem',
        '82': '20.5rem',
        '86': '21.5rem',
        '90': '22.5rem',
        '94': '23.5rem',
        '98': '24.5rem',
        '100': '25rem',
        '104': '26rem',
        '108': '27rem',
        '112': '28rem',
        '116': '29rem',
        '120': '30rem',
        '128': '32rem',
        '144': '36rem',
        '160': '40rem',
        '176': '44rem',
        '192': '48rem',
      },

      /* ── Border Radius ── */
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },

      /* ── Shadows ── */
      boxShadow: {
        'brand-sm': '0 1px 3px 0 rgba(212, 93, 131, 0.1)',
        'brand': '0 4px 12px 0 rgba(212, 93, 131, 0.15)',
        'brand-md': '0 8px 24px 0 rgba(212, 93, 131, 0.2)',
        'brand-lg': '0 16px 48px 0 rgba(212, 93, 131, 0.25)',
        'card': '0 2px 8px 0 rgba(41, 35, 41, 0.06)',
        'card-hover': '0 8px 24px 0 rgba(41, 35, 41, 0.12)',
        'product': '0 4px 16px 0 rgba(41, 35, 41, 0.08)',
        'header': '0 2px 12px 0 rgba(41, 35, 41, 0.08)',
        'modal': '0 20px 60px 0 rgba(41, 35, 41, 0.2)',
        'bottom-nav': '0 -2px 12px 0 rgba(41, 35, 41, 0.08)',
      },

      /* ── Transitions ── */
      transitionDuration: {
        '0': '0ms',
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
        '300': '300ms',
        '400': '400ms',
        '500': '500ms',
      },

      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.27, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'ease-out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },

      /* ── Animations ── */
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '1' },
          '100%': { transform: 'scale(1.4)', opacity: '0' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        'bounce-gentle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'cart-bump': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.25)' },
        },
      },

      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-in-up': 'fade-in-up 0.4s ease-out',
        'fade-in-down': 'fade-in-down 0.4s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        shimmer: 'shimmer 1.8s infinite linear',
        'pulse-ring': 'pulse-ring 1s ease-out infinite',
        wiggle: 'wiggle 0.5s ease-in-out',
        'bounce-gentle': 'bounce-gentle 1.5s ease-in-out infinite',
        'cart-bump': 'cart-bump 0.3s ease-in-out',
      },

      /* ── Z-Index Scale ── */
      zIndex: {
        '1': '1',
        '2': '2',
        '5': '5',
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
        'header': '100',
        'dropdown': '200',
        'sidebar': '300',
        'modal-backdrop': '400',
        'modal': '500',
        'toast': '600',
        'tooltip': '700',
      },

      /* ── Screen Breakpoints ── */
      screens: {
        xs: '375px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
        '3xl': '1920px',
      },

      /* ── Aspect Ratios ── */
      aspectRatio: {
        'product': '3 / 4',
        'banner': '16 / 7',
        'banner-mobile': '4 / 3',
        'category': '1 / 1',
      },

      /* ── Max Widths ── */
      maxWidth: {
        'screen-xs': '375px',
        'screen-sm': '640px',
        'screen-md': '768px',
        'screen-lg': '1024px',
        'screen-xl': '1280px',
        'content': '1200px',
        'container': '1440px',
      },

      /* ── Height ── */
      height: {
        'screen-dvh': '100dvh',
      },

      minHeight: {
        'screen-dvh': '100dvh',
      },
    },
  },

  plugins: [
    typography,
    forms({
      strategy: 'class', // Only style forms using the .form-* class strategy
    }),
    aspectRatio,
  ],

  /* Dark Mode (future — not active in v1) */
  darkMode: 'class',
};

export default config;
