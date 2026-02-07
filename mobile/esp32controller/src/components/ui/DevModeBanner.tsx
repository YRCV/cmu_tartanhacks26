import React from 'react';
import { View, Text, Pressable, Platform, StyleSheet } from 'react-native';
import { useState } from 'react';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { theme, hairlineWidth, typography } from '@/src/theme/colors';

/**
 * Development Mode Banner - System Notification Style
 *
 * Linear-grade design: Minimal, floating, glass
 * Shows when EXPO_PUBLIC_MOCK_DEVICE=true
 */
export const DevModeBanner: React.FC = () => {
    const [isMinimized, setIsMinimized] = useState(false);
    const isMockMode = process.env.EXPO_PUBLIC_MOCK_DEVICE === 'true';

    if (!isMockMode) {
        return null;
    }

    const handleToggle = () => {
        if (Platform.OS === 'ios') {
            Haptics.selectionAsync();
        }
        setIsMinimized(!isMinimized);
    };

    if (isMinimized) {
        return (
            <Pressable
                onPress={handleToggle}
                style={({ pressed }) => [
                    styles.minimized,
                    { opacity: pressed ? 0.7 : 1 }
                ]}
            >
                <BlurView
                    intensity={60}
                    tint={theme.blur.thin}
                    style={[StyleSheet.absoluteFill, { borderRadius: 999 }]}
                />
                <Text style={styles.minimizedText}>DEV</Text>
            </Pressable>
        );
    }

    return (
        <View style={styles.expanded}>
            <BlurView
                intensity={80}
                tint={theme.blur.thin}
                style={[StyleSheet.absoluteFill, { borderRadius: 999 }]}
            />
            <View style={styles.content}>
                <View style={styles.leftSection}>
                    <View style={[styles.statusDot, { backgroundColor: theme.colors.success }]} />
                    <Text style={styles.text}>Dev Mode - Mock Data</Text>
                </View>
                <Pressable
                    onPress={handleToggle}
                    style={({ pressed }) => [
                        styles.hideButton,
                        { opacity: pressed ? 0.7 : 1 }
                    ]}
                >
                    <Text style={styles.hideText}>Hide</Text>
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    minimized: {
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 50,
        overflow: 'hidden',
        borderRadius: 999,
        borderWidth: hairlineWidth,
        borderColor: theme.border.strong,
    },
    minimizedText: {
        ...typography.monoUppercase,
        color: theme.colors.primaryLight,
        fontSize: 10,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    expanded: {
        position: 'absolute',
        top: 8,
        left: 8,
        right: 8,
        zIndex: 50,
        overflow: 'hidden',
        borderRadius: 999,
        borderWidth: hairlineWidth,
        borderColor: theme.border.strong,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 8,
    },
    text: {
        ...typography.monoUppercase,
        color: theme.text.secondary,
        fontSize: 10,
    },
    hideButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: theme.surfaceGlass,
        borderRadius: 8,
    },
    hideText: {
        ...typography.monoUppercase,
        color: theme.text.tertiary,
        fontSize: 9,
    },
});

/**
 * Hook to check if app is in dev/mock mode
 */
export const useDevMode = () => {
    const isMockMode = process.env.EXPO_PUBLIC_MOCK_DEVICE === 'true';
    return {
        isDevMode: isMockMode,
        espIp: process.env.EXPO_PUBLIC_ESP_IP || '192.168.1.100',
    };
};
