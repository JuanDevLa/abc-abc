import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic theme colors (mapped from CSS variables)
        theme: {
          bg: 'rgb(var(--bg) / <alpha-value>)',
          surface: 'rgb(var(--bg-surface) / <alpha-value>)',
          card: 'rgb(var(--bg-card) / <alpha-value>)',
        },
        'th-primary': 'rgb(var(--text-primary) / <alpha-value>)',
        'th-secondary': 'rgb(var(--text-secondary) / <alpha-value>)',
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          hover: 'rgb(var(--accent-hover) / <alpha-value>)',
          cta: 'rgb(var(--accent-cta) / <alpha-value>)',
          'cta-text': 'rgb(var(--accent-cta-text) / <alpha-value>)',
        },
        'th-border': 'rgb(var(--border) / <alpha-value>)',
        'th-navbar': 'rgb(var(--navbar-bg) / <alpha-value>)',
        'th-announce': 'rgb(var(--announcement-bg) / <alpha-value>)',
        'th-card-hover': 'rgb(var(--card-hover) / <alpha-value>)',
        'th-sale': 'rgb(var(--sale) / <alpha-value>)',
        'th-badge': 'rgb(var(--badge-bg) / <alpha-value>)',
      },
      fontFamily: {
        heading: ['"Bebas Neue"', 'sans-serif'],
        body: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        jost: ['var(--font-jost)', 'sans-serif'],
      },
      keyframes: {
        'marquee-x': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(calc(-100% - var(--gap)))' },
        },
        'marquee-y': {
          from: { transform: 'translateY(0)' },
          to: { transform: 'translateY(calc(-100% - var(--gap)))' },
        },
      },
      animation: {
        'marquee-horizontal': 'marquee-x var(--duration) infinite linear',
        'marquee-vertical': 'marquee-y var(--duration) linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
