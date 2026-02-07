import React from 'react';
import { View, Text } from 'react-native';

interface StatusBannerProps {
    status: 'connected' | 'disconnected' | 'deploying' | 'error';
    message?: string;
}

export function StatusBanner({ status, message }: StatusBannerProps) {
    const getStatusColor = () => {
        switch (status) {
            case 'connected': return 'bg-green-500';
            case 'disconnected': return 'bg-neutral-400';
            case 'deploying': return 'bg-blue-500';
            case 'error': return 'bg-red-500';
            default: return 'bg-neutral-400';
        }
    };

    const getStatusText = () => {
        if (message) return message;
        switch (status) {
            case 'connected': return 'Device Connected';
            case 'disconnected': return 'Device Disconnected';
            case 'deploying': return 'Deploying Firmware...';
            case 'error': return 'Connection Error';
            default: return 'Unknown Status';
        }
    };

    return (
        <View className="flex-row items-center space-x-2 py-2">
            <View className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
            <Text className="text-neutral-600 dark:text-neutral-300 font-medium text-sm">
                {getStatusText()}
            </Text>
        </View>
    );
}
