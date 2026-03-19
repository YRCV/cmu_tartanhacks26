/**
 * ResponsePanel - Collapsible panel showing raw response text
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Clipboard,
  Alert,
  Platform,
} from 'react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '@/src/lib/version';

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
    <View style={styles.container}>
      {/* Header (tap to expand/collapse) */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsCollapsed(!isCollapsed)}
        activeOpacity={0.7}
      >
        <Text style={styles.headerText}>
          Response {isCollapsed ? '►' : '▼'}
        </Text>
        {!isCollapsed && responseText && (
          <TouchableOpacity onPress={handleCopy} style={styles.copyButton}>
            <Text style={styles.copyText}>Copy</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Response Text (when expanded) */}
      {!isCollapsed && (
        <View style={styles.responseContainer}>
          {responseText ? (
            <Text style={styles.responseText}>{responseText}</Text>
          ) : (
            <Text style={styles.emptyText}>No response yet</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
  },
  headerText: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  copyButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
  },
  copyText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: '#ffffff',
  },
  responseContainer: {
    padding: SPACING.md,
    backgroundColor: '#f3f4f6',
  },
  responseText: {
    fontSize: FONT_SIZE.sm,
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
    color: COLORS.text.primary,
  },
  emptyText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.disabled,
    fontStyle: 'italic',
  },
});
