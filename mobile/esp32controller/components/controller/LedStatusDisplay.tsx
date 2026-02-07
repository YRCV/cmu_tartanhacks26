/**
 * LedStatusDisplay - Visual display of current LED state
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '@/src/lib/version';

export interface LedStatusDisplayProps {
  /** Current LED state from response */
  ledState: 'on' | 'off' | 'unknown';
}

export function LedStatusDisplay({ ledState }: LedStatusDisplayProps) {
  const config = getLedConfig(ledState);

  return (
    <View style={styles.container}>
      <View style={[styles.ledIndicator, { backgroundColor: config.color }]} />
      <Text style={styles.statusText}>{config.label}</Text>
    </View>
  );
}

/**
 * Get LED configuration based on state
 */
function getLedConfig(state: 'on' | 'off' | 'unknown') {
  switch (state) {
    case 'on':
      return {
        color: '#fbbf24', // yellow
        label: 'LED is ON',
      };
    case 'off':
      return {
        color: '#6b7280', // gray
        label: 'LED is OFF',
      };
    case 'unknown':
    default:
      return {
        color: '#9ca3af', // lighter gray
        label: 'LED Status Unknown',
      };
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  ledIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: SPACING.md,
  },
  statusText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
});
