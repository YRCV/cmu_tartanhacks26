/**
 * ConnectionCard - Displays device connection status and latency (NativeWind version)
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { ConnectionStatus } from '@/src/lib/deviceScreenState';

export interface ConnectionCardProps {
  /** Current connection status */
  status: ConnectionStatus;

  /** Last successful connection timestamp */
  lastSeen?: Date;

  /** Last request latency in milliseconds */
  latencyMs?: number;

  /** Callback when card is tapped (e.g., to refresh status) */
  onPress?: () => void;

  /** Whether a refresh is in progress */
  isRefreshing?: boolean;
}

export function ConnectionCard({
  status,
  lastSeen,
  latencyMs,
  onPress,
  isRefreshing = false,
}: ConnectionCardProps) {
  const statusConfig = getStatusConfig(status);
  const latencyConfig = latencyMs ? getLatencyConfig(latencyMs) : null;

  return (
    <TouchableOpacity
      className="bg-surface border border-border rounded-card p-card mb-4 active:bg-surface-hover"
      onPress={onPress}
      disabled={!onPress || isRefreshing}
      activeOpacity={0.7}
    >
      {/* Status Row */}
      <View className="flex-row items-center mb-2">
        <View className={`w-3 h-3 rounded-full mr-2 ${statusConfig.bgColor}`} />
        <Text className="text-text-primary text-lg font-semibold">
          {statusConfig.label}
        </Text>
      </View>

      {/* Last Seen */}
      {lastSeen && (
        <Text className="text-text-secondary text-sm mb-2">
          Last seen: {formatTimeSince(lastSeen)}
        </Text>
      )}

      {/* Latency */}
      {latencyConfig && (
        <View className="flex-row items-center mt-1">
          <Text className="text-text-primary mr-2">⚡ Latency:</Text>
          <View className={`px-2 py-1 rounded ${latencyConfig.bgColor}`}>
            <Text className="text-white text-sm font-semibold">
              {latencyConfig.display}
            </Text>
          </View>
          <Text className="text-text-secondary text-sm ml-2">
            ({latencyConfig.label})
          </Text>
        </View>
      )}

      {/* Tap hint */}
      {onPress && !isRefreshing && (
        <Text className="text-text-disabled text-xs mt-3 text-center">
          Tap to refresh
        </Text>
      )}

      {isRefreshing && (
        <Text className="text-text-disabled text-xs mt-3 text-center">
          Refreshing...
        </Text>
      )}
    </TouchableOpacity>
  );
}

/**
 * Get status configuration (color, label)
 */
function getStatusConfig(status: ConnectionStatus) {
  switch (status) {
    case 'online':
      return {
        bgColor: 'bg-success',
        label: 'Online',
      };
    case 'offline':
      return {
        bgColor: 'bg-danger',
        label: 'Offline',
      };
    case 'unknown':
    default:
      return {
        bgColor: 'bg-text-disabled',
        label: 'Unknown',
      };
  }
}

/**
 * Get latency configuration (color, label, display)
 */
function getLatencyConfig(ms: number) {
  const display = ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;

  if (ms < 100) {
    return {
      bgColor: 'bg-latency-excellent',
      label: 'Excellent',
      display,
    };
  } else if (ms < 300) {
    return {
      bgColor: 'bg-latency-good',
      label: 'Good',
      display,
    };
  } else if (ms < 1000) {
    return {
      bgColor: 'bg-latency-slow',
      label: 'Slow',
      display,
    };
  } else {
    return {
      bgColor: 'bg-latency-very-slow',
      label: 'Very Slow',
      display,
    };
  }
}

/**
 * Format time since (e.g., "2s ago")
 */
function formatTimeSince(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 60) {
    return `${diffSec}s ago`;
  } else if (diffMin < 60) {
    return `${diffMin}m ago`;
  } else if (diffHour < 24) {
    return `${diffHour}h ago`;
  } else {
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay}d ago`;
  }
}
