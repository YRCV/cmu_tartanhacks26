import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedScrollHandler,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';
import { StickyHeader } from '@/src/components/ui/StickyHeader';
import { TechGrid } from '@/src/components/ui/TechGrid';
import { theme } from '@/src/theme/colors';

interface ScreenLayoutProps {
    title?: string;
    subtitle?: string;
    children: React.ReactNode;
    scrollable?: boolean;
    statusBadge?: {
        label: string;
        color: 'success' | 'warning' | 'error' | 'info';
    };
    rightElement?: React.ReactNode;
    contentContainerStyle?: ViewStyle;
    useCustomHeader?: boolean; // Set to true to skip the sticky header
}

/**
 * ScreenLayout - Standardized Layout Wrapper
 *
 * Ensures consistent header spacing and tab bar clearance across all screens
 * Automatically handles scrollable vs. fixed layouts
 */
export const ScreenLayout = ({
    title,
    subtitle,
    children,
    scrollable = true,
    statusBadge,
    rightElement,
    contentContainerStyle,
    useCustomHeader = false,
}: ScreenLayoutProps) => {
    const insets = useSafeAreaInsets();

    // Layout constants
    const HEADER_HEIGHT = useCustomHeader ? 0 : theme.layout.headerHeight;
    const TAB_BAR_HEIGHT = theme.layout.tabBarHeight;
    const CONTENT_TOP_PADDING = useCustomHeader ? 16 : HEADER_HEIGHT + 16;
    const CONTENT_BOTTOM_PADDING = TAB_BAR_HEIGHT + 20;

    // Scroll animation
    const scrollY = useSharedValue(0);
    const scrollHandler = useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
    });

    // Animated header style - fades in after scrolling
    const animatedHeaderStyle = useAnimatedStyle(() => ({
        opacity: interpolate(scrollY.value, [50, 100], [0, 1], Extrapolation.CLAMP),
        transform: [
            { translateY: interpolate(scrollY.value, [50, 100], [-10, 0], Extrapolation.CLAMP) }
        ],
    }));

    const Container = scrollable ? Animated.ScrollView : View;

    return (
        <View style={styles.container}>
            <TechGrid />

            {/* Animated Sticky Glass Header - Only if not using custom header */}
            {!useCustomHeader && title && (
                <Animated.View style={[
                    {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 100,
                        paddingTop: insets.top + theme.layout.headerSafeTopOffset,
                    },
                    animatedHeaderStyle
                ]}>
                    <StickyHeader
                        title={title}
                        subtitle={subtitle}
                        statusBadge={statusBadge}
                        rightElement={rightElement}
                    />
                </Animated.View>
            )}

            {/* Content Area */}
            <Container
                style={styles.content}
                showsVerticalScrollIndicator={scrollable}
                onScroll={scrollable ? scrollHandler : undefined}
                scrollEventThrottle={scrollable ? 16 : undefined}
                contentContainerStyle={
                    scrollable
                        ? [
                            {
                                paddingTop: CONTENT_TOP_PADDING,
                                paddingBottom: CONTENT_BOTTOM_PADDING,
                                paddingHorizontal: theme.layout.padding.screen,
                            },
                            contentContainerStyle,
                        ]
                        : undefined
                }
            >
                {!scrollable && <View style={{ marginTop: CONTENT_TOP_PADDING }} />}
                {children}
            </Container>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    content: {
        flex: 1,
    },
});
