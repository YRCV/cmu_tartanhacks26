import React from 'react';
import { Pressable, Text, ActivityIndicator, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

interface PrimaryActionButtonProps {
    onPress: () => void;
    title: string;
    isLoading?: boolean;
    disabled?: boolean;
}

export function PrimaryActionButton({
    onPress,
    title,
    isLoading = false,
    disabled = false
}: PrimaryActionButtonProps) {
    const isDisabled = isLoading || disabled;

    const handlePress = () => {
        if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        onPress();
    };

    return (
        <Pressable
            onPress={handlePress}
            disabled={isDisabled}
            className={`w-full py-4 rounded-xl items-center justify-center shadow-sm ${
                isDisabled
                    ? 'bg-neutral-200 dark:bg-neutral-700'
                    : 'bg-black dark:bg-white active:opacity-80'
            }`}
            accessibilityRole="button"
            accessibilityState={{ disabled: isDisabled, busy: isLoading }}
            accessibilityLabel={title}
        >
            {isLoading ? (
                <ActivityIndicator
                    color={isDisabled ? '#A3A3A3' : Platform.OS === 'ios' ? '#FFFFFF' : '#FFFFFF'}
                />
            ) : (
                <Text
                    className={`text-lg font-semibold ${
                        isDisabled
                            ? 'text-neutral-400 dark:text-neutral-500'
                            : 'text-white dark:text-black'
                    }`}
                >
                    {title}
                </Text>
            )}
        </Pressable>
    );
}
