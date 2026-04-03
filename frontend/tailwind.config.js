/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#2B8A8F',
          light: '#E8F5F5',
          dark: '#1E6B6F',
        },
        orange: {
          DEFAULT: '#F58220',
          light: '#FFF4E6',
          dark: '#D96E10',
        },
        charcoal: '#333333',
        'gray-text': '#666666',
        'gray-mid': '#999999',
        'gray-border': '#E5E5E5',
        'gray-light': '#F5F5F5',
        success: '#2D5F3F',
        error: '#D93025',
        'co-blue': '#1E4D8B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        accent: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        pill: '20px',
      },
      boxShadow: {
        card: '0px 4px 12px rgba(0, 0, 0, 0.08)',
        btn: '4px 4px 0px rgba(0, 0, 0, 0.9)',
        'btn-hover': '6px 6px 0px rgba(0, 0, 0, 0.9)',
      },
    },
  },
  plugins: [],
};
