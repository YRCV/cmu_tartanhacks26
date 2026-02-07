import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { TechGrid } from '@/src/components/ui/TechGrid';
import { theme, hairlineWidth } from '@/src/theme/colors';

export default function ReviewPage() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [isDeploying, setIsDeploying] = useState(false);
    const [holdProgress, setHoldProgress] = useState(0);
    const [isHolding, setIsHolding] = useState(false);
    const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const HOLD_DURATION_MS = 3000;

    const triggerDeploy = () => {
        setIsDeploying(true);
        setTimeout(() => {
            setIsDeploying(false);
            router.push('/(tabs)/dashboard');
        }, 2000);
    };

    const handleBack = () => {
        Alert.alert(
            'Discard Changes?',
            'Going back will discard this firmware configuration. Are you sure?',
            [
                {
                    text: 'Stay',
                    style: 'cancel'
                },
                {
                    text: 'Discard',
                    style: 'destructive',
                    onPress: () => router.back()
                }
            ]
        );
    };

    const reasoningItems = [
        { label: 'Sensors Detected', value: 'Temperature', icon: '🌡️' },
        { label: 'Actuators Used', value: 'LED (PWM)', icon: '💡' },
        { label: 'Logic Applied', value: 'Pulse rate increases linearly with temperature', icon: '⚙️' },
        { label: 'User Controls', value: 'Slider (Manual Override), Gauge (Live Temperature)', icon: '🎛️' }
    ];

    const clearHoldTimers = () => {
        if (holdTimeoutRef.current) {
            clearTimeout(holdTimeoutRef.current);
            holdTimeoutRef.current = null;
        }
        if (holdIntervalRef.current) {
            clearInterval(holdIntervalRef.current);
            holdIntervalRef.current = null;
        }
    };

    const handleHoldStart = () => {
        if (isDeploying) return;
        clearHoldTimers();
        setIsHolding(true);
        setHoldProgress(0);
        const start = Date.now();

        if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        holdIntervalRef.current = setInterval(() => {
            const elapsed = Date.now() - start;
            setHoldProgress(Math.min(1, elapsed / HOLD_DURATION_MS));
        }, 50);

        holdTimeoutRef.current = setTimeout(() => {
            clearHoldTimers();
            setIsHolding(false);
            setHoldProgress(1);
            if (Platform.OS === 'ios') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            triggerDeploy();
        }, HOLD_DURATION_MS);
    };

    const handleHoldEnd = () => {
        if (isDeploying) return;
        clearHoldTimers();
        if (isHolding) {
            setIsHolding(false);
            setHoldProgress(0);
            if (Platform.OS === 'ios') {
                Haptics.selectionAsync();
            }
        }
    };

    useEffect(() => {
        return () => {
            clearHoldTimers();
        };
    }, []);

    return (
        <View style={styles.container}>
            <TechGrid />

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[
                    styles.content,
                    { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
                ]}
            >
                <Pressable onPress={handleBack} style={styles.backButton}>
                    <Text style={styles.backText}>← Back to Edit</Text>
                </Pressable>

                <View style={styles.heroCard}>
                    <BlurView intensity={80} tint={theme.blur.ultraThin} style={StyleSheet.absoluteFill} />
                    <Text style={styles.heroSubtitle}>Review</Text>
                    <Text style={styles.heroTitle}>Your Configuration</Text>
                    <Text style={styles.heroBody}>
                        We’ve analyzed your request and configured the firmware. Review the components
                        and behavior below before deploying to your device.
                    </Text>
                </View>

                <View style={styles.infoCard}>
                    <BlurView intensity={70} tint={theme.blur.thin} style={StyleSheet.absoluteFill} />
                    <View style={styles.infoRow}>
                        <Text style={styles.infoIcon}>ℹ️</Text>
                        <View style={styles.infoText}>
                            <Text style={styles.infoTitle}>What happens next?</Text>
                            <Text style={styles.infoBody}>
                                Deploying will compile and flash this firmware to your ESP32. Your device
                                will restart automatically.
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.card}>
                    <BlurView intensity={70} tint={theme.blur.thin} style={StyleSheet.absoluteFill} />
                    <Text style={styles.cardTitle}>Configuration Summary</Text>
                    {reasoningItems.map((item, index) => (
                        <View key={item.label} style={styles.reasoningRow}>
                            <View style={styles.reasoningHeader}>
                                <Text style={styles.reasoningIcon}>{item.icon}</Text>
                                <Text style={styles.reasoningLabel}>{item.label}</Text>
                            </View>
                            <Text style={styles.reasoningValue}>{item.value}</Text>
                            {index < reasoningItems.length - 1 && <View style={styles.divider} />}
                        </View>
                    ))}
                </View>

                <View style={styles.card}>
                    <BlurView intensity={70} tint={theme.blur.thin} style={StyleSheet.absoluteFill} />
                    <Text style={styles.cardTitle}>Estimated Flash Time</Text>
                    <Text style={styles.estimateValue}>~15 seconds</Text>
                    <Text style={styles.estimateNote}>Device will be offline during deployment</Text>
                </View>

                <Pressable
                    onPressIn={handleHoldStart}
                    onPressOut={handleHoldEnd}
                    onPressCancel={handleHoldEnd}
                    disabled={isDeploying}
                    style={({ pressed }) => [
                        styles.holdButton,
                        pressed && !isDeploying ? { transform: [{ scale: 0.99 }] } : null,
                    ]}
                >
                    <BlurView intensity={80} tint={theme.blur.material} style={StyleSheet.absoluteFill} />
                    <View style={[styles.holdProgress, { width: `${holdProgress * 100}%` }]} />
                    <View style={styles.holdContent}>
                        {isDeploying ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <Text style={styles.holdText}>
                                {isHolding ? 'Keep holding to deploy…' : 'Hold 3s to Deploy'}
                            </Text>
                        )}
                    </View>
                </Pressable>

                <Pressable onPress={handleBack} disabled={isDeploying} style={styles.backLink}>
                    <Text style={styles.backLinkText}>Go Back & Edit</Text>
                </Pressable>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    scroll: {
        flex: 1,
    },
    content: {
        paddingHorizontal: theme.layout.padding.screen,
        gap: 16,
    },
    backButton: {
        alignSelf: 'flex-start',
        paddingVertical: 8,
    },
    backText: {
        fontSize: 14,
        color: theme.text.secondary,
    },
    heroCard: {
        borderRadius: theme.layout.borderRadius.lg,
        borderWidth: hairlineWidth,
        borderColor: theme.border.default,
        padding: 20,
        overflow: 'hidden',
    },
    heroSubtitle: {
        fontSize: 10,
        color: theme.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 1.6,
        marginBottom: 6,
        fontFamily: 'monospace',
    },
    heroTitle: {
        fontSize: 22,
        fontWeight: '600',
        color: theme.text.primary,
        marginBottom: 10,
    },
    heroBody: {
        fontSize: 14,
        lineHeight: 20,
        color: theme.text.secondary,
    },
    infoCard: {
        borderRadius: theme.layout.borderRadius.lg,
        borderWidth: hairlineWidth,
        borderColor: theme.border.subtle,
        padding: 16,
        overflow: 'hidden',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    infoIcon: {
        fontSize: 18,
    },
    infoText: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.text.primary,
        marginBottom: 4,
    },
    infoBody: {
        fontSize: 12,
        lineHeight: 18,
        color: theme.text.secondary,
    },
    card: {
        borderRadius: theme.layout.borderRadius.lg,
        borderWidth: hairlineWidth,
        borderColor: theme.border.default,
        padding: 16,
        overflow: 'hidden',
    },
    cardTitle: {
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 1.6,
        color: theme.text.tertiary,
        marginBottom: 12,
        fontFamily: 'monospace',
    },
    reasoningRow: {
        gap: 6,
    },
    reasoningHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    reasoningIcon: {
        fontSize: 14,
    },
    reasoningLabel: {
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        color: theme.text.tertiary,
        fontFamily: 'monospace',
    },
    reasoningValue: {
        fontSize: 14,
        lineHeight: 20,
        color: theme.text.primary,
        marginBottom: 8,
    },
    divider: {
        height: hairlineWidth,
        backgroundColor: theme.border.subtle,
        marginBottom: 12,
    },
    estimateValue: {
        fontSize: 20,
        fontWeight: '600',
        color: theme.text.primary,
        marginBottom: 4,
    },
    estimateNote: {
        fontSize: 12,
        color: theme.text.secondary,
    },
    holdButton: {
        borderRadius: theme.layout.borderRadius.lg,
        borderWidth: hairlineWidth,
        borderColor: 'rgba(99, 102, 241, 0.4)',
        overflow: 'hidden',
        minHeight: 56,
        justifyContent: 'center',
    },
    holdProgress: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        backgroundColor: 'rgba(99, 102, 241, 0.35)',
    },
    holdContent: {
        alignItems: 'center',
        paddingVertical: 14,
    },
    holdText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ffffff',
    },
    backLink: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    backLinkText: {
        color: theme.text.secondary,
        fontSize: 12,
        fontWeight: '500',
    },
});
