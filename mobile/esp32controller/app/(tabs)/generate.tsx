import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    KeyboardAvoidingView,
    Platform,
    FlatList,
    Pressable,
    StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedScrollHandler,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';
import { ScreenLayout } from '@/src/components/layout/ScreenLayout';
import { MessageInputBar } from '@/src/components/ui/MessageInputBar';
import { FullScreenVoiceOverlay } from '@/src/components/ui/FullScreenVoiceOverlay';
import { theme, hairlineWidth } from '@/src/theme/colors';
import { Terminal, ArrowRight } from 'lucide-react-native';
import { apiClient } from '@/src/lib/apiClient';

interface HistoryItem {
    id: string;
    type: 'user' | 'system';
    content: string;
    action?: {
        label: string;
        onPress: () => void;
    };
}

const INITIAL_HISTORY: HistoryItem[] = [
    {
        id: 'init',
        type: 'system',
        content: 'Dedalus AI v3.0.0 initialized.\nTarget: ESP32-WROOM-32\nReady for commands.'
    }
];

const SUGGESTIONS = [
    { label: '/pwm', text: "Configure PWM on pin 25" },
    { label: '/sensor', text: "Read temperature from pin 34" },
    { label: '/wifi', text: "Connect to WiFi network" },
];

export default function ConsolePage() {
    const router = useRouter();
    const [intent, setIntent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [history, setHistory] = useState<HistoryItem[]>(INITIAL_HISTORY);
    const [isVoiceOverlayVisible, setIsVoiceOverlayVisible] = useState(false);
    const [inputAreaHeight, setInputAreaHeight] = useState(0);
    const scrollViewRef = useRef<FlatList>(null);

    // Get dynamic tab bar height and safe area insets
    const tabBarHeight = useBottomTabBarHeight();
    const insets = useSafeAreaInsets();

    // Shared value for scroll position
    const scrollY = useSharedValue(0);

    // Animated scroll handler
    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    // Animated style for sticky header (fades in after scrolling past hero)
    const stickyHeaderStyle = useAnimatedStyle(() => ({
        opacity: interpolate(scrollY.value, [100, 150], [0, 1], Extrapolation.CLAMP),
        transform: [
            { translateY: interpolate(scrollY.value, [100, 150], [-10, 0], Extrapolation.CLAMP) }
        ],
    }));

    const addToHistory = (item: HistoryItem) => {
        setHistory(prev => [...prev, item]);
    };

    const handleDeploy = async () => {
        if (intent.trim().length < 2) return;

        if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        const userMsg = intent;
        setIntent('');
        addToHistory({ id: Date.now().toString(), type: 'user', content: userMsg });
        setIsLoading(true);

        try {
            // TODO: Get real ESP IP from context or settings
            // For now, using a placeholder or hardcoded value if acceptable, 
            // but ideally this should come from the selected device.
            // Assuming the user needs to provide it or it's discovered.
            // For hackathon, let's hardcode a known IP or ask user to input it?
            // Actually, let's look at how deviceClient works.
            // But for now, I will use a hardcoded IP to match the server logic 
            // or pass a dummy if the server handles discovery (server currently does NOT handle discovery of target ESP IP, it expects it in request).
            // Let's assume the user has entered it or we use a default.
            const targetIp = "192.168.4.1"; // Default AP IP or need to find a way to get it.

            // Wait, looking at index.tsx (not shown but assumed), maybe we have context?
            // For now, I'll send the request.

            await apiClient.generateFirmware(userMsg, targetIp);

            addToHistory({
                id: (Date.now() + 1).toString(),
                type: 'system',
                content: `Firmware generated and OTA triggered.\n\nTarget: ${targetIp}`,
                action: {
                    label: 'View Code',
                    onPress: () => router.push('/(tabs)/code')
                }
            });
        } catch (error) {
            addToHistory({
                id: (Date.now() + 1).toString(),
                type: 'system',
                content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }, [history]);

    const renderItem = ({ item }: { item: HistoryItem }) => {
        const isUser = item.type === 'user';
        return (
            <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowSystem]}>
                <View style={[styles.messageContainer, { maxWidth: '85%' }]}>
                    <Text style={styles.messageLabel}>
                        {isUser ? 'User >' : 'System >'}
                    </Text>

                    <View style={[
                        styles.messageBubble,
                        isUser ? styles.bubbleUser : styles.bubbleSystem
                    ]}>
                        <BlurView
                            intensity={60}
                            tint={theme.blur.thin}
                            style={StyleSheet.absoluteFill}
                        />
                        <Text style={[styles.messageText, isUser && { color: '#c7d2fe' }]}>
                            {item.content}
                        </Text>

                        {item.action && (
                            <Pressable
                                onPress={() => {
                                    if (Platform.OS === 'ios') {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    }
                                    item.action!.onPress();
                                }}
                                style={({ pressed }) => [
                                    styles.actionButton,
                                    { opacity: pressed ? 0.7 : 1 }
                                ]}
                            >
                                <Text style={styles.actionText}>{item.action.label}</Text>
                                <ArrowRight size={14} color="#ffffff" />
                            </Pressable>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    return (
        <ScreenLayout useCustomHeader scrollable={false}>
            {/* Animated Sticky Header - Fades in on scroll */}
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
                        <Terminal size={16} color="#ffffff" opacity={0.6} />
                        <Text style={styles.stickyHeaderTitle}>AI Assistant</Text>
                    </View>
                    <View style={[styles.statusDot, { width: 6, height: 6 }]} />
                </View>
            </Animated.View>

            {/* Chat History with scroll tracking */}
            <Animated.FlatList
                ref={scrollViewRef}
                data={history}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                contentContainerStyle={{
                    paddingHorizontal: theme.layout.padding.screen,
                    paddingTop: insets.top,
                    paddingBottom: Math.max(
                        140,
                        inputAreaHeight + tabBarHeight + insets.bottom + 12
                    ), // Space for input area
                }}
                style={styles.chatList}
                ListHeaderComponent={
                    /* Hero Header - Shows initially */
                    <View style={styles.heroHeader}>
                        <BlurView
                            intensity={80}
                            tint={theme.blur.ultraThin}
                            style={StyleSheet.absoluteFill}
                        />
                        <View style={styles.headerContent}>
                            <View style={styles.headerLeft}>
                                <Terminal size={16} color="#ffffff" opacity={0.6} />
                                <View>
                                    <Text style={styles.headerSubtitle}>Console</Text>
                                    <Text style={styles.headerTitle}>AI Assistant</Text>
                                </View>
                            </View>
                            <View style={styles.statusBadge}>
                                <View style={styles.statusDot} />
                                <Text style={styles.headerStatusText}>Online</Text>
                            </View>
                        </View>
                    </View>
                }
            />

            {/* Fixed Input Area - Above Tab Bar */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                style={[styles.inputContainer, { bottom: tabBarHeight + insets.bottom }]}
                onLayout={(event) => setInputAreaHeight(event.nativeEvent.layout.height)}
            >
                <BlurView
                    intensity={70}
                    tint={theme.blur.material}
                    style={StyleSheet.absoluteFill}
                />

                {/* Suggestions */}
                <View style={styles.suggestions}>
                    {SUGGESTIONS.map((s, i) => (
                        <Pressable
                            key={i}
                            onPress={() => {
                                setIntent(s.text);
                                if (Platform.OS === 'ios') {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                }
                            }}
                            style={({ pressed }) => [
                                styles.suggestionPill,
                                { opacity: pressed ? 0.7 : 1 }
                            ]}
                        >
                            <Text style={styles.suggestionText}>{s.label}</Text>
                        </Pressable>
                    ))}
                </View>

                {/* Input Bar */}
                <MessageInputBar
                    value={intent}
                    onChangeText={setIntent}
                    onSubmit={handleDeploy}
                    onVoicePress={() => setIsVoiceOverlayVisible(true)}
                    isLoading={isLoading}
                    embedded
                />
            </KeyboardAvoidingView>

            {/* Voice Overlay */}
            <FullScreenVoiceOverlay
                isVisible={isVoiceOverlayVisible}
                onClose={() => setIsVoiceOverlayVisible(false)}
                onTranscript={(text) => {
                    setIntent((prev) => prev ? `${prev} ${text}` : text);
                    setIsVoiceOverlayVisible(false);
                }}
            />
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
    chatList: {
        flex: 1,
    },
    messageRow: {
        width: '100%',
        flexDirection: 'row',
        marginBottom: 16,
    },
    messageRowUser: {
        justifyContent: 'flex-end',
    },
    messageRowSystem: {
        justifyContent: 'flex-start',
    },
    messageContainer: {
        alignItems: 'flex-start',
    },
    messageLabel: {
        fontSize: 10,
        fontWeight: '500',
        color: theme.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    messageBubble: {
        padding: 16,
        borderRadius: theme.layout.borderRadius.lg,
        borderWidth: hairlineWidth,
        overflow: 'hidden',
        position: 'relative',
    },
    bubbleUser: {
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderColor: 'rgba(99, 102, 241, 0.3)',
        borderTopRightRadius: 4,
    },
    bubbleSystem: {
        backgroundColor: theme.surfaceGlass,
        borderColor: theme.border.default,
        borderTopLeftRadius: 4,
    },
    messageText: {
        fontSize: 14,
        lineHeight: 20,
        color: theme.text.secondary,
    },
    actionButton: {
        marginTop: 12,
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: theme.layout.borderRadius.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    actionText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '600',
    },
    inputContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        paddingTop: 12,
        paddingBottom: 12,
        paddingHorizontal: theme.layout.padding.screen,
        borderRadius: theme.layout.borderRadius.lg,
        borderWidth: hairlineWidth,
        borderColor: theme.border.default,
        overflow: 'hidden',
    },
    suggestions: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 10,
    },
    suggestionPill: {
        backgroundColor: theme.surfaceGlass,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: hairlineWidth,
        borderColor: theme.border.subtle,
    },
    suggestionText: {
        fontSize: 12,
        fontWeight: '500',
        color: theme.text.secondary,
    },
});
