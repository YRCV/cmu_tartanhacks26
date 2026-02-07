import React from 'react';
import { TextInput, View, Text } from 'react-native';

interface IntentInputProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    label?: string;
    disabled?: boolean;
    maxLength?: number;
    error?: string | null;
}

export function IntentInput({
    value,
    onChangeText,
    placeholder = "Describe behavior...",
    label,
    disabled = false,
    maxLength,
    error
}: IntentInputProps) {
    const hasError = !!error;

    return (
        <View className="space-y-2">
            {label && (
                <Text className="text-4xl font-bold text-neutral-900 dark:text-neutral-50">
                    {label}
                </Text>
            )}
            <TextInput
                className={`w-full h-40 bg-white dark:bg-neutral-800 rounded-2xl p-6 text-lg text-neutral-900 dark:text-neutral-50 border-2 shadow-sm ${
                    disabled
                        ? 'opacity-50 border-neutral-200 dark:border-neutral-700'
                        : hasError
                        ? 'border-red-400 dark:border-red-500'
                        : 'border-neutral-200 dark:border-neutral-700 focus:border-black dark:focus:border-white'
                }`}
                placeholder={placeholder}
                placeholderTextColor="#A3A3A3"
                multiline
                textAlignVertical="top"
                value={value}
                onChangeText={onChangeText}
                editable={!disabled}
                maxLength={maxLength}
                accessibilityLabel="Device behavior description input"
                accessibilityHint="Describe what you want your device to do"
            />
            {hasError && (
                <View className="flex-row items-center px-1 mt-1">
                    <Text className="text-sm text-red-600 dark:text-red-400">
                        ⚠️ {error}
                    </Text>
                </View>
            )}
        </View>
    );
}
