import React, { useRef } from 'react';
import { View, Text, Platform } from 'react-native';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';

interface SliderControlProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    onValueChange: (value: number) => void;
    disabled?: boolean;
    unit?: string;
    description?: string;
}

export function SliderControl({
    label,
    value,
    min,
    max,
    step = 1,
    onValueChange,
    disabled,
    unit,
    description
}: SliderControlProps) {
    const lastHapticValue = useRef(value);

    const handleValueChange = (newValue: number) => {
        // Trigger haptic feedback every 10% of the range
        if (Platform.OS === 'ios') {
            const range = max - min;
            const threshold = range / 10;
            if (Math.abs(newValue - lastHapticValue.current) >= threshold) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                lastHapticValue.current = newValue;
            }
        }
        onValueChange(newValue);
    };

    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <View className="p-4 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
            <View className="flex-row justify-between items-center mb-3">
                <View className="flex-1">
                    <Text className="text-lg font-medium text-neutral-900 dark:text-neutral-50 mb-1">
                        {label}
                    </Text>
                    {description && (
                        <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                            {description}
                        </Text>
                    )}
                </View>
                <View className="bg-neutral-100 dark:bg-neutral-700 px-3 py-2 rounded-lg ml-3">
                    <Text className="text-lg font-bold text-neutral-900 dark:text-neutral-50">
                        {value}{unit ? ` ${unit}` : ''}
                    </Text>
                </View>
            </View>
            <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={min}
                maximumValue={max}
                step={step}
                value={value}
                onValueChange={handleValueChange}
                disabled={disabled}
                minimumTrackTintColor="#000000"
                maximumTrackTintColor="#D4D4D4"
                thumbTintColor="#000000"
                accessibilityLabel={label}
                accessibilityValue={{
                    min,
                    max,
                    now: value,
                    text: `${value}${unit ? ` ${unit}` : ''}`
                }}
            />
            <View className="flex-row justify-between items-center mt-1">
                <Text className="text-xs text-neutral-400 dark:text-neutral-500">
                    {min}{unit ? ` ${unit}` : ''}
                </Text>
                <Text className="text-xs text-neutral-400 dark:text-neutral-500">
                    {percentage.toFixed(0)}%
                </Text>
                <Text className="text-xs text-neutral-400 dark:text-neutral-500">
                    {max}{unit ? ` ${unit}` : ''}
                </Text>
            </View>
        </View>
    );
}
