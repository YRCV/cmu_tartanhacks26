/**
 * ResponsePanel - Collapsible panel showing raw response text (NativeWind version)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Clipboard,
  Alert,
  Platform,
} from 'react-native';

export interface ResponsePanelProps {
  /** Raw response text to display */
  responseText: string;

  /** Whether panel is initially collapsed */
  initiallyCollapsed?: boolean;
}

export function ResponsePanel({
  responseText,
  initiallyCollapsed = true,
}: ResponsePanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(initiallyCollapsed);

  const handleCopy = () => {
    Clipboard.setString(responseText);
    Alert.alert('Copied', 'Response copied to clipboard');
  };

  return (
    <View className="bg-surface border border-border rounded-card mb-4 overflow-hidden">
      {/* Header (tap to expand/collapse) */}
      <TouchableOpacity
        className="flex-row justify-between items-center p-4 bg-surface-hover active:bg-border-hover"
        onPress={() => setIsCollapsed(!isCollapsed)}
        activeOpacity={0.7}
      >
        <Text className="text-text-primary font-semibold">
          Response {isCollapsed ? '►' : '▼'}
        </Text>
        {!isCollapsed && responseText && (
          <TouchableOpacity
            onPress={handleCopy}
            className="bg-primary active:bg-primary-hover px-3 py-1 rounded"
          >
            <Text className="text-white text-xs font-semibold">Copy</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Response Text (when expanded) */}
      {!isCollapsed && (
        <View className="p-4 bg-background/20">
          {responseText ? (
            <Text
              className="text-text-primary text-sm"
              style={{
                fontFamily: Platform.select({
                  ios: 'Menlo',
                  android: 'monospace',
                  default: 'monospace',
                }),
              }}
            >
              {responseText}
            </Text>
          ) : (
            <Text className="text-text-disabled text-sm italic">
              No response yet
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
