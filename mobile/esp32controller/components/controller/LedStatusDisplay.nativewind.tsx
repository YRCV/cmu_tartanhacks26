/**
 * LedStatusDisplay - Visual display of current LED state (NativeWind version)
 */

import React from 'react';
import { View, Text } from 'react-native';

export interface LedStatusDisplayProps {
  /** Current LED state from response */
  ledState: 'on' | 'off' | 'unknown';
}

export function LedStatusDisplay({ ledState }: LedStatusDisplayProps) {
  const config = getLedConfig(ledState);

  return (
    <View className="flex-row items-center justify-center bg-surface border border-border rounded-card p-4 mb-4">
      <View className={`w-5 h-5 rounded-full mr-3 ${config.color}`} />
      <Text className="text-text-primary text-lg font-semibold">
        {config.label}
      </Text>
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
        color: 'bg-yellow-400', // Yellow for "on"
        label: 'LED is ON',
      };
    case 'off':
      return {
        color: 'bg-text-tertiary', // Gray for "off"
        label: 'LED is OFF',
      };
    case 'unknown':
    default:
      return {
        color: 'bg-text-disabled', // Lighter gray for "unknown"
        label: 'LED Status Unknown',
      };
  }
}
