import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Alert, Dimensions, Platform, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedScrollHandler,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { ScreenLayout } from '@/src/components/layout/ScreenLayout';
import { ControlRenderer } from '@/src/components/ui/ControlRenderer';
import { LayoutDashboard, Plus } from 'lucide-react-native';
import { theme, hairlineWidth } from '@/src/theme/colors';

const INITIAL_CONTROLS = [
    {
        id: 'c1',
        type: 'gauge' as const,
        label: 'Temperature',
        value: 24,
        min: 0,
        max: 50,
        unit: '°C',
    },
    {
        id: 'c4',
        type: 'text' as const,
        label: 'System Uptime',
        value: '12m 30s',
    },
    {
        id: 'c2',
        type: 'slider' as const,
        label: 'LED Pulse',
        value: 50,
        min: 0,
        max: 100,
        unit: '%',
    },
    {
        id: 'c3',
        type: 'toggle' as const,
        label: 'Auto Mode',
        value: true,
    }
];

export default function DashboardPage() {
    const router = useRouter();
    const [controls, setControls] = useState(INITIAL_CONTROLS);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('connected');
    const insets = useSafeAreaInsets();

    const { width } = Dimensions.get('window');
    const CARD_WIDTH = (width - (theme.layout.padding.screen * 2) - theme.layout.gap) / 2;

    // Scroll animation
    const scrollY = useSharedValue(0);
    const scrollHandler = useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
    });

    // Animated header style
    const stickyHeaderStyle = useAnimatedStyle(() => ({
        opacity: interpolate(scrollY.value, [50, 100], [0, 1], Extrapolation.CLAMP),
        transform: [
            { translateY: interpolate(scrollY.value, [50, 100], [-10, 0], Extrapolation.CLAMP) }
        ],
    }));

    const handleControlChange = (id: string, newValue: any) => {
        setControls(prev => prev.map(c =>
            c.id === id ? { ...c, value: newValue } : c
        ));
    };

    const handleNewConfiguration = () => {
        if (Platform.OS === 'ios') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }

        Alert.alert(
            'New Configuration',
            'This will discard your current setup. Continue?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => {
                        if (Platform.OS === 'ios') {
                            Haptics.selectionAsync();
                        }
                    }
                },
                {
                    text: 'Continue',
                    style: 'destructive',
                    onPress: () => {
                        if (Platform.OS === 'ios') {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        }
                        router.push('/(tabs)/generate');
                    }
                }
            ]
        );
    };

    // Simulate live updates
    useEffect(() => {
        const interval = setInterval(() => {
            setControls(prev => prev.map(c => {
                if (c.id === 'c1' && c.type === 'gauge') {
                    return { ...c, value: Math.round(24 + Math.random() * 4 - 2) };
                }
                if (c.id === 'c4' && c.type === 'text') {
                    const [mins, secs] = c.value.split('m ');
                    const totalSecs = parseInt(mins) * 60 + parseInt(secs) + 1;
                    const newMins = Math.floor(totalSecs / 60);
                    const newSecs = totalSecs % 60;
                    return { ...c, value: `${newMins}m ${newSecs}s` };
                }
                return c;
            }));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const getStatusBadge = () => {
        if (process.env.EXPO_PUBLIC_MOCK_DEVICE === 'true') {
            return { label: 'Dev Mode', color: 'success' as const };
        }
        if (connectionStatus === 'connected') {
            return { label: 'Connected', color: 'success' as const };
        }
        return undefined;
    };

    return (
        <ScreenLayout useCustomHeader scrollable={false}>
            {/* Animated Sticky Header */}
            <Animated.View
                style={[
                    styles.stickyHeader,
                    { paddingTop: insets.top + theme.layout.headerSafeTopOffset, paddingBottom: 20 },
                    stickyHeaderStyle
                ]}
                pointerEvents="box-none"
            >
                <BlurView
                    intensity={95}
                    tint={theme.blur.material}
                    style={[StyleSheet.absoluteFill, { borderBottomWidth: hairlineWidth, borderBottomColor: theme.border.subtle }]}
                />
                <View style={styles.stickyHeaderContent}>
                    <View style={styles.headerLeft}>
                        <LayoutDashboard size={16} color="#ffffff" opacity={0.6} />
                        <Text style={styles.stickyHeaderTitle}>ESP32 Controller</Text>
                    </View>
                    <View style={[styles.statusDot, { width: 6, height: 6 }]} />
                </View>
            </Animated.View>

            {/* Scrollable Content */}
            <Animated.ScrollView
                showsVerticalScrollIndicator={true}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                contentContainerStyle={{
                    paddingTop: insets.top,
                    paddingBottom: 120,
                    paddingHorizontal: theme.layout.padding.screen
                }}
            >
                {/* Hero Header */}
                <View style={styles.heroHeader}>
                    <BlurView
                        intensity={80}
                        tint={theme.blur.ultraThin}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.headerContent}>
                        <View style={styles.headerLeft}>
                            <LayoutDashboard size={16} color="#ffffff" opacity={0.6} />
                            <View>
                                <Text style={styles.headerSubtitle}>Monitor</Text>
                                <Text style={styles.headerTitle}>ESP32 Controller</Text>
                            </View>
                        </View>
                        <View style={styles.statusBadge}>
                            <View style={styles.statusDot} />
                            <Text style={styles.headerStatusText}>{getStatusBadge()?.label || 'Offline'}</Text>
                        </View>
                    </View>
                </View>

                {/* Grid Layout */}
                <View style={styles.grid}>
                    {controls.map((control) => (
                        <View key={control.id} style={{ width: CARD_WIDTH }}>
                            <View style={styles.card}>
                                <Text style={styles.cardLabel}>{control.label}</Text>
                                <ControlRenderer
                                    schema={control}
                                    onValueChange={(val) => handleControlChange(control.id, val)}
                                />
                            </View>
                        </View>
                    ))}

                    {/* Add Widget Button */}
                    <Pressable
                        onPress={() => {
                            if (Platform.OS === 'ios') {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }
                            handleNewConfiguration();
                        }}
                        style={({ pressed }) => [
                            {
                                width: CARD_WIDTH,
                                transform: [{ scale: pressed ? 0.95 : 1 }],
                            },
                        ]}
                    >
                        <View style={styles.addCard}>
                            <View style={styles.addIconContainer}>
                                <Plus size={24} color={theme.text.tertiary} strokeWidth={2} />
                            </View>
                            <Text style={styles.addText}>Add Widget</Text>
                        </View>
                    </Pressable>
                </View>
            </Animated.ScrollView>
        </ScreenLayout>
    );
}

const styles = StyleSheet.create({
    stickyHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        paddingHorizontal: theme.layout.padding.screen,
        paddingBottom: 12,
        backgroundColor: 'transparent',
    },
    stickyHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
    },
    stickyHeaderTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#ffffff',
        marginLeft: 8,
    },
    heroHeader: {
        marginBottom: 16,
        borderRadius: theme.layout.borderRadius.lg,
        borderWidth: hairlineWidth,
        borderColor: theme.border.default,
        overflow: 'hidden',
    },
    headerContent: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerSubtitle: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.6)',
        fontFamily: 'monospace',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    headerTitle: {
        fontSize: 20,
        color: '#ffffff',
        fontWeight: '600',
        letterSpacing: -0.5,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10b981',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
    },
    headerStatusText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
        fontFamily: 'monospace',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.layout.gap,
    },
    card: {
        backgroundColor: theme.surface,
        borderRadius: theme.layout.borderRadius.lg,
        borderWidth: hairlineWidth,
        borderColor: theme.border.default,
        padding: theme.layout.padding.card,
        minHeight: 160,
    },
    cardLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: theme.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    addCard: {
        backgroundColor: theme.surfaceGlass,
        borderRadius: theme.layout.borderRadius.lg,
        borderWidth: hairlineWidth,
        borderColor: theme.border.subtle,
        minHeight: 160,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.surfaceGlass,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    addText: {
        fontSize: 13,
        fontWeight: '500',
        color: theme.text.tertiary,
    },
});
