/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        // Backgrounds
        background: '#0a0a0a',
        surface: '#1a1a1a',
        'surface-hover': '#252525',

        // Borders
        border: '#2a2a2a',
        'border-hover': '#3a3a3a',

        // Brand
        primary: {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
        },
        success: {
          DEFAULT: '#10b981',
          hover: '#059669',
        },
        danger: {
          DEFAULT: '#ef4444',
          hover: '#dc2626',
        },
        warning: {
          DEFAULT: '#f59e0b',
          hover: '#d97706',
        },

        // Latency
        'latency-excellent': '#10b981',
        'latency-good': '#fbbf24',
        'latency-slow': '#f97316',
        'latency-very-slow': '#ef4444',

        // Text (using custom scale for high contrast)
        text: {
          primary: '#ffffff',
          secondary: '#a3a3a3',
          tertiary: '#737373',
          disabled: '#525252',
        },
      },
      borderRadius: {
        'card': '12px',
        'button': '16px',
        'pill': '9999px',
      },
      spacing: {
        'card': '16px',
      },
    },
  },
  plugins: [],
};
