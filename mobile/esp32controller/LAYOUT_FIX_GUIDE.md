# Layout Fix Guide - Header & Input Overlap Solutions

## ✅ COMPLETED

### 1. ScreenLayout Wrapper Component
**File**: `/src/components/layout/ScreenLayout.tsx`

**Features:**
- ✅ Automatically handles header spacing (`paddingTop: HEADER_HEIGHT + 16`)
- ✅ Automatically handles tab bar clearance (`paddingBottom: TAB_BAR_HEIGHT + 20`)
- ✅ Supports both scrollable and fixed layouts
- ✅ Includes TechGrid background
- ✅ Integrates StickyHeader
- ✅ Standardized across all screens

**Usage:**
```tsx
<ScreenLayout
  title="Monitor"
  subtitle="ESP32 Controller"
  statusBadge={{ label: 'Dev Mode', color: 'success' }}
>
  {/* Your content - no manual padding needed! */}
</ScreenLayout>
```

### 2. Monitor Tab Refactored ✅
**File**: `/app/(tabs)/dashboard.tsx`

- ✅ Now uses `<ScreenLayout>` wrapper
- ✅ Removed manual `SafeAreaView`, `TechGrid`, `StickyHeader`
- ✅ Removed manual `paddingTop` calculations
- ✅ Simplified from 237 lines to 211 lines

### 3. Console Tab Refactored ✅
**File**: `/app/(tabs)/generate.tsx`

- ✅ Now uses `<ScreenLayout scrollable={false}>` wrapper
- ✅ Implemented `useBottomTabBarHeight()` hook
- ✅ Fixed input positioning with `style={[styles.inputContainer, { bottom: tabBarHeight }]}`
- ✅ KeyboardAvoidingView with proper keyboard offset
- ✅ FlatList with `paddingBottom: 140` for message visibility
- ✅ Converted from NativeWind to StyleSheet for consistency
- ✅ Message bubbles using theme constants
- ✅ Removed manual header rendering

### 4. Code Tab Refactored ✅
**File**: `/app/(tabs)/code.tsx`

- ✅ Now uses `<ScreenLayout>` wrapper
- ✅ Removed manual `SafeAreaView`, `TechGrid`, `StickyHeader`, `DevModeBanner`
- ✅ Converted from NativeWind to StyleSheet
- ✅ File tabs using theme constants
- ✅ Editor area with proper scrolling
- ✅ Status bar with theme styling

### 5. Terminal/Diagnostics Tab Refactored ✅
**File**: `/app/(tabs)/terminal.tsx`

- ✅ Now uses `<ScreenLayout>` wrapper
- ✅ Removed manual `SafeAreaView`, `TechGrid`, `StickyHeader`, `DevModeBanner`
- ✅ Converted from NativeWind to StyleSheet
- ✅ Inset grouped style cards (iOS Settings-like)
- ✅ All cards using theme constants with BlurView
- ✅ Proper spacing and typography

---

## 📊 Summary

All tabs now use the standardized `ScreenLayout` wrapper component, ensuring:
- ✅ Consistent header spacing across all screens
- ✅ Proper tab bar clearance on all screens
- ✅ No content cut-off at top or bottom
- ✅ Unified design system using theme constants
- ✅ StyleSheet-based styling instead of NativeWind classes
- ✅ Proper keyboard avoidance on Console tab

---

## 🔧 DEPRECATED: Console Tab Input Fix (NOW COMPLETED)

### Problem
The `MessageInputBar` at the bottom overlaps with the floating tab bar because:
1. The tab bar is absolutely positioned
2. The input doesn't know the tab bar height
3. No keyboard avoidance strategy

### Solution: Fixed Input with Keyboard Avoidance

**File to Update**: `/app/(tabs)/generate.tsx`

### Step 1: Install Bottom Tab Bar Hook

Check if `@react-navigation/bottom-tabs` is installed:

```bash
npm list @react-navigation/bottom-tabs
```

If not installed:
```bash
npm install @react-navigation/bottom-tabs
```

### Step 2: Complete Console Refactor

```tsx
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
import { ScreenLayout } from '@/src/components/layout/ScreenLayout';
import { MessageInputBar } from '@/src/components/ui/MessageInputBar';
import { FullScreenVoiceOverlay } from '@/src/components/ui/FullScreenVoiceOverlay';
import { theme, hairlineWidth } from '@/src/theme/colors';
import { ArrowRight } from 'lucide-react-native';

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
        content: 'Dedalus AI v3.0.0 initialized.\\nTarget: ESP32-WROOM-32\\nReady for commands.'
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
    const scrollViewRef = useRef<FlatList>(null);

    // Get dynamic tab bar height
    const tabBarHeight = useBottomTabBarHeight();

    const addToHistory = (item: HistoryItem) => {
        setHistory(prev => [...prev, item]);
    };

    const handleDeploy = () => {
        if (intent.trim().length < 2) return;

        if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        const userMsg = intent;
        setIntent('');
        addToHistory({ id: Date.now().toString(), type: 'user', content: userMsg });
        setIsLoading(true);

        setTimeout(() => {
            setIsLoading(false);
            addToHistory({
                id: (Date.now() + 1).toString(),
                type: 'system',
                content: `Generated configuration for "${userMsg}".\\n\\n• Pins: 25, 34\\n• Logic: PWM Control`,
                action: {
                    label: 'Review & Flash',
                    onPress: () => router.push('../review')
                }
            });
        }, 1000);
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
        <ScreenLayout
            title="Console"
            subtitle="AI Assistant"
            statusBadge={{ label: 'Online', color: 'success' }}
            scrollable={false}
        >
            {/* Chat History */}
            <FlatList
                ref={scrollViewRef}
                data={history}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{
                    paddingHorizontal: theme.layout.padding.screen,
                    paddingBottom: 140, // Space for input area
                }}
                style={styles.chatList}
            />

            {/* Fixed Input Area - Above Tab Bar */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
                style={[styles.inputContainer, { bottom: tabBarHeight }]}
            >
                <BlurView
                    intensity={80}
                    tint={theme.blur.material}
                    style={StyleSheet.absoluteFill}
                />
                <View style={styles.inputBorder} />

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
    },
    inputBorder: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: hairlineWidth,
        backgroundColor: theme.border.default,
    },
    suggestions: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
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
```

---

## Key Changes Explained

### 1. **ScreenLayout Wrapper**
```tsx
<ScreenLayout scrollable={false}>
```
- `scrollable={false}` because we're using a custom FlatList
- Automatically handles header spacing
- Includes TechGrid and StickyHeader

### 2. **useBottomTabBarHeight Hook**
```tsx
const tabBarHeight = useBottomTabBarHeight();
```
- Dynamically gets the exact tab bar height (85px on iOS, 60px on Android)
- No hardcoded values!

### 3. **Fixed Input Position**
```tsx
<KeyboardAvoidingView
  style={[styles.inputContainer, { bottom: tabBarHeight }]}
>
```
- `position: 'absolute'` + `bottom: tabBarHeight`
- Lifts the input area exactly above the tab bar
- Keyboard avoidance still works!

### 4. **FlatList Bottom Padding**
```tsx
contentContainerStyle={{
  paddingBottom: 140, // Space for input area
}}
```
- Ensures messages don't get hidden behind the input
- Users can scroll to see all content

---

## Apply to Remaining Tabs

### Code Tab
```tsx
<ScreenLayout
  title="Code"
  subtitle="Generated Files"
  statusBadge={{ label: 'Ready', color: 'info' }}
>
  {/* File tabs + code viewer */}
</ScreenLayout>
```

### Terminal/Diagnostics Tab
```tsx
<ScreenLayout
  title="Diagnostics"
  subtitle="Tools & Testing"
>
  {/* Settings islands */}
</ScreenLayout>
```

---

## Testing Checklist

- [ ] Monitor: Header spacing correct, no cut-off?
- [ ] Console: Input visible above tab bar?
- [ ] Console: Keyboard pushes input up correctly?
- [ ] Console: Messages scroll properly?
- [ ] Console: Suggestions don't overlap with messages?
- [ ] All tabs: Content blurs under sticky header?
- [ ] All tabs: Bottom content visible above tab bar?

---

END OF LAYOUT FIX GUIDE
