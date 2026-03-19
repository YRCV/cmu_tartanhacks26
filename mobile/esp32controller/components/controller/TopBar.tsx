/**
 * TopBar - Header with device name and IP pill
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '@/src/lib/version';

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
    <View style={styles.container}>
      {/* Device Name */}
      <TouchableOpacity
        onPress={onEditName}
        disabled={!onEditName}
        activeOpacity={0.7}
      >
        <Text style={styles.deviceName}>{deviceName}</Text>
      </TouchableOpacity>

      {/* IP Pill */}
      <TouchableOpacity
        style={styles.ipPill}
        onPress={onEditIp}
        disabled={!onEditIp}
        activeOpacity={0.7}
      >
        <Text style={styles.ipText}>{deviceIp || 'Set IP'}</Text>
        {onEditIp && <Text style={styles.editIcon}>ⓘ</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.text.primary,
  },
  deviceName: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: '700',
    color: '#ffffff',
  },
  ipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    minWidth: 100,
  },
  ipText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: SPACING.xs,
  },
  editIcon: {
    fontSize: FONT_SIZE.base,
    color: '#ffffff',
  },
});
