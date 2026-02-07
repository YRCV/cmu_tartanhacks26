import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withSequence
} from 'react-native-reanimated';

interface TextReadoutProps {
    label: string;
    value: string | number;
    unit?: string;
}

export function TextReadout({ label, value, unit }: TextReadoutProps) {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    // Animate when value changes
    useEffect(() => {
        scale.value = withSequence(
            withSpring(1.1, { damping: 15, stiffness: 200 }),
            withSpring(1, { damping: 15, stiffness: 200 })
        );
        opacity.value = withSequence(
            withSpring(0.7, { damping: 15 }),
            withSpring(1, { damping: 15 })
        );
    }, [value]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value
    }));

    return (
        <Animated.View entering={FadeIn.springify().damping(15)}>
            {/* Value Display */}
            <Animated.View style={animatedStyle} className="mb-2">
                <Text className="text-white text-3xl font-bold tracking-tight">
                    {value}
                    {unit && (
                        <Text className="text-white/50 text-xl font-normal">
                            {` ${unit}`}
                        </Text>
                    )}
                </Text>
            </Animated.View>

            {/* Decorative Divider */}
            <View className="h-px bg-white/10 rounded-full" />
        </Animated.View>
    );
}
