/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],

  theme: {
    extend: {
      colors: {
        // Backgrounds
        background: '#000000', // Deepest black for OLED
        surface: '#1c1c1e',    // Apple system gray 6 dark
        'surface-highlight': '#2c2c2e', // Apple system gray 5 dark

        // Brand / Accents (Neon-like)
        primary: {
          DEFAULT: '#0a84ff', // iOS System Blue
          glow: 'rgba(10, 132, 255, 0.5)',
        },
        success: {
          DEFAULT: '#30d158', // iOS System Green
          glow: 'rgba(48, 209, 88, 0.5)',
        },
        danger: {
          DEFAULT: '#ff453a', // iOS System Red
          glow: 'rgba(255, 69, 58, 0.5)',
        },
        warning: {
          DEFAULT: '#ff9f0a', // iOS System Orange
          glow: 'rgba(255, 159, 10, 0.5)',
        },

        // Text
        text: {
          primary: '#ffffff',
          secondary: '#ebebf599', // Apple label secondary (60%)
          tertiary: '#ebebf54d',  // Apple label tertiary (30%)
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
