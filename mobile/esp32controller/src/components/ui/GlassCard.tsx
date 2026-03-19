import React from 'react';
import { View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { cssInterop } from 'nativewind';
import { twMerge } from 'tailwind-merge';

// Enable class styling for BlurView
cssInterop(BlurView, {
    className: 'style',
});

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    intensity?: number;
    tint?: 'light' | 'dark' | 'default' | 'prominent' | 'systemThinMaterial' | 'systemMaterial' | 'systemThickMaterial' | 'systemChromeMaterial' | 'systemUltraThinMaterial' | 'systemThinMaterialLight' | 'systemMaterialLight' | 'systemThickMaterialLight' | 'systemChromeMaterialLight' | 'systemUltraThinMaterialLight' | 'systemThinMaterialDark' | 'systemMaterialDark' | 'systemThickMaterialDark' | 'systemChromeMaterialDark' | 'systemUltraThinMaterialDark';
    style?: ViewStyle;
}

export function GlassCard({
    children,
    className,
    intensity = 20,
    tint = 'systemThinMaterialDark',
    style
}: GlassCardProps) {
    return (
        <BlurView
            intensity={intensity}
            tint={tint}
            className={twMerge(
                'overflow-hidden rounded-3xl border border-white/10 bg-transparent',
                className
            )}
            style={style}
        >
            <View className="p-4 bg-white/5">
                {children}
            </View>
        </BlurView>
    );
}
