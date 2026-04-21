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
        sans: ['Inter', 'sans-serif'],
        accent: ['Playfair Display', 'serif'],
      },
      colors: {
        'teal': {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        'teal-light': '#ccfbf1',
        'charcoal': '#1f2937',
        'gray-light': '#f9fafb',
        'gray-text': '#6b7280',
        'gray-mid': '#9ca3af',
        'gray-border': '#e5e7eb',
        'orange': '#f97316',
        'orange-light': '#fed7aa',
        'success': '#10b981',
        'error': '#ef4444',
      },
      borderRadius: {
        'pill': '9999px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
}

export default config
