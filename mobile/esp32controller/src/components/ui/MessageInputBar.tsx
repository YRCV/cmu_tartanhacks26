import React, { useState } from 'react';
import { View, TextInput, Pressable, Platform, ViewStyle, StyleSheet } from 'react-native';
import { Mic, Send, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface MessageInputBarProps {
    value: string;
    onChangeText: (text: string) => void;
    onSubmit: () => void;
    onVoicePress: () => void;
    isLoading?: boolean;
    disabled?: boolean;
    embedded?: boolean;
    containerStyle?: ViewStyle;
}

import { BlurView } from 'expo-blur';

export function MessageInputBar({
    value,
    onChangeText,
    onSubmit,
    onVoicePress,
    isLoading = false,
    disabled = false,
    embedded = false,
    containerStyle,
}: MessageInputBarProps) {

    // Auto-growing height for input
    const [inputHeight, setInputHeight] = useState(40);

    const handleSend = () => {
        if (!value.trim() || disabled || isLoading) return;
        if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onSubmit();
    };

    const Container = embedded ? View : BlurView;
    const containerProps = embedded
        ? { className: "p-3", style: containerStyle }
        : {
            intensity: 80,
            tint: "systemMaterialDark" as const,
            className: "flex-row items-end space-x-3 p-4 border-t border-white/10 pb-8",
            style: containerStyle,
        };

    return (
        <Container {...containerProps}>
            {/* Voice Button */}
            {embedded ? (
                <View style={styles.embeddedRow}>
                    <Pressable
                        onPress={onVoicePress}
                        disabled={isLoading || disabled}
                        style={styles.leftIconButton}
                    >
                        <Mic size={22} color="#e5e5e5" />
                    </Pressable>

                    <TextInput
                        placeholder="Ask anything"
                        placeholderTextColor="#737373"
                        value={value}
                        onChangeText={onChangeText}
                        multiline
                        maxLength={500}
                        editable={!isLoading && !disabled}
                        textAlignVertical="center"
                        scrollEnabled={inputHeight > 80}
                        style={[
                            styles.inputInline,
                            { height: Math.max(44, Math.min(inputHeight, 80)) },
                        ]}
                        onContentSizeChange={(e) => setInputHeight(e.nativeEvent.contentSize.height)}
                    />

                    <Pressable
                        onPress={handleSend}
                        disabled={!value.trim() || isLoading || disabled}
                        style={[
                            styles.rightIconButton,
                            value.trim() ? styles.sendButtonActive : styles.sendButtonInactive,
                        ]}
                    >
                        {isLoading ? (
                            <Sparkles size={22} color="#e5e5e5" />
                        ) : (
                            <Send
                                size={22}
                                color={value.trim() ? "#ffffff" : "#525252"}
                            />
                        )}
                    </Pressable>
                </View>
            ) : (
                <>
                    <Pressable
                        onPress={onVoicePress}
                        disabled={isLoading || disabled}
                        className="mb-1 p-3 bg-white/10 rounded-full active:bg-white/20 border border-white/5"
                    >
                        <Mic size={24} color="#e5e5e5" />
                    </Pressable>

                    <View className="flex-1 bg-black/20 rounded-2xl border border-white/10 focus:border-indigo-500/50 transition-colors">
                        <TextInput
                            className="px-4 py-3 text-base text-white leading-5"
                            placeholder="Describe desired behavior..."
                            placeholderTextColor="#737373"
                            value={value}
                            onChangeText={onChangeText}
                            multiline
                            maxLength={500}
                            editable={!isLoading && !disabled}
                            style={{ height: Math.max(40, Math.min(inputHeight, 100)) }}
                            onContentSizeChange={(e) => setInputHeight(e.nativeEvent.contentSize.height)}
                        />
                    </View>

                    <Pressable
                        onPress={handleSend}
                        disabled={!value.trim() || isLoading || disabled}
                        className={`mb-1 p-3 rounded-full border border-white/5 ${value.trim()
                            ? 'bg-indigo-600 active:bg-indigo-700'
                            : 'bg-white/5'
                            }`}
                    >
                        {isLoading ? (
                            <Sparkles size={24} color="#e5e5e5" className="animate-spin" />
                        ) : (
                            <Send
                                size={24}
                                color={value.trim() ? "white" : "#525252"}
                            />
                        )}
                    </Pressable>
                </>
            )}
        </Container>
    );
}

const styles = StyleSheet.create({
    embeddedRow: {
        width: '100%',
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        overflow: 'hidden',
    },
    inputInline: {
        flex: 1,
        paddingHorizontal: 8,
        paddingVertical: 10,
        fontSize: 16,
        color: '#ffffff',
        lineHeight: 20,
    },
    leftIconButton: {
        width: 40,
        height: 40,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    rightIconButton: {
        width: 40,
        height: 40,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    sendButtonActive: {
        backgroundColor: '#4f46e5',
    },
    sendButtonInactive: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
});
