import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBanner } from '@/src/components/ui/StatusBanner';
import { ControlRenderer } from '@/src/components/ui/ControlRenderer';

// Mock schema - in a real app this would come from the backend/context
const INITIAL_CONTROLS = [
    {
        id: 'c1',
        type: 'gauge' as const,
        label: 'Temperature',
        value: 24,
        min: 0,
        max: 50,
        unit: '°C',
        description: 'Current temperature reading from sensor'
    },
    {
        id: 'c2',
        type: 'slider' as const,
        label: 'Pulse Override',
        value: 50,
        min: 0,
        max: 100,
        unit: '%',
        description: 'Manually control LED pulse rate'
    },
    {
        id: 'c3',
        type: 'toggle' as const,
        label: 'Auto Mode',
        value: true,
        description: 'Enable automatic temperature-based control'
    },
    {
        id: 'c4',
        type: 'text' as const,
        label: 'System Uptime',
        value: '12m 30s',
        description: 'Time since last restart'
    }
];

export default function ControlPage() {
    const router = useRouter();
    const [controls, setControls] = useState(INITIAL_CONTROLS);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'deploying' | 'error'>('connected');
    const [lastUpdate, setLastUpdate] = useState(new Date());

    const handleControlChange = (id: string, newValue: any) => {
        setControls(prev => prev.map(c =>
            c.id === id ? { ...c, value: newValue } : c
        ));
        setLastUpdate(new Date());
    };

    const handleNewConfiguration = () => {
        Alert.alert(
            'Create New Configuration?',
            'This will take you back to create a new firmware configuration. Your current deployment will remain active.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Continue',
                    onPress: () => router.push('/')
                }
            ]
        );
    };

    // Simulate live updates for gauge (temperature)
    useEffect(() => {
        const interval = setInterval(() => {
            setControls(prev => prev.map(c => {
                if (c.id === 'c1' && c.type === 'gauge') {
                    return { ...c, value: Math.round(24 + Math.random() * 4 - 2) };
                }
                return c;
            }));
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const readOnlyControls = controls.filter(c => c.type === 'gauge' || c.type === 'text');
    const interactiveControls = controls.filter(c => c.type === 'slider' || c.type === 'toggle');

    return (
        <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-neutral-900">
            <ScrollView className="flex-1 px-6 py-8" showsVerticalScrollIndicator={false}>
                <View className="mb-6">
                    <StatusBanner status={connectionStatus} />
                </View>

                <View className="mb-6">
                    <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mb-1">
                        Device Controls
                    </Text>
                    <Text className="text-neutral-500 dark:text-neutral-400 text-sm">
                        Monitor and control your ESP32 in real-time
                    </Text>
                </View>

                {interactiveControls.length > 0 && (
                    <View className="mb-8">
                        <Text className="text-base font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
                            Interactive Controls
                        </Text>
                        <View className="space-y-4">
                            {interactiveControls.map((control) => (
                                <ControlRenderer
                                    key={control.id}
                                    schema={control}
                                    onValueChange={(val) => handleControlChange(control.id, val)}
                                />
                            ))}
                        </View>
                    </View>
                )}

                {readOnlyControls.length > 0 && (
                    <View className="mb-8">
                        <Text className="text-base font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
                            Live Readings
                        </Text>
                        <View className="space-y-4">
                            {readOnlyControls.map((control) => (
                                <ControlRenderer
                                    key={control.id}
                                    schema={control}
                                    onValueChange={(val) => handleControlChange(control.id, val)}
                                />
                            ))}
                        </View>
                    </View>
                )}

                <Pressable
                    onPress={handleNewConfiguration}
                    className="mt-4 p-4 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700"
                >
                    <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                            <Text className="text-base font-medium text-neutral-900 dark:text-neutral-50 mb-1">
                                Create New Configuration
                            </Text>
                            <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                                Generate different firmware behavior
                            </Text>
                        </View>
                        <Text className="text-2xl">→</Text>
                    </View>
                </Pressable>

                <View className="h-24" />
            </ScrollView>

            <View className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                <View className="flex-row justify-between items-center">
                    <View>
                        <Text className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                            Firmware Version
                        </Text>
                        <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            v3.0.0 • Deployed 12s ago
                        </Text>
                    </View>
                    <View className="items-end">
                        <Text className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                            Last Update
                        </Text>
                        <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            {lastUpdate.toLocaleTimeString()}
                        </Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}
