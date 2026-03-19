import React, { useRef } from 'react';
import { View, Text, Platform } from 'react-native';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';

interface SliderControlProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    onValueChange: (value: number) => void;
    disabled?: boolean;
    unit?: string;
    description?: string;
}

export function SliderControl({
    label,
    value,
    min,
    max,
    step = 1,
    onValueChange,
    disabled,
    unit,
    description
}: SliderControlProps) {
    const lastHapticValue = useRef(value);
    const scale = useSharedValue(1);

    const handleValueChange = (newValue: number) => {
        // Trigger haptic feedback every 10% of the range
        if (Platform.OS === 'ios') {
            const range = max - min;
            const threshold = range / 10;
            if (Math.abs(newValue - lastHapticValue.current) >= threshold) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                lastHapticValue.current = newValue;
            }
        }
        onValueChange(newValue);
    };

    const handleSlidingStart = () => {
        scale.value = withSpring(1.05, { damping: 15 });
        if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
    };

    const handleSlidingComplete = () => {
        scale.value = withSpring(1, { damping: 15 });
        if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
    };

    const valueBoxStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <View>
            {/* Value Display */}
            <Animated.View style={valueBoxStyle} className="mb-3">
                <View className="bg-white/10 rounded-2xl px-4 py-3 border border-white/10">
                    <Text className="text-white text-3xl font-bold tracking-tight text-center">
                        {value}
                        <Text className="text-white/50 text-xl font-normal">
                            {unit ? ` ${unit}` : ''}
                        </Text>
                    </Text>
                </View>
            </Animated.View>

            {/* iOS-style Slider */}
            <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={min}
                maximumValue={max}
                step={step}
                value={value}
                onValueChange={handleValueChange}
                onSlidingStart={handleSlidingStart}
                onSlidingComplete={handleSlidingComplete}
                disabled={disabled}
                minimumTrackTintColor="#ffffff"
                maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
                thumbTintColor="#ffffff"
                accessibilityLabel={label}
                accessibilityValue={{
                    min,
                    max,
                    now: value,
                    text: `${value}${unit ? ` ${unit}` : ''}`
                }}
            />

            {/* Min/Max Labels */}
            <View className="flex-row justify-between items-center mt-1">
                <Text className="text-white/40 text-[10px] font-mono">
                    {min}{unit}
                </Text>
                <View className="px-2 py-1 bg-white/5 rounded">
                    <Text className="text-white/60 text-[9px] font-mono">
                        {percentage.toFixed(0)}%
                    </Text>
                </View>
                <Text className="text-white/40 text-[10px] font-mono">
                    {max}{unit}
                </Text>
            </View>
        </View>
    );
}
