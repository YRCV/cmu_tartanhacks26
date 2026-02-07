import React, { useState } from 'react';
import { View, Text, SafeAreaView, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ReasoningCard } from '@/src/components/ui/ReasoningCard';
import { PrimaryActionButton } from '@/src/components/ui/PrimaryActionButton';

export default function ReviewPage() {
    const router = useRouter();
    const [isDeploying, setIsDeploying] = useState(false);

    const handleDeploy = () => {
        Alert.alert(
            'Deploy Firmware?',
            'This will update your device with the new configuration. The device will restart and may be unavailable for a few seconds.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Deploy',
                    style: 'default',
                    onPress: () => {
                        setIsDeploying(true);
                        setTimeout(() => {
                            setIsDeploying(false);
                            router.push('/control');
                        }, 2000);
                    }
                }
            ]
        );
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

    return (
        <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-neutral-900">
            <ScrollView className="flex-1 px-6 py-8">
                <Pressable onPress={handleBack} className="mb-6">
                    <Text className="text-base text-neutral-600 dark:text-neutral-400">
                        ← Back to Edit
                    </Text>
                </Pressable>

                <View className="space-y-6">
                    <View>
                        <Text className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
                            Review Your Configuration
                        </Text>
                        <Text className="text-neutral-500 dark:text-neutral-400 text-base leading-6">
                            We've analyzed your request and configured the firmware. Review the components and behavior below before deploying to your device.
                        </Text>
                    </View>

                    <View className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                        <View className="flex-row items-start space-x-3">
                            <Text className="text-xl">ℹ️</Text>
                            <View className="flex-1">
                                <Text className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                    What happens next?
                                </Text>
                                <Text className="text-sm text-blue-800 dark:text-blue-200">
                                    Deploying will compile and flash this firmware to your ESP32. Your device will restart automatically.
                                </Text>
                            </View>
                        </View>
                    </View>

                    <ReasoningCard
                        title="Configuration Summary"
                        items={reasoningItems}
                    />

                    <View className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-4 space-y-2">
                        <Text className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                            Estimated Flash Time
                        </Text>
                        <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                            ~15 seconds
                        </Text>
                        <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                            Device will be offline during deployment
                        </Text>
                    </View>

                    <View className="space-y-3 pt-4">
                        <PrimaryActionButton
                            title={isDeploying ? "Deploying to device..." : "Deploy to Device"}
                            onPress={handleDeploy}
                            isLoading={isDeploying}
                            disabled={isDeploying}
                        />

                        <Pressable
                            onPress={handleBack}
                            className="w-full py-3 items-center"
                            disabled={isDeploying}
                        >
                            <Text className="text-neutral-600 dark:text-neutral-400 font-medium">
                                Go Back & Edit
                            </Text>
                        </Pressable>
                    </View>
                </View>

                <View className="h-8" />
            </ScrollView>
        </SafeAreaView>
    );
}
