/**
 * ControlButtons - Large tactile buttons for LED control
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '@/src/lib/version';

export interface ControlButtonsProps {
  /** Callback when Toggle is pressed */
  onToggle: () => void;

  /** Callback when On is pressed */
  onTurnOn: () => void;

  /** Callback when Off is pressed */
  onTurnOff: () => void;

  /** Whether buttons are disabled */
  disabled?: boolean;

  /** Which button is currently busy */
  busyButton?: 'toggle' | 'on' | 'off' | null;
}

export function ControlButtons({
  onToggle,
  onTurnOn,
  onTurnOff,
  disabled = false,
  busyButton = null,
}: ControlButtonsProps) {
  return (
    <View style={styles.container}>
      {/* Toggle Button */}
      <ControlButton
        title="Toggle"
        onPress={onToggle}
        disabled={disabled}
        isLoading={busyButton === 'toggle'}
        color={COLORS.primary}
      />

      {/* On Button */}
      <ControlButton
        title="On"
        onPress={onTurnOn}
        disabled={disabled}
        isLoading={busyButton === 'on'}
        color={COLORS.success}
      />

      {/* Off Button */}
      <ControlButton
        title="Off"
        onPress={onTurnOff}
        disabled={disabled}
        isLoading={busyButton === 'off'}
        color={COLORS.danger}
      />
    </View>
  );
}

/**
 * Single control button component
 */
interface ControlButtonProps {
  title: string;
  onPress: () => void;
  disabled: boolean;
  isLoading: boolean;
  color: string;
}

function ControlButton({
  title,
  onPress,
  disabled,
  isLoading,
  color,
}: ControlButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: isDisabled ? COLORS.text.disabled : color },
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator color="#ffffff" size="large" />
      ) : (
        <Text style={styles.buttonText}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  button: {
    flex: 1,
    aspectRatio: 1, // Make it square-ish
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    color: '#ffffff',
  },
});
