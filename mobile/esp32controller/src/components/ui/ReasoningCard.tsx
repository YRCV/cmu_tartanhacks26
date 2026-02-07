import React from 'react';
import { View, Text } from 'react-native';

interface ReasoningItem {
    label: string;
    value: string;
    icon?: string;
}

interface ReasoningCardProps {
    title?: string;
    items: ReasoningItem[];
}

export function ReasoningCard({ title, items }: ReasoningCardProps) {
    return (
        <View className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-sm space-y-4">
            {title && (
                <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
                    {title}
                </Text>
            )}

            {items.map((item, index) => (
                <React.Fragment key={item.label}>
                    <View>
                        <View className="flex-row items-center mb-1">
                            {item.icon && (
                                <Text className="text-base mr-2">{item.icon}</Text>
                            )}
                            <Text className="text-neutral-500 dark:text-neutral-400 text-xs font-semibold uppercase tracking-wider">
                                {item.label}
                            </Text>
                        </View>
                        <Text className="text-lg text-neutral-900 dark:text-neutral-50 leading-6">
                            {item.value}
                        </Text>
                    </View>
                    {index < items.length - 1 && (
                        <View className="h-px bg-neutral-100 dark:bg-neutral-700" />
                    )}
                </React.Fragment>
            ))}
        </View>
    );
}
