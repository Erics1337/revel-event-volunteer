import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        accent: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0px 4px 12px rgba(0, 0, 0, 0.08)',
        'btn': '4px 4px 0px rgba(0, 0, 0, 0.9)',
        'btn-hover': '6px 6px 0px rgba(0, 0, 0, 0.9)',
        'btn-lift': '2px 2px 0px rgba(0, 0, 0, 0.9)',
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'pill': '20px',
      },
      colors: {
        'teal': {
          DEFAULT: '#2B8A8F',
          light: '#E8F5F5',
          dark: '#1E6B6F',
          50: '#E8F5F5',
          100: '#d0ebe9',
          200: '#a7d9d6',
          300: '#7ec7c3',
          400: '#55b5b0',
          500: '#2B8A8F',
          600: '#237579',
          700: '#1E6B6F',
          800: '#195b5e',
          900: '#134b4e',
        },
        'orange': {
          DEFAULT: '#F58220',
          light: '#FFF4E6',
          dark: '#D96E10',
          50: '#FFF4E6',
          100: '#ffe4cc',
          200: '#fed7aa',
          300: '#fdc088',
          400: '#fba955',
          500: '#F58220',
          600: '#e06e0b',
          700: '#D96E10',
          800: '#b85c0d',
          900: '#974a0b',
        },
        'charcoal': '#333333',
        'gray': {
          light: '#F5F5F5',
          border: '#E5E5E5',
          mid: '#999999',
          text: '#666666',
        },
        'co': {
          blue: '#1E4D8B',
          gold: '#FFD700',
          green: '#2D5F3F',
        },
        'success': '#2D5F3F',
        'warning': '#F58220',
        'error': '#D93025',
      },
    },
  },
  plugins: [],
}

export default config
