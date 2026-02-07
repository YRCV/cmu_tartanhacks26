/**
 * ConnectionCard - Displays device connection status and latency
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { ConnectionStatus } from '@/src/lib/deviceScreenState';
import {
  formatLatency,
  getLatencyColor,
  getLatencyLabel,
  COLORS,
  SPACING,
  RADIUS,
  FONT_SIZE,
} from '@/src/lib/version';

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

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      disabled={!onPress || isRefreshing}
      activeOpacity={0.7}
    >
      {/* Status Row */}
      <View style={styles.statusRow}>
        <View style={styles.statusLeft}>
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: statusConfig.color },
            ]}
          />
          <Text style={styles.statusText}>{statusConfig.label}</Text>
        </View>
      </View>

      {/* Last Seen */}
      {lastSeen && (
        <Text style={styles.lastSeen}>
          Last seen: {formatTimeSince(lastSeen)}
        </Text>
      )}

      {/* Latency */}
      {latencyMs !== undefined && latencyMs > 0 && (
        <View style={styles.latencyRow}>
          <Text style={styles.latencyLabel}>⚡ Latency:</Text>
          <View
            style={[
              styles.latencyBadge,
              { backgroundColor: getLatencyColor(latencyMs) },
            ]}
          >
            <Text style={styles.latencyValue}>{formatLatency(latencyMs)}</Text>
          </View>
          <Text style={styles.latencyRating}>
            ({getLatencyLabel(latencyMs)})
          </Text>
        </View>
      )}

      {/* Tap hint */}
      {onPress && !isRefreshing && (
        <Text style={styles.tapHint}>Tap to refresh</Text>
      )}

      {isRefreshing && <Text style={styles.tapHint}>Refreshing...</Text>}
    </TouchableOpacity>
  );
}

/**
 * Get status configuration (color, label, icon)
 */
function getStatusConfig(status: ConnectionStatus) {
  switch (status) {
    case 'online':
      return {
        color: COLORS.success,
        label: 'Online',
        icon: '🟢',
      };
    case 'offline':
      return {
        color: COLORS.danger,
        label: 'Offline',
        icon: '🔴',
      };
    case 'unknown':
    default:
      return {
        color: COLORS.text.disabled,
        label: 'Unknown',
        icon: '⚪',
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.sm,
  },
  statusText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  lastSeen: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },
  latencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  latencyLabel: {
    fontSize: FONT_SIZE.base,
    color: COLORS.text.primary,
    marginRight: SPACING.sm,
  },
  latencyBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    marginRight: SPACING.sm,
  },
  latencyValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: '#ffffff',
  },
  latencyRating: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
  },
  tapHint: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.text.disabled,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
});
