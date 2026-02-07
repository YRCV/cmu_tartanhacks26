
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
    useSharedValue,
    useAnimatedProps,
    withTiming,
    Easing,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularGaugeProps {
    value: number;
    min?: number;
    max?: number;
    unit?: string;
    label?: string;
    size?: number;
    strokeWidth?: number;
}

const { width } = Dimensions.get('window');

export function CircularGauge({
    value,
    min = 0,
    max = 100,
    unit = '%',
    label = 'Intensity',
    size = width * 0.7,
    strokeWidth = 20,
}: CircularGaugeProps) {
    // Constants
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const halfCircle = radius + strokeWidth;

    // Animation values
    const progress = useSharedValue(0);

    // Update animation when value changes
    useEffect(() => {
        const percentage = Math.max(0, Math.min(1, (value - min) / (max - min)));
        progress.value = withTiming(percentage, {
            duration: 1000,
            easing: Easing.out(Easing.exp),
        });
    }, [value, min, max, progress]);

    // Animated props for the SVG Circle
    const animatedProps = useAnimatedProps(() => {
        // We only want a 240 degree arc (leaving bottom open)
        // 240 degrees is 2/3 of a circle
        const arcLength = circumference * 0.75;
        const strokeDashoffset = arcLength * (1 - progress.value);

        return {
            strokeDasharray: [arcLength, circumference], // Dash pattern: [arc, gap]
            strokeDashoffset: strokeDashoffset,
        };
    });

    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <Defs>
                    <LinearGradient id="grad" x1="0" y1="0" x2="100%" y2="0">
                        <Stop offset="0" stopColor="#0a84ff" stopOpacity="0.4" />
                        <Stop offset="1" stopColor="#30d158" stopOpacity="1" />
                    </LinearGradient>
                </Defs>

                {/* Background Track */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#1c1c1e"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={[circumference * 0.75, circumference]}
                    strokeDashoffset={0}
                    rotation="-225"
                    origin={`${size / 2}, ${size / 2}`}
                />

                {/* Foreground Progress (Animated) */}
                <AnimatedCircle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="url(#grad)" // Use gradient
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    rotation="-225"
                    origin={`${size / 2}, ${size / 2}`}
                    animatedProps={animatedProps}
                />
            </Svg>

            {/* Center Content */}
            <View style={StyleSheet.absoluteFillObject} className="items-center justify-center">
                <Text className="text-neutral-500 text-lg font-medium mb-1">{label}</Text>
                <Text className="text-white text-7xl font-light tracking-tighter">
                    {Math.round(value)}
                </Text>
                <Text className="text-neutral-400 text-xl font-medium mt-1">{unit}</Text>
            </View>
        </View>
    );
}
