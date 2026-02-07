import React from 'react';
import { View, Text, Switch, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';

interface ToggleControlProps {
    label: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    disabled?: boolean;
    description?: string;
}

export function ToggleControl({ label, value, onValueChange, disabled, description }: ToggleControlProps) {
    const scale = useSharedValue(1);

    const handleToggle = (newValue: boolean) => {
        scale.value = withSpring(0.95, { damping: 15 }, () => {
            scale.value = withSpring(1, { damping: 15 });
        });

        if (Platform.OS === 'ios') {
            Haptics.impactAsync(
                newValue ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light
            );
        }
        onValueChange(newValue);
    };

    const switchStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    return (
        <View className="flex-row items-center justify-between">
            {/* Status Indicator */}
            <View className="flex-row items-center flex-1">
                <View
                    className="w-3 h-3 rounded-full mr-3"
                    style={{
                        backgroundColor: value ? '#10b981' : '#4b5563',
                        shadowColor: value ? '#10b981' : '#4b5563',
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: value ? 0.6 : 0.3,
                        shadowRadius: value ? 6 : 3,
                    }}
                />
                <View className="flex-1">
                    <Text className="text-white text-lg font-semibold tracking-tight">
                        {value ? 'ON' : 'OFF'}
                    </Text>
                    {description && (
                        <Text className="text-white/40 text-[10px] font-mono mt-0.5">
                            {description}
                        </Text>
                    )}
                </View>
            </View>

            {/* iOS-style Switch */}
            <Animated.View style={switchStyle}>
                <Switch
                    value={value}
                    onValueChange={handleToggle}
                    disabled={disabled}
                    trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: '#10b981' }}
                    thumbColor="#ffffff"
                    ios_backgroundColor="rgba(255, 255, 255, 0.2)"
                    accessibilityLabel={label}
                    accessibilityRole="switch"
                    accessibilityState={{ checked: value, disabled: !!disabled }}
                />
            </Animated.View>
        </View>
    );
}
