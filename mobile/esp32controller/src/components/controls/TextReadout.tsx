import React from 'react';
import { View, Text } from 'react-native';

interface TextReadoutProps {
    label: string;
    value: string | number;
    unit?: string;
}

export function TextReadout({ label, value, unit }: TextReadoutProps) {
    return (
        <View className="p-4 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm flex-row justify-between items-center">
            <Text className="text-lg font-medium text-neutral-900 dark:text-neutral-50">
                {label}
            </Text>
            <Text className="text-xl font-bold text-neutral-900 dark:text-neutral-50">
                {value}{unit ? ` ${unit}` : ''}
            </Text>
        </View>
    );
}
