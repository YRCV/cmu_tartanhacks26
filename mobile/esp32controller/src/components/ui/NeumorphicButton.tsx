import React from 'react';
import { Text, Pressable } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { cn } from '@/src/lib/utils';
import { BlurView } from 'expo-blur';

interface NeumorphicButtonProps {
    onPress?: () => void;
    children?: React.ReactNode;
    className?: string;
    variant?: 'primary' | 'secondary' | 'glass' | 'danger';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    disabled?: boolean;
    active?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function NeumorphicButton({
    onPress,
    children,
    className,
    variant = 'primary',
    size = 'md',
    disabled = false,
    active = false,
}: NeumorphicButtonProps) {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    const handlePressIn = () => {
        if (disabled) return;
        scale.value = withSpring(0.92, { damping: 10, stiffness: 400 });
        opacity.value = withTiming(0.8, { duration: 100 });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handlePressOut = () => {
        if (disabled) return;
        scale.value = withSpring(1, { damping: 10, stiffness: 400 });
        opacity.value = withTiming(1, { duration: 100 });
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    // Variant Styles
    const variants = {
        primary: active
            ? 'bg-primary shadow-[0_0_20px_rgba(10,132,255,0.4)] border-primary'
            : 'bg-surface-highlight border-white/5 active:bg-primary/20',
        secondary: 'bg-surface border-white/5',
        glass: 'bg-white/10 border-white/20 backdrop-blur-md',
        danger: 'bg-danger/10 border-danger/20 text-danger',
    };

    const sizes = {
        sm: 'h-10 px-4 rounded-xl',
        md: 'h-14 px-6 rounded-2xl',
        lg: 'h-16 px-8 rounded-3xl',
        icon: 'h-16 w-16 rounded-[30px] items-center justify-center',
    };

    return (
        <AnimatedPressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
            className={cn(
                'items-center justify-center border',
                variants[variant],
                sizes[size],
                disabled && 'opacity-50',
                className
            )}
            style={animatedStyle}
        >
            {variant === 'glass' ? (
                <BlurView intensity={20} className="absolute inset-0" />
            ) : null}

            {typeof children === 'string' ? (
                <Text className={cn(
                    "font-semibold text-white",
                    size === 'lg' ? 'text-lg' : 'text-base',
                    variant === 'danger' && 'text-danger'
                )}>
                    {children}
                </Text>
            ) : (
                children
            )}
        </AnimatedPressable>
    );
}
