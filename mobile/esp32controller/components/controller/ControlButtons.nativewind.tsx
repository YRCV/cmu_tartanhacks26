/**
 * ControlButtons - Large tactile buttons for LED control (NativeWind version)
 */

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';

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
    <View className="flex-row gap-4 mb-4">
      {/* Toggle Button */}
      <ControlButton
        title="Toggle"
        onPress={onToggle}
        disabled={disabled}
        isLoading={busyButton === 'toggle'}
        colorClass="bg-primary active:bg-primary-hover"
      />

      {/* On Button */}
      <ControlButton
        title="On"
        onPress={onTurnOn}
        disabled={disabled}
        isLoading={busyButton === 'on'}
        colorClass="bg-success active:bg-success-hover"
      />

      {/* Off Button */}
      <ControlButton
        title="Off"
        onPress={onTurnOff}
        disabled={disabled}
        isLoading={busyButton === 'off'}
        colorClass="bg-danger active:bg-danger-hover"
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
  colorClass: string;
}

function ControlButton({
  title,
  onPress,
  disabled,
  isLoading,
  colorClass,
}: ControlButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      className={`flex-1 rounded-button p-6 items-center justify-center min-h-[100px] shadow-md ${
        isDisabled ? 'bg-text-disabled opacity-50' : colorClass
      }`}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator color="#ffffff" size="large" />
      ) : (
        <Text className="text-white text-xl font-semibold">{title}</Text>
      )}
    </TouchableOpacity>
  );
}
