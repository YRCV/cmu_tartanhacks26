/**
 * TopBar - Header with device name and IP pill (NativeWind + Blur version)
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';

export interface TopBarProps {
  /** Device name/title */
  deviceName: string;

  /** Device IP address */
  deviceIp: string;

  /** Callback when device name is tapped */
  onEditName?: () => void;

  /** Callback when IP pill is tapped */
  onEditIp?: () => void;
}

export function TopBar({
  deviceName,
  deviceIp,
  onEditName,
  onEditIp,
}: TopBarProps) {
  return (
    <BlurView
      intensity={20}
      tint="dark"
      className="flex-row justify-between items-center px-6 py-4 border-b border-border"
    >
      {/* Device Name */}
      <TouchableOpacity
        onPress={onEditName}
        disabled={!onEditName}
        activeOpacity={0.7}
      >
        <Text className="text-text-primary text-2xl font-bold">
          {deviceName}
        </Text>
      </TouchableOpacity>

      {/* IP Pill */}
      <TouchableOpacity
        className="flex-row items-center bg-surface-hover px-4 py-2 rounded-pill min-w-[100px] active:bg-border-hover"
        onPress={onEditIp}
        disabled={!onEditIp}
        activeOpacity={0.7}
      >
        <Text className="text-text-primary text-sm font-semibold mr-1">
          {deviceIp || 'Set IP'}
        </Text>
        {onEditIp && <Text className="text-text-primary text-base">ⓘ</Text>}
      </TouchableOpacity>
    </BlurView>
  );
}
