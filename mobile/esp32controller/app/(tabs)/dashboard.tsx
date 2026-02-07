import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Alert, Dimensions, Platform, StyleSheet, TextInput, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { LayoutDashboard, Unplug, Wifi } from 'lucide-react-native';
import { theme, hairlineWidth } from '@/src/theme/colors';

const STORAGE_LAST_IP = 'device.lastIp';

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
    const [connectedDeviceIp, setConnectedDeviceIp] = useState<string | null>(null);
    const [isLoadingConnection, setIsLoadingConnection] = useState(true);
    const insets = useSafeAreaInsets();

    const { width } = Dimensions.get('window');
    const CARD_WIDTH = (width - (theme.layout.padding.screen * 2) - theme.layout.gap) / 2;

    // Scroll animation
    const scrollY = useSharedValue(0);
    const scrollHandler = useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
    });

    // Animated header style - fades in after scrolling past hero
    const stickyHeaderStyle = useAnimatedStyle(() => ({
        opacity: interpolate(scrollY.value, [60, 110], [0, 1], Extrapolation.CLAMP),
        transform: [
            { translateY: interpolate(scrollY.value, [60, 110], [-10, 0], Extrapolation.CLAMP) }
        ],
    }));

    // Check for connected device on mount
    useEffect(() => {
        const checkConnection = async () => {
            try {
                const lastIp = await AsyncStorage.getItem(STORAGE_LAST_IP);
                setConnectedDeviceIp(lastIp);
            } catch (error) {
                console.error('Failed to load device connection:', error);
            } finally {
                setIsLoadingConnection(false);
            }
        };
        checkConnection();
    }, []);

    const handleControlChange = (id: string, newValue: any) => {
        setControls(prev => prev.map(c =>
            c.id === id ? { ...c, value: newValue } : c
        ));
    };

    // Simulate live updates only when device is connected
    useEffect(() => {
        if (!connectedDeviceIp) return;

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
    }, [connectedDeviceIp]);

    const getStatusBadge = () => {
        if (process.env.EXPO_PUBLIC_MOCK_DEVICE === 'true') {
            return { label: 'Dev Mode', color: 'success' as const };
        }
        if (connectedDeviceIp) {
            return { label: 'Connected', color: 'success' as const };
        }
        return undefined;
    };

    const [ipInput, setIpInput] = useState('192.168.1.100');
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [ipHistory, setIpHistory] = useState<string[]>([]);

    // Load IP history on mount
    useEffect(() => {
        const load = async () => {
            try {
                const historyRaw = await AsyncStorage.getItem('device.ipHistory');
                if (historyRaw) {
                    const parsed = JSON.parse(historyRaw);
                    if (Array.isArray(parsed)) setIpHistory(parsed.filter((v) => typeof v === 'string'));
                }
                if (connectedDeviceIp) {
                    setIpInput(connectedDeviceIp);
                }
            } catch {
                // ignore storage errors
            }
        };
        load();
    }, [connectedDeviceIp]);

    const persistIp = async (ip: string) => {
        try {
            await AsyncStorage.setItem(STORAGE_LAST_IP, ip);
            const nextHistory = [ip, ...ipHistory.filter((i) => i !== ip)].slice(0, 5);
            setIpHistory(nextHistory);
            await AsyncStorage.setItem('device.ipHistory', JSON.stringify(nextHistory));
        } catch {
            // ignore storage errors
        }
    };

    const isValidIP = (ip: string): boolean => {
        if (!ip || typeof ip !== 'string') return false;
        const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
        const match = ip.match(ipRegex);
        if (!match) return false;
        const octets = match.slice(1, 5).map(Number);
        return octets.every(octet => octet >= 0 && octet <= 255);
    };

    const handleConnect = async () => {
        if (!ipInput.trim()) return;
        const ip = ipInput.trim();
        if (!isValidIP(ip)) {
            setErrorMessage('Invalid IP address format.');
            setConnectionStatus('error');
            return;
        }

        setConnectionStatus('connecting');
        setErrorMessage(null);
        if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        // Simulate connection (replace with actual device client call)
        await new Promise(r => setTimeout(r, 800));
        const success = true; // In production, check device client response

        if (success) {
            await persistIp(ip);
            setConnectedDeviceIp(ip);
            setConnectionStatus('idle');
            if (Platform.OS === 'ios') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            return;
        }

        setConnectionStatus('error');
        setErrorMessage('Not reachable.');
        if (Platform.OS === 'ios') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    const handleAutoDiscover = async () => {
        if (connectionStatus === 'connecting') return;
        setConnectionStatus('connecting');
        setErrorMessage(null);
        if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        const candidates = [...ipHistory];
        if (candidates.length === 0) {
            candidates.push('192.168.1.100', '192.168.4.1');
        }

        // Simulate discovery (replace with actual device client call)
        await new Promise(r => setTimeout(r, 1200));
        const foundIp = candidates[0]; // In production, actually scan and find device

        if (foundIp) {
            setIpInput(foundIp);
            await persistIp(foundIp);
            setConnectedDeviceIp(foundIp);
            setConnectionStatus('idle');
            if (Platform.OS === 'ios') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            return;
        }

        setConnectionStatus('error');
        setErrorMessage('No devices found.');
        if (Platform.OS === 'ios') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    const handleDisconnect = async () => {
        if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        Alert.alert(
            'Disconnect Device',
            'Are you sure you want to disconnect?',
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
                    text: 'Disconnect',
                    style: 'destructive',
                    onPress: async () => {
                        await AsyncStorage.removeItem(STORAGE_LAST_IP);
                        setConnectedDeviceIp(null);
                        setConnectionStatus('idle');
                        setErrorMessage(null);
                        if (Platform.OS === 'ios') {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        }
                    }
                }
            ]
        );
    };

    const [showConnectionModal, setShowConnectionModal] = useState(false);

    const handleConnectPress = () => {
        if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        setShowConnectionModal(true);
    };

    const handleConnectSubmit = async () => {
        await handleConnect();
        if (connectionStatus !== 'error') {
            setShowConnectionModal(false);
        }
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
                        <View>
                            <Text style={styles.stickyHeaderTitle}>Monitor</Text>
                            <Text style={styles.stickyHeaderSubtitle}>
                                {connectedDeviceIp ? connectedDeviceIp : 'No device connected'}
                            </Text>
                        </View>
                    </View>
                    <View
                        style={[
                            styles.statusDot,
                            { backgroundColor: connectedDeviceIp ? '#10b981' : 'rgba(148, 163, 184, 0.7)' }
                        ]}
                    />
                </View>
            </Animated.View>

            {/* Scrollable Content */}
            <View style={styles.contentContainer}>
                <Animated.ScrollView
                    showsVerticalScrollIndicator={true}
                    onScroll={scrollHandler}
                    scrollEventThrottle={16}
                    contentContainerStyle={{
                        paddingBottom: 120,
                        paddingHorizontal: theme.layout.padding.screen,
                        paddingTop: insets.top + 16,
                    }}
                >
                    {/* Hero Header */}
                    <View style={styles.heroHeader}>
                        <BlurView
                            intensity={80}
                            tint={theme.blur.ultraThin}
                            style={StyleSheet.absoluteFill}
                        />
                        <View style={styles.heroContent}>
                            <View style={styles.heroLeft}>
                                <LayoutDashboard size={16} color="#ffffff" opacity={0.6} />
                                <View>
                                    <Text style={styles.heroSubtitle}>Monitor</Text>
                                    <Text style={styles.heroTitle}>ESP32 Controller</Text>
                                </View>
                            </View>
                            <View style={styles.heroStatus}>
                                <View
                                    style={[
                                        styles.statusDot,
                                        { backgroundColor: connectedDeviceIp ? '#10b981' : 'rgba(148, 163, 184, 0.7)' },
                                    ]}
                                />
                                <Text style={styles.heroStatusText}>
                                    {connectedDeviceIp ? 'Connected' : 'Offline'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Connect/Disconnect Button */}
                    <Pressable
                        onPress={connectedDeviceIp ? handleDisconnect : handleConnectPress}
                        style={({ pressed }) => [
                            styles.horizontalButton,
                            connectedDeviceIp && styles.horizontalButtonDisconnect,
                            pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
                        ]}
                    >
                        <BlurView
                            intensity={70}
                            tint={theme.blur.thin}
                            style={StyleSheet.absoluteFill}
                        />
                        <View style={styles.horizontalButtonContent}>
                            {connectedDeviceIp ? (
                                <>
                                    <Unplug size={20} color="#ef4444" strokeWidth={2} />
                                    <Text style={styles.horizontalButtonTextDisconnect}>Disconnect Device</Text>
                                </>
                            ) : (
                                <>
                                    <Wifi size={20} color={theme.colors.primaryLight} strokeWidth={2} />
                                    <Text style={styles.horizontalButtonText}>Connect Device</Text>
                                </>
                            )}
                        </View>
                    </Pressable>

                    {/* Grid Layout - Only show when connected */}
                    {connectedDeviceIp && (
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
                        </View>
                    )}

                    {/* Empty State - Show when not connected */}
                    {!connectedDeviceIp && (
                        <View style={styles.emptyStateInline}>
                            <Unplug size={48} color={theme.text.tertiary} strokeWidth={1.5} opacity={0.5} />
                            <Text style={styles.emptyStateInlineTitle}>No Device Connected</Text>
                            <Text style={styles.emptyStateInlineBody}>
                                Connect to a device to view and control{'\n'}its sensors and actuators
                            </Text>
                        </View>
                    )}
                </Animated.ScrollView>
            </View>

            {/* Connection Modal */}
            {showConnectionModal && (
                <View style={styles.modalOverlay}>
                    <Pressable
                        style={StyleSheet.absoluteFill}
                        onPress={() => setShowConnectionModal(false)}
                    />
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalContent}
                    >
                        <View style={styles.modalCard}>
                            <BlurView intensity={80} tint={theme.blur.thin} style={StyleSheet.absoluteFill} />

                            <Text style={styles.modalTitle}>Connect to Device</Text>

                            <View style={styles.inputSection}>
                                <Text style={styles.inputLabel}>DEVICE IP ADDRESS</Text>
                                <TextInput
                                    value={ipInput}
                                    onChangeText={setIpInput}
                                    placeholder="192.168.1.100"
                                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                                    keyboardType="numbers-and-punctuation"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    editable={connectionStatus !== 'connecting'}
                                    returnKeyType="go"
                                    onSubmitEditing={handleConnectSubmit}
                                    style={styles.input}
                                    autoFocus
                                />
                            </View>

                            <Pressable
                                onPress={handleConnectSubmit}
                                disabled={connectionStatus === 'connecting'}
                                style={({ pressed }) => [
                                    styles.connectButton,
                                    pressed && connectionStatus !== 'connecting' ? { opacity: 0.85 } : null,
                                ]}
                            >
                                <BlurView intensity={90} tint={theme.blur.material} style={StyleSheet.absoluteFill} />
                                <View style={styles.buttonContent}>
                                    {connectionStatus === 'connecting' ? (
                                        <ActivityIndicator color="#ffffff" />
                                    ) : (
                                        <Text style={styles.buttonText}>Connect</Text>
                                    )}
                                </View>
                            </Pressable>

                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>OR</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            <Pressable
                                onPress={handleAutoDiscover}
                                disabled={connectionStatus === 'connecting'}
                                style={({ pressed }) => [
                                    styles.discoverButton,
                                    pressed && connectionStatus !== 'connecting' ? { opacity: 0.7 } : null,
                                ]}
                            >
                                <Text style={styles.discoverText}>
                                    {connectionStatus === 'connecting' ? 'Searching...' : 'Auto-Discover'}
                                </Text>
                            </Pressable>

                            {connectionStatus === 'error' && (
                                <View style={styles.errorBox}>
                                    <Text style={styles.errorTitle}>⚠️ {errorMessage}</Text>
                                    <Text style={styles.errorHint}>• Check WiFi network</Text>
                                    <Text style={styles.errorHint}>• Verify IP address</Text>
                                </View>
                            )}

                            <Pressable onPress={() => setShowConnectionModal(false)} style={styles.modalClose}>
                                <Text style={styles.modalCloseText}>Cancel</Text>
                            </Pressable>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            )}
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
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    stickyHeaderTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#ffffff',
        letterSpacing: -0.3,
    },
    stickyHeaderSubtitle: {
        fontSize: 11,
        color: theme.text.tertiary,
        fontFamily: 'monospace',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginTop: 2,
    },
    heroHeader: {
        marginBottom: 16,
        borderRadius: theme.layout.borderRadius.lg,
        borderWidth: hairlineWidth,
        borderColor: theme.border.default,
        overflow: 'hidden',
    },
    heroContent: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    heroLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    heroSubtitle: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.6)',
        fontFamily: 'monospace',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    heroTitle: {
        fontSize: 20,
        color: '#ffffff',
        fontWeight: '600',
        letterSpacing: -0.5,
    },
    heroStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    heroStatusText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
        fontFamily: 'monospace',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
    contentContainer: {
        flex: 1,
    },
    horizontalButton: {
        borderRadius: theme.layout.borderRadius.lg,
        borderWidth: hairlineWidth,
        borderColor: theme.border.default,
        overflow: 'hidden',
        marginBottom: 20,
    },
    horizontalButtonDisconnect: {
        borderColor: 'rgba(239, 68, 68, 0.4)',
    },
    horizontalButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 10,
    },
    horizontalButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.primaryLight,
        letterSpacing: 0.3,
    },
    horizontalButtonTextDisconnect: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ef4444',
        letterSpacing: 0.3,
    },
    emptyStateInline: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        gap: 16,
    },
    emptyStateInlineTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: theme.text.secondary,
        letterSpacing: -0.3,
    },
    emptyStateInlineBody: {
        fontSize: 14,
        lineHeight: 20,
        color: theme.text.tertiary,
        textAlign: 'center',
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContent: {
        width: '100%',
        paddingHorizontal: theme.layout.padding.screen,
    },
    modalCard: {
        width: '100%',
        maxWidth: 400,
        borderRadius: theme.layout.borderRadius.xl,
        borderWidth: hairlineWidth,
        borderColor: theme.border.default,
        padding: 24,
        overflow: 'hidden',
        gap: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.text.primary,
        letterSpacing: -0.5,
        textAlign: 'center',
        marginBottom: 8,
    },
    modalClose: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    modalCloseText: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.text.secondary,
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
    inputSection: {
        width: '100%',
        gap: 8,
    },
    inputLabel: {
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        color: theme.text.tertiary,
        fontFamily: 'monospace',
        fontWeight: '600',
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: hairlineWidth,
        borderColor: 'rgba(255, 255, 255, 0.25)',
        borderRadius: theme.layout.borderRadius.md,
        paddingHorizontal: 16,
        paddingVertical: 14,
        color: '#ffffff',
        fontFamily: 'monospace',
        fontSize: 16,
        textAlign: 'center',
    },
    connectButton: {
        width: '100%',
        borderRadius: theme.layout.borderRadius.lg,
        borderWidth: hairlineWidth,
        borderColor: 'rgba(99, 102, 241, 0.5)',
        overflow: 'hidden',
        minHeight: 54,
        justifyContent: 'center',
    },
    buttonContent: {
        alignItems: 'center',
        paddingVertical: 14,
    },
    buttonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#ffffff',
        letterSpacing: 0.5,
    },
    divider: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginVertical: 4,
    },
    dividerLine: {
        flex: 1,
        height: hairlineWidth,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    dividerText: {
        fontSize: 11,
        color: theme.text.tertiary,
        fontWeight: '600',
        letterSpacing: 1.2,
    },
    discoverButton: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: theme.layout.borderRadius.md,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
    },
    discoverText: {
        color: theme.text.secondary,
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    errorBox: {
        width: '100%',
        marginTop: 8,
        padding: 16,
        borderRadius: theme.layout.borderRadius.md,
        borderWidth: hairlineWidth,
        borderColor: 'rgba(239, 68, 68, 0.6)',
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
        gap: 4,
    },
    errorTitle: {
        color: '#fca5a5',
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 6,
        letterSpacing: 0.2,
    },
    errorHint: {
        color: theme.text.secondary,
        fontSize: 12,
        lineHeight: 18,
    },
});
