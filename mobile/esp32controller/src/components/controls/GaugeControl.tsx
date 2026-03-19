import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    interpolateColor
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface GaugeControlProps {
    label: string;
    value: number;
    min: number;
    max: number;
    unit?: string;
}

export function GaugeControl({ label, value, min, max, unit }: GaugeControlProps) {
    const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
    const animatedPercentage = useSharedValue(0);

    useEffect(() => {
        animatedPercentage.value = withSpring(percentage, {
            damping: 15,
            stiffness: 100,
            mass: 1
        });
    }, [percentage]);

    const progressStyle = useAnimatedStyle(() => {
        const backgroundColor = interpolateColor(
            animatedPercentage.value,
            [0, 50, 100],
            ['#3b82f6', '#10b981', '#f59e0b']
        );

        return {
            width: `${animatedPercentage.value}%`,
            backgroundColor
        };
    });

    const getStatusColor = () => {
        if (percentage < 33) return '#3b82f6';
        if (percentage < 66) return '#10b981';
        return '#f59e0b';
    };

    return (
        <View>
            {/* Value Display */}
            <View className="mb-3">
                <Text className="text-white text-4xl font-bold tracking-tighter">
                    {value}
                    <Text className="text-white/40 text-2xl font-normal">
                        {unit ? ` ${unit}` : ''}
                    </Text>
                </Text>
            </View>

            {/* Progress Track */}
            <View className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                <Animated.View
                    style={[progressStyle]}
                    className="h-full rounded-full"
                >
                    <View className="w-full h-full opacity-80" />
                </Animated.View>
            </View>

            {/* Min/Max Labels */}
            <View className="flex-row justify-between">
                <Text className="text-white/40 text-[10px] font-mono">
                    {min}{unit}
                </Text>
                <Text className="text-white/40 text-[10px] font-mono">
                    {max}{unit}
                </Text>
            </View>
        </View>
    );
}
