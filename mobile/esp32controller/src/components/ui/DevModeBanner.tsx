import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useState } from 'react';

/**
 * Development Mode Banner
 *
 * Shows a persistent indicator when the app is running in mock/dev mode.
 * Helps developers remember they're working with mock data.
 *
 * Only displays when EXPO_PUBLIC_MOCK_DEVICE=true
 */
export const DevModeBanner: React.FC = () => {
  const [isMinimized, setIsMinimized] = useState(false);
  const isMockMode = process.env.EXPO_PUBLIC_MOCK_DEVICE === 'true';

  // Don't render if not in mock mode
  if (!isMockMode) {
    return null;
  }

  if (isMinimized) {
    return (
      <Pressable
        onPress={() => setIsMinimized(false)}
        className="absolute top-2 right-2 z-50 bg-purple-600/90 px-3 py-1 rounded-full"
      >
        <Text className="text-xs font-bold text-white">DEV</Text>
      </Pressable>
    );
  }

  return (
    <View className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
          <Text className="text-white text-xs font-semibold flex-1">
            DEV MODE - Using Mock Data
          </Text>
        </View>
        <Pressable
          onPress={() => setIsMinimized(true)}
          className="ml-2 px-2 py-1 bg-white/20 rounded"
        >
          <Text className="text-white text-xs">Hide</Text>
        </Pressable>
      </View>
    </View>
  );
};

/**
 * Hook to check if app is in dev/mock mode
 */
export const useDevMode = () => {
  const isMockMode = process.env.EXPO_PUBLIC_MOCK_DEVICE === 'true';
  return {
    isDevMode: isMockMode,
    espIp: process.env.EXPO_PUBLIC_ESP_IP || '192.168.1.100',
  };
};
