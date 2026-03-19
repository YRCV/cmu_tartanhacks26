import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { theme, hairlineWidth } from '@/src/theme/colors';

interface StickyHeaderProps {
    title: string;
    subtitle?: string;
    statusBadge?: {
        label: string;
        color: 'success' | 'warning' | 'error' | 'info';
    };
    rightElement?: React.ReactNode;
}

/**
 * Unified Sticky Glass Header
 *
 * Native iOS style with optional live status badge
 * Replaces floating dev mode pill
 */
export function StickyHeader({ title, subtitle, statusBadge, rightElement }: StickyHeaderProps) {
    const getBadgeColors = () => {
        switch (statusBadge?.color) {
            case 'success':
                return {
                    bg: 'rgba(16, 185, 129, 0.2)',
                    border: 'rgba(16, 185, 129, 0.5)',
                    text: '#34d399',
                };
            case 'warning':
                return {
                    bg: 'rgba(245, 158, 11, 0.2)',
                    border: 'rgba(245, 158, 11, 0.5)',
                    text: '#fbbf24',
                };
            case 'error':
                return {
                    bg: 'rgba(239, 68, 68, 0.2)',
                    border: 'rgba(239, 68, 68, 0.5)',
                    text: '#f87171',
                };
            default:
                return {
                    bg: 'rgba(99, 102, 241, 0.2)',
                    border: 'rgba(99, 102, 241, 0.5)',
                    text: '#818cf8',
                };
        }
    };

    const badgeColors = statusBadge ? getBadgeColors() : null;

    return (
        <View style={styles.container}>
            <BlurView
                intensity={80}
                tint={theme.blur.ultraThin}
                style={StyleSheet.absoluteFill}
            />
            <View style={styles.borderBottom} />

            <View style={styles.content}>
                <View style={styles.leftSection}>
                    {subtitle && (
                        <Text style={styles.subtitle}>{subtitle}</Text>
                    )}
                    <View style={styles.titleRow}>
                        <Text style={styles.title}>{title}</Text>
                        {statusBadge && badgeColors && (
                            <View
                                style={[
                                    styles.badge,
                                    {
                                        backgroundColor: badgeColors.bg,
                                        borderColor: badgeColors.border,
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.badgeText,
                                        { color: badgeColors.text },
                                    ]}
                                >
                                    {statusBadge.label}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
                {rightElement && <View style={styles.rightSection}>{rightElement}</View>}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
    },
    borderBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: hairlineWidth,
        backgroundColor: theme.border.default,
    },
    content: {
        paddingHorizontal: theme.layout.padding.screen,
        paddingTop: 12,
        paddingBottom: 12,
        height: theme.layout.headerHeight,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    leftSection: {
        flex: 1,
    },
    subtitle: {
        fontSize: 11,
        fontWeight: '500',
        color: theme.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 22,
        fontWeight: '600',
        color: theme.text.primary,
        letterSpacing: -0.5,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: hairlineWidth,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    rightSection: {
        marginLeft: 12,
    },
});
