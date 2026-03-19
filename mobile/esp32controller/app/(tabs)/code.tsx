import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Platform, StyleSheet, RefreshControl } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedScrollHandler,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';
import { theme, hairlineWidth } from '@/src/theme/colors';
import { ScreenLayout } from '@/src/components/layout/ScreenLayout';
import { CodeBlock } from '@/src/components/ui/CodeBlock';
import { Copy, FileCode, FileJson, Check, RefreshCw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { apiClient } from '@/src/lib/apiClient';
import { useFocusEffect } from 'expo-router';

const FILES = [
    {
        name: 'ai.cpp',
        language: 'cpp' as const,
        icon: <FileCode size={14} color="#8b9dc3" />,
    }
];

export default function CodeScreen() {
    const [codeContent, setCodeContent] = useState('// Loading...');
    const [copied, setCopied] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const insets = useSafeAreaInsets();

    const fetchCode = async () => {
        try {
            const code = await apiClient.getCode();
            setCodeContent(code);
        } catch (error) {
            setCodeContent('// Error loading code.');
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        await fetchCode();
        setRefreshing(false);
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchCode();
        }, [])
    );

    // Shared value for scroll position
    const scrollY = useSharedValue(0);

    // Scroll handler
    const scrollHandler = useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
    });

    // Animated style for sticky header
    const stickyHeaderStyle = useAnimatedStyle(() => ({
        opacity: interpolate(scrollY.value, [100, 150], [0, 1], Extrapolation.CLAMP),
        transform: [
            { translateY: interpolate(scrollY.value, [100, 150], [-10, 0], Extrapolation.CLAMP) }
        ],
    }));

    const handleCopy = () => {
        if (Platform.OS === 'ios') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
                        <FileCode size={16} color="#ffffff" opacity={0.6} />
                        <Text style={styles.stickyHeaderTitle}>Generated Files</Text>
                    </View>
                    <View style={[styles.statusDot, { width: 6, height: 6, backgroundColor: '#6366f1' }]} />
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
                    paddingHorizontal: theme.layout.padding.screen,
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
                            <FileCode size={16} color="#ffffff" opacity={0.6} />
                            <View>
                                <Text style={styles.headerSubtitle}>Code</Text>
                                <Text style={styles.headerTitle}>Generated Files</Text>
                            </View>
                        </View>
                        <View style={styles.statusBadge}>
                            <View style={styles.statusDot} />
                            <Text style={styles.headerStatusText}>Ready</Text>
                        </View>
                    </View>
                </View>

                {/* File Tabs */}
                <View style={styles.fileTabs}>
                    <BlurView
                        intensity={60}
                        tint={theme.blur.thin}
                        style={StyleSheet.absoluteFill}
                    />
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.tabsRow}>
                            <Pressable
                                style={[styles.tab, styles.tabActive]}
                            >
                                <FileCode size={14} color="#ffffff" />
                                <Text style={[styles.tabText, styles.tabTextActive]}>
                                    ai.cpp
                                </Text>
                            </Pressable>
                        </View>
                    </ScrollView>
                </View>

                {/* Editor Area */}
                <View style={styles.editorContainer}>
                    <BlurView
                        intensity={40}
                        tint={theme.blur.ultraThin}
                        style={StyleSheet.absoluteFill}
                    />
                    <ScrollView
                        style={styles.editorScroll}
                        contentContainerStyle={styles.editorContent}
                        showsVerticalScrollIndicator={true}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ffffff" />
                        }
                    >
                        <CodeBlock code={codeContent} language="cpp" />
                    </ScrollView>

                    {/* Floating Copy Button */}
                    <View style={styles.copyButton}>
                        <Pressable
                            onPress={handleCopy}
                            style={styles.copyButtonInner}
                        >
                            <BlurView
                                intensity={80}
                                tint={theme.blur.material}
                                style={StyleSheet.absoluteFill}
                            />
                            {copied ? (
                                <Check size={22} color="#10b981" strokeWidth={2.5} />
                            ) : (
                                <Copy size={22} color="#ffffff" strokeWidth={2} />
                            )}
                        </Pressable>
                    </View>
                </View>

                {/* Status Bar */}
                <View style={styles.statusBar}>
                    <BlurView
                        intensity={60}
                        tint={theme.blur.thin}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.statusContent}>
                        <View style={styles.statusLeft}>
                            <Text style={styles.statusText}>Generated Code</Text>
                            <Text style={styles.statusText}>UTF-8</Text>
                        </View>
                        <Text style={[styles.statusText, { color: theme.text.secondary }]}>
                            CPP
                        </Text>
                    </View>
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
        backgroundColor: '#6366f1',
        shadowColor: '#6366f1',
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
    fileTabs: {
        marginBottom: 16,
        borderRadius: theme.layout.borderRadius.lg,
        borderWidth: hairlineWidth,
        borderColor: theme.border.default,
        overflow: 'hidden',
    },
    tabsRow: {
        flexDirection: 'row',
        paddingHorizontal: 8,
        paddingVertical: 8,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        borderRadius: theme.layout.borderRadius.md,
    },
    tabActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    tabText: {
        fontFamily: 'monospace',
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.5)',
    },
    tabTextActive: {
        color: '#ffffff',
        fontWeight: '600',
    },
    editorContainer: {
        flex: 1,
        borderRadius: theme.layout.borderRadius.lg,
        borderWidth: hairlineWidth,
        borderColor: theme.border.default,
        overflow: 'hidden',
        marginBottom: 16,
    },
    editorScroll: {
        flex: 1,
    },
    editorContent: {
        padding: 16,
    },
    copyButton: {
        position: 'absolute',
        bottom: 24,
        right: 24,
    },
    copyButtonInner: {
        borderRadius: 999,
        borderWidth: hairlineWidth,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        overflow: 'hidden',
        padding: 16,
    },
    statusBar: {
        borderRadius: theme.layout.borderRadius.lg,
        borderWidth: hairlineWidth,
        borderColor: theme.border.default,
        overflow: 'hidden',
    },
    statusContent: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusLeft: {
        flexDirection: 'row',
        gap: 16,
    },
    statusText: {
        fontSize: 10,
        fontFamily: 'monospace',
        color: 'rgba(255, 255, 255, 0.5)',
    },
});
