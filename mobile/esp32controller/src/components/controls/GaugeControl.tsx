import React from 'react';
import { View, Text } from 'react-native';

interface GaugeControlProps {
    label: string;
    value: number;
    min: number;
    max: number;
    unit?: string;
}

export function GaugeControl({ label, value, min, max, unit }: GaugeControlProps) {
    // Simple linear gauge implementation
    const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

    return (
        <View className="p-4 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm space-y-3">
            <View className="flex-row justify-between items-center">
                <Text className="text-lg font-medium text-neutral-900 dark:text-neutral-50">
                    {label}
                </Text>
                <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                    {value}{unit ? ` ${unit}` : ''}
                </Text>
            </View>

            <View className="h-4 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                <View
                    className="h-full bg-black dark:bg-white rounded-full"
                    style={{ width: `${percentage}%` }}
                />
            </View>

            <View className="flex-row justify-between">
                <Text className="text-xs text-neutral-400">{min}</Text>
                <Text className="text-xs text-neutral-400">{max}</Text>
            </View>
        </View>
    );
}
