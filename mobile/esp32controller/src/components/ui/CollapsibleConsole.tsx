import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, LayoutAnimation, Platform, UIManager } from 'react-native';
import { GlassCard } from './GlassCard';
import { ChevronDown, ChevronUp, Copy, Terminal } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { cn } from '@/src/lib/utils';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CollapsibleConsoleProps {
    logs: string;
    className?: string;
}

export function CollapsibleConsole({ logs, className }: CollapsibleConsoleProps) {
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    const copyToClipboard = async () => {
        await Clipboard.setStringAsync(logs);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!logs) return null;

    return (
        <GlassCard className={cn("overflow-hidden border-white/5", className)} intensity={30} tint="systemThinMaterialDark">
            <TouchableOpacity
                onPress={toggleExpand}
                className="flex-row items-center justify-between py-2 px-1"
            >
                <View className="flex-row items-center gap-2">
                    <Terminal size={14} color="#a3a3a3" />
                    <Text className="text-neutral-400 text-xs font-mono font-medium">DEBUG CONSOLE</Text>
                </View>
                {expanded ? <ChevronUp size={14} color="#a3a3a3" /> : <ChevronDown size={14} color="#a3a3a3" />}
            </TouchableOpacity>

            {expanded && (
                <View className="mt-2 border-t border-white/5 pt-2">
                    <View className="bg-black/30 rounded-lg p-3 mb-2 max-h-40">
                        <ScrollView nestedScrollEnabled>
                            <Text className="text-green-400 font-mono text-xs">{logs}</Text>
                        </ScrollView>
                    </View>

                    <TouchableOpacity
                        onPress={copyToClipboard}
                        className="flex-row items-center justify-end gap-2 p-1"
                    >
                        {copied ? (
                            <Text className="text-green-500 text-xs font-medium">Copied!</Text>
                        ) : (
                            <>
                                <Text className="text-neutral-500 text-xs">Copy Logs</Text>
                                <Copy size={12} color="#737373" />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </GlassCard>
    );
}
