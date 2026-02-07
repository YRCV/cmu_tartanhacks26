/**
 * Version Control Utilities
 *
 * Provides app version information for display and debugging.
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Version information structure
 */
export interface VersionInfo {
  /** App version from package.json (e.g., "1.0.0") */
  appVersion: string;

  /** Build number from app config */
  buildNumber: string;

  /** When this build was created */
  buildDate: Date;

  /** Git commit hash (if available) */
  gitHash?: string;

  /** Git branch name (if available) */
  gitBranch?: string;

  /** Platform (ios, android, web) */
  platform: string;

  /** OS version */
  osVersion: string;

  /** Device model */
  deviceModel?: string;

  /** Expo SDK version */
  expoVersion: string;
}

/**
 * Get current app version info
 */
export function getVersionInfo(): VersionInfo {
  // Get version from package.json via Expo Constants
  const appVersion = Constants.expoConfig?.version || '0.0.0';

  // Get build number (iOS/Android specific)
  const buildNumber =
    Platform.OS === 'ios'
      ? Constants.expoConfig?.ios?.buildNumber || '1'
      : Platform.OS === 'android'
      ? String(Constants.expoConfig?.android?.versionCode || 1)
      : '1';

  // Build date (from Constants or current time if not available)
  const buildDate = Constants.expoConfig?.extra?.buildDate
    ? new Date(Constants.expoConfig.extra.buildDate)
    : new Date();

  // Git info (if injected at build time)
  const gitHash = Constants.expoConfig?.extra?.gitHash;
  const gitBranch = Constants.expoConfig?.extra?.gitBranch;

  // Platform info
  const platform = Platform.OS;
  const osVersion = Platform.Version.toString();
  const deviceModel = Constants.deviceName;

  // Expo SDK version
  const expoVersion = Constants.expoConfig?.sdkVersion || 'unknown';

  return {
    appVersion,
    buildNumber,
    buildDate,
    gitHash,
    gitBranch,
    platform,
    osVersion,
    deviceModel,
    expoVersion,
  };
}

/**
 * Format version for display (e.g., "v1.0.0")
 */
export function formatVersion(version: string): string {
  return version.startsWith('v') ? version : `v${version}`;
}

/**
 * Format full version with build number (e.g., "v1.0.0 (23)")
 */
export function formatFullVersion(info: VersionInfo): string {
  return `${formatVersion(info.appVersion)} (${info.buildNumber})`;
}

/**
 * Format time since last update (e.g., "2m ago")
 */
export function formatTimeSince(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return `${diffSec}s ago`;
  } else if (diffMin < 60) {
    return `${diffMin}m ago`;
  } else if (diffHour < 24) {
    return `${diffHour}h ago`;
  } else {
    return `${diffDay}d ago`;
  }
}

/**
 * Format build date for display (e.g., "2026-02-07 15:30")
 */
export function formatBuildDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * Get short version string for footer (e.g., "v1.0.0 • Updated 2m ago")
 */
export function getVersionFooter(info: VersionInfo): string {
  return `${formatVersion(info.appVersion)} • Updated ${formatTimeSince(
    info.buildDate
  )}`;
}

/**
 * Get latency color based on milliseconds
 */
export function getLatencyColor(latencyMs: number): string {
  if (latencyMs < 100) {
    return '#10b981'; // green - excellent
  } else if (latencyMs < 300) {
    return '#fbbf24'; // yellow - good
  } else if (latencyMs < 1000) {
    return '#f97316'; // orange - slow
  } else {
    return '#ef4444'; // red - very slow
  }
}

/**
 * Get latency label
 */
export function getLatencyLabel(latencyMs: number): string {
  if (latencyMs < 100) {
    return 'Excellent';
  } else if (latencyMs < 300) {
    return 'Good';
  } else if (latencyMs < 1000) {
    return 'Slow';
  } else {
    return 'Very Slow';
  }
}

/**
 * Format latency for display (e.g., "43ms" or "1.2s")
 */
export function formatLatency(latencyMs: number): string {
  if (latencyMs < 1000) {
    return `${latencyMs}ms`;
  } else {
    return `${(latencyMs / 1000).toFixed(1)}s`;
  }
}

/**
 * Constants for UI
 */
export const LATENCY_COLORS = {
  excellent: '#10b981', // green
  good: '#fbbf24', // yellow
  slow: '#f97316', // orange
  verySlow: '#ef4444', // red
  unknown: '#6b7280', // gray
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
} as const;

export const COLORS = {
  primary: '#3b82f6', // blue
  success: '#10b981', // green
  danger: '#ef4444', // red
  warning: '#f59e0b', // orange
  background: '#f9fafb',
  surface: '#ffffff',
  border: '#e5e7eb',
  text: {
    primary: '#111827',
    secondary: '#6b7280',
    disabled: '#9ca3af',
  },
} as const;

export const FONT_SIZE = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
} as const;

export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;
