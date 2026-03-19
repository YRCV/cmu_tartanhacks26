/**
 * Rich Black Foundation - Premium Dark Mode Theme
 *
 * Inspired by Linear Mobile, Raycast, Apple HIG
 * Optimized for OLED displays with anti-ghosting measures
 */

export const theme = {
  // Rich Black Foundation (Anti-OLED Smear)
  background: '#050505',        // Zinc-950 - prevents pixel ghosting
  surface: '#121212',           // Elevated cards
  surfaceGlass: 'rgba(255, 255, 255, 0.05)', // Glass overlay

  // Borders & Separation (No Drop Shadows)
  border: {
    hairline: 0.5,              // StyleSheet.hairlineWidth equivalent
    subtle: 'rgba(255, 255, 255, 0.08)',
    default: 'rgba(255, 255, 255, 0.10)',
    strong: 'rgba(255, 255, 255, 0.15)',
  },

  // Text Hierarchy (WCAG AA Compliant)
  text: {
    primary: '#ffffff',          // Headings
    secondary: '#a3a3a3',        // Body (neutral-400)
    tertiary: '#525252',         // Meta/Icons (neutral-600)
    muted: 'rgba(255, 255, 255, 0.6)',
    disabled: 'rgba(255, 255, 255, 0.4)',
    placeholder: 'rgba(255, 255, 255, 0.3)',
  },

  // Brand Colors (Premium Palette)
  colors: {
    // Primary - Indigo
    primary: '#6366f1',          // indigo-500
    primaryLight: '#818cf8',     // indigo-400
    primaryDark: '#4f46e5',      // indigo-600

    // Success - Emerald
    success: '#10b981',          // emerald-500
    successLight: '#34d399',     // emerald-400
    successDark: '#059669',      // emerald-600

    // Warning - Amber
    warning: '#f59e0b',          // amber-500
    warningLight: '#fbbf24',     // amber-400
    warningDark: '#d97706',      // amber-600

    // Error - Red
    error: '#ef4444',            // red-500
    errorLight: '#f87171',       // red-400
    errorDark: '#dc2626',        // red-600

    // Info - Blue
    info: '#3b82f6',             // blue-500
    infoLight: '#60a5fa',        // blue-400
    infoDark: '#2563eb',         // blue-600
  },

  // Code Syntax (Pastel/Light for Readability)
  syntax: {
    keyword: '#a5b4fc',          // indigo-300 (was indigo-500)
    string: '#6ee7b7',           // emerald-300 (was emerald-500)
    number: '#fcd34d',           // amber-300 (was amber-500)
    comment: '#737373',          // neutral-500
    function: '#c7d2fe',         // indigo-200
    operator: '#e5e5e5',         // neutral-200
    punctuation: '#d4d4d4',      // neutral-300
    variable: '#f5f5f5',         // neutral-100
    type: '#93c5fd',             // blue-300
  },

  // Glass Materials (iOS System)
  blur: {
    ultraThin: 'systemUltraThinMaterialDark',
    thin: 'systemThinMaterialDark',
    material: 'systemMaterialDark',
    thick: 'systemThickMaterialDark',
  },

  // Layout Constants
  layout: {
    headerHeight: 56,
    tabBarHeight: 85,            // iOS with home indicator
    headerSafeTopOffset: 12,     // Extra spacing below safe area for headers
    borderRadius: {
      sm: 12,
      md: 16,
      lg: 24,                    // Squircle approximation
    },
    padding: {
      screen: 24,                // px-6
      card: 20,                  // px-5
    },
    gap: 16,
  },

  // Shadows (Avoid - Use Borders Instead)
  // For exceptional cases only
  shadow: {
    glow: {
      shadowColor: '#6366f1',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
    },
  },
} as const;

// Type exports
export type Theme = typeof theme;
export type ColorKey = keyof typeof theme.colors;
export type SyntaxKey = keyof typeof theme.syntax;

// Utility: Get hairline width for current platform
export const hairlineWidth = 0.5; // StyleSheet.hairlineWidth is ~0.33-0.5

// Typography utilities
export const typography = {
  tabularNums: { fontVariant: ['tabular-nums' as const] },
  monoUppercase: {
    fontFamily: 'monospace',
    textTransform: 'uppercase' as const,
    letterSpacing: 2,
  },
} as const;
