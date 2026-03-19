import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Switch, TextInput, Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { mockControls, isMockMode, getDeviceClient } from '@/src/lib/deviceClient.mock';
import deviceClient from '@/src/lib/deviceClient';
import { theme, hairlineWidth } from '@/src/theme/colors';
import { ScreenLayout } from '@/src/components/layout/ScreenLayout';
import { Terminal as TerminalIcon, Activity, Wifi } from 'lucide-react-native';

export default function DiagnosticsScreen() {
  const [deviceIp, setDeviceIp] = useState('192.168.1.100');
  const [logs, setLogs] = useState<string[]>([]);
  const insets = useSafeAreaInsets();

  // Mock State
  const [useMock, setUseMock] = useState(isMockMode());
  const [mockOnline, setMockOnline] = useState(true);
  const [mockLatency, setMockLatency] = useState('50');

  // Shared value for scroll position
  const scrollY = useSharedValue(0);

  // Scroll handler
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  // Animated style for sticky header
  const stickyHeaderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [100, 150], [0, 1], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(scrollY.value, [100, 150], [-10, 0], Extrapolation.CLAMP) }
    ],
  }));

  // Add log
  const log = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  };

  // Ping Test
  const handlePing = async () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    log(`Pinging ${deviceIp}...`);
    try {
      const client = useMock ? getDeviceClient() : deviceClient;
      const result = await client.getStatus(deviceIp, { timeoutMs: 3000 });

      if (result.ok) {
        log(`✅ Success (${result.latencyMs}ms): ${result.rawText}`);
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        log(`❌ Failed (${result.latencyMs}ms): ${result.error} [${result.errorType}]`);
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    } catch (e) {
      log(`🔥 Exception: ${e}`);
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  // Mock Controls
  useEffect(() => {
    if (useMock) {
      mockControls.setOnline(mockOnline);
      mockControls.setLatency(parseInt(mockLatency) || 50, (parseInt(mockLatency) || 50) + 100);
    }
  }, [mockOnline, mockLatency, useMock]);

  return (
    <ScreenLayout useCustomHeader scrollable={false}>
      {/* Animated Sticky Header */}
      <Animated.View
        style={[
          styles.stickyHeader,
          { paddingTop: insets.top + theme.layout.headerSafeTopOffset, paddingBottom: 20 },
          stickyHeaderStyle
        ]}
        pointerEvents="box-none"
      >
        <BlurView
          intensity={95}
          tint={theme.blur.material}
          style={[StyleSheet.absoluteFill, { borderBottomWidth: hairlineWidth, borderBottomColor: theme.border.subtle }]}
        />
        <View style={styles.stickyHeaderContent}>
          <View style={styles.headerLeft}>
            <TerminalIcon size={16} color="#ffffff" opacity={0.6} />
            <Text style={styles.stickyHeaderTitle}>Diagnostics</Text>
          </View>
          <Activity size={14} color="#10b981" />
        </View>
      </Animated.View>

      {/* Scrollable Content */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={true}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: 120,
          paddingHorizontal: theme.layout.padding.screen,
        }}
      >
        {/* Hero Header */}
        <View style={styles.heroHeader}>
          <BlurView
            intensity={80}
            tint={theme.blur.ultraThin}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <TerminalIcon size={16} color="#ffffff" opacity={0.6} />
              <View>
                <Text style={styles.headerSubtitle}>Terminal</Text>
                <Text style={styles.headerTitle}>Diagnostics</Text>
              </View>
            </View>
            <View style={styles.statusBadge}>
              <Activity size={14} color="#10b981" />
              <Text style={styles.headerStatusText}>Tools</Text>
            </View>
          </View>
        </View>

        {/* Environment Info */}
        <View style={styles.card}>
          <BlurView
            intensity={60}
            tint={theme.blur.thin}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.cardTitle}>Environment</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Mock Mode (Env)</Text>
            <Text style={[styles.value, { color: isMockMode() ? '#34d399' : 'rgba(255, 255, 255, 0.4)' }]}>
              {isMockMode() ? 'ENABLED' : 'DISABLED'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Force Mock</Text>
            <Switch
              value={useMock}
              onValueChange={(val) => {
                setUseMock(val);
                if (Platform.OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
              trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: '#10b981' }}
              thumbColor="#ffffff"
              ios_backgroundColor="rgba(255, 255, 255, 0.2)"
            />
          </View>
        </View>

        {/* Mock Controls */}
        {useMock && (
          <View style={styles.card}>
            <BlurView
              intensity={60}
              tint={theme.blur.thin}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.cardTitle}>Mock Controls</Text>
            <View style={[styles.row, { marginBottom: 16 }]}>
              <Text style={styles.label}>Device Online</Text>
              <Switch
                value={mockOnline}
                onValueChange={(val) => {
                  setMockOnline(val);
                  if (Platform.OS === 'ios') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
                trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: '#10b981' }}
                thumbColor="#ffffff"
                ios_backgroundColor="rgba(255, 255, 255, 0.2)"
              />
            </View>
            <View>
              <Text style={[styles.label, { marginBottom: 8 }]}>Base Latency (ms)</Text>
              <TextInput
                style={styles.input}
                value={mockLatency}
                onChangeText={setMockLatency}
                keyboardType="numeric"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
              />
            </View>
          </View>
        )}

        {/* Connectivity Test */}
        <View style={styles.card}>
          <BlurView
            intensity={60}
            tint={theme.blur.thin}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.cardHeader}>
            <Wifi size={14} color="#ffffff" opacity={0.5} />
            <Text style={styles.cardTitle}>Connectivity Test</Text>
          </View>
          <TextInput
            style={[styles.input, { marginBottom: 16 }]}
            value={deviceIp}
            onChangeText={setDeviceIp}
            placeholder="Device IP"
            placeholderTextColor="rgba(255, 255, 255, 0.3)"
          />
          <Pressable
            onPress={handlePing}
            style={({ pressed }) => [
              styles.button,
              { opacity: pressed ? 0.7 : 1 }
            ]}
          >
            <Text style={styles.buttonText}>Ping Device</Text>
          </Pressable>
        </View>

        {/* Logs */}
        <View style={styles.card}>
          <BlurView
            intensity={60}
            tint={theme.blur.thin}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.logHeader}>
            <Text style={styles.cardTitle}>Logs</Text>
            <Pressable
              onPress={() => {
                setLogs([]);
                if (Platform.OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
            >
              <Text style={styles.clearButton}>Clear</Text>
            </Pressable>
          </View>
          <View style={styles.logContainer}>
            <ScrollView nestedScrollEnabled>
              {logs.length === 0 && (
                <Text style={styles.logEmpty}>No logs yet...</Text>
              )}
              {logs.map((L, i) => (
                <Text key={i} style={styles.logText}>
                  {L}
                </Text>
              ))}
            </ScrollView>
          </View>
        </View>
      </Animated.ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: theme.layout.padding.screen,
    paddingBottom: 12,
  },
  stickyHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  stickyHeaderTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  heroHeader: {
    marginBottom: 16,
    borderRadius: theme.layout.borderRadius.lg,
    borderWidth: hairlineWidth,
    borderColor: theme.border.default,
    overflow: 'hidden',
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerSubtitle: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerStatusText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    marginBottom: 16,
    borderRadius: theme.layout.borderRadius.lg,
    borderWidth: hairlineWidth,
    borderColor: theme.border.default,
    padding: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  cardTitle: {
    fontSize: 10,
    textTransform: 'uppercase',
    marginBottom: 16,
    fontFamily: 'monospace',
    letterSpacing: 1.5,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  value: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: theme.layout.borderRadius.md,
    padding: 12,
    color: '#ffffff',
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: theme.layout.borderRadius.lg,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  clearButton: {
    color: theme.colors.primaryLight,
    fontSize: 12,
    fontWeight: '600',
  },
  logContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 12,
    borderRadius: theme.layout.borderRadius.md,
    minHeight: 240,
    maxHeight: 240,
  },
  logEmpty: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 12,
    fontStyle: 'italic',
    fontFamily: 'monospace',
  },
  logText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
    lineHeight: 20,
  },
});
