import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, Pattern, Rect, Path } from 'react-native-svg';
import { theme } from '@/src/theme/colors';

interface TechGridProps {
    className?: string;
}

/**
 * TechGrid Background - Rich Black Foundation
 *
 * Premium dark mode grid with anti-OLED ghosting
 * Linear/Raycast-inspired subtle depth
 */
export function TechGrid({ className }: TechGridProps) {
    const strokeColor = '#0a0a0a';  // Slightly lighter than bg for subtle grid
    const gridOpacity = 0.25;

    return (
        <View className={`absolute inset-0 -z-10 ${className}`}>
            <Svg height="100%" width="100%">
                <Defs>
                    <Pattern
                        id="smallGrid"
                        width="20"
                        height="20"
                        patternUnits="userSpaceOnUse"
                    >
                        <Path
                            d="M 20 0 L 0 0 0 20"
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth="0.5"
                            opacity={gridOpacity}
                        />
                    </Pattern>
                    <Pattern
                        id="grid"
                        width="100"
                        height="100"
                        patternUnits="userSpaceOnUse"
                    >
                        <Rect width="100" height="100" fill="url(#smallGrid)" />
                        <Path
                            d="M 100 0 L 0 0 0 100"
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth="1"
                            opacity={gridOpacity * 1.3}
                        />
                    </Pattern>
                </Defs>

                {/* Rich Black Background (#050505) */}
                <Rect width="100%" height="100%" fill={theme.background} />

                {/* Subtle Grid Pattern */}
                <Rect width="100%" height="100%" fill="url(#grid)" />
            </Svg>

            {/* Depth Gradient (Very Subtle) */}
            <View
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    opacity: 0.4,
                }}
                pointerEvents="none"
            >
                <View className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zinc-950/40" />
            </View>
        </View>
    );
}
