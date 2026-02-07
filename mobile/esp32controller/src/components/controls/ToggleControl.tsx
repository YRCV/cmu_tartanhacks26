import React from 'react';
import { View, Text, Switch, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

interface ToggleControlProps {
    label: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    disabled?: boolean;
    description?: string;
}

export function ToggleControl({ label, value, onValueChange, disabled, description }: ToggleControlProps) {
    const handleToggle = (newValue: boolean) => {
        if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onValueChange(newValue);
    };

    return (
        <View className="p-4 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
            <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-4">
                    <Text className="text-lg font-medium text-neutral-900 dark:text-neutral-50 mb-1">
                        {label}
                    </Text>
                    {description && (
                        <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                            {description}
                        </Text>
                    )}
                </View>
                <Switch
                    value={value}
                    onValueChange={handleToggle}
                    disabled={disabled}
                    trackColor={{ false: '#A3A3A3', true: '#22C55E' }}
                    thumbColor={value ? '#FFFFFF' : '#f4f3f4'}
                    accessibilityLabel={label}
                    accessibilityRole="switch"
                    accessibilityState={{ checked: value, disabled: !!disabled }}
                />
            </View>
        </View>
    );
}
