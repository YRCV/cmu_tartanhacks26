import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { GlassCard } from './GlassCard';
import { AlertTriangle, X } from 'lucide-react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

interface GlassAlertProps {
    title?: string;
    message: string;
    onDismiss?: () => void;
    variant?: 'error' | 'warning';
}

export function GlassAlert({
    title = "Error",
    message,
    onDismiss,
    variant = 'error'
}: GlassAlertProps) {
    const isError = variant === 'error';
    const iconColor = isError ? '#ff453a' : '#ff9f0a';
    const bgColor = isError ? 'bg-red-500/10' : 'bg-orange-500/10';
    const borderColor = isError ? 'border-red-500/20' : 'border-orange-500/20';

    return (
        <Animated.View entering={FadeInUp} exiting={FadeOutUp} className="mb-4">
            <GlassCard
                className={`border ${borderColor}`}
                intensity={40}
                tint="systemThickMaterialDark"
            >
                <View className={`flex-row gap-3 ${bgColor} -m-4 p-4`}>
                    <View className="mt-0.5">
                        <AlertTriangle size={20} color={iconColor} />
                    </View>
                    <View className="flex-1">
                        <Text className="text-white font-semibold mb-1">{title}</Text>
                        <Text className="text-neutral-300 text-sm leading-5">{message}</Text>
                    </View>
                    {onDismiss && (
                        <TouchableOpacity onPress={onDismiss} className="p-1 -mt-1 -mr-1">
                            <X size={20} color="#a3a3a3" />
                        </TouchableOpacity>
                    )}
                </View>
            </GlassCard>
        </Animated.View>
    );
}
