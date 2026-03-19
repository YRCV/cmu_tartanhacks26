import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { TechGrid } from '@/src/components/ui/TechGrid';
import { theme, hairlineWidth } from '@/src/theme/colors';
import deviceClient from '@/src/lib/deviceClient';
import { getDeviceClient, isMockMode } from '@/src/lib/deviceClient.mock';
import { isValidIP } from '@/src/lib/deviceClient';

const STORAGE_LAST_IP = 'device.lastIp';
const STORAGE_IP_HISTORY = 'device.ipHistory';

const RETRY_DELAYS_MS = [0, 400, 900];

export default function ConnectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [ipInput, setIpInput] = useState('192.168.1.100');
  const [status, setStatus] = useState<'idle' | 'connecting' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [ipHistory, setIpHistory] = useState<string[]>([]);

  const client = useMemo(() => (isMockMode() ? getDeviceClient() : deviceClient), []);

  useEffect(() => {
    const load = async () => {
      try {
        const lastIp = await AsyncStorage.getItem(STORAGE_LAST_IP);
        const historyRaw = await AsyncStorage.getItem(STORAGE_IP_HISTORY);
        if (lastIp) setIpInput(lastIp);
        if (historyRaw) {
          const parsed = JSON.parse(historyRaw);
          if (Array.isArray(parsed)) setIpHistory(parsed.filter((v) => typeof v === 'string'));
        }
      } catch {
        // ignore storage errors for demo flow
      }
    };
    load();
  }, []);

  const persistIp = async (ip: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_LAST_IP, ip);
      const nextHistory = [ip, ...ipHistory.filter((i) => i !== ip)].slice(0, 5);
      setIpHistory(nextHistory);
      await AsyncStorage.setItem(STORAGE_IP_HISTORY, JSON.stringify(nextHistory));
    } catch {
      // ignore storage errors for demo flow
    }
  };

  const connectWithRetry = async (ip: string) => {
    for (let i = 0; i < RETRY_DELAYS_MS.length; i += 1) {
      const delay = RETRY_DELAYS_MS[i];
      if (delay) {
        await new Promise((r) => setTimeout(r, delay));
      }
      const result = await client.getStatus(ip, { timeoutMs: 2000 });
      if (result.ok) return true;
    }
    return false;
  };

  const handleConnect = async () => {
    if (!ipInput.trim()) return;
    const ip = ipInput.trim();
    if (!isValidIP(ip)) {
      setErrorMessage('Invalid IP address format.');
      setStatus('error');
      return;
    }

    setStatus('connecting');
    setErrorMessage(null);
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const ok = await connectWithRetry(ip);
    if (ok) {
      await persistIp(ip);
      setStatus('idle');
      router.replace('/(tabs)/dashboard');
      return;
    }

    setStatus('error');
    setErrorMessage('Not reachable.');
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleAutoDiscover = async () => {
    if (status === 'connecting') return;
    setStatus('connecting');
    setErrorMessage(null);
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const candidates = [...ipHistory];
    if (candidates.length === 0) {
      candidates.push('192.168.1.100', '192.168.4.1');
    }

    for (const ip of candidates) {
      const ok = await connectWithRetry(ip);
      if (ok) {
        setIpInput(ip);
        await persistIp(ip);
        setStatus('idle');
        router.replace('/(tabs)/dashboard');
        return;
      }
    }

    setStatus('error');
    setErrorMessage('Not reachable.');
  };

  return (
    <View style={styles.container}>
      <TechGrid />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <View style={styles.centeredContent}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Text style={styles.heroSubtitle}>CONNECT</Text>
            <Text style={styles.heroTitle}>Pair Your Device</Text>
            <Text style={styles.heroBody}>
              Connect to any IoT device on your network{'\n'}
              to begin monitoring and control
            </Text>
          </View>

          {/* Connection Card */}
          <View style={styles.connectionCard}>
            <BlurView intensity={60} tint={theme.blur.thin} style={StyleSheet.absoluteFill} />

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>DEVICE IP ADDRESS</Text>
              <TextInput
                value={ipInput}
                onChangeText={setIpInput}
                placeholder="192.168.1.100"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                keyboardType="numbers-and-punctuation"
                autoCapitalize="none"
                autoCorrect={false}
                editable={status !== 'connecting'}
                returnKeyType="go"
                onSubmitEditing={handleConnect}
                style={styles.input}
              />
            </View>

            <Pressable
              onPress={handleConnect}
              disabled={status === 'connecting'}
              style={({ pressed }) => [
                styles.connectButton,
                pressed && status !== 'connecting' ? { opacity: 0.85, transform: [{ scale: 0.98 }] } : null,
              ]}
            >
              <BlurView intensity={90} tint={theme.blur.material} style={StyleSheet.absoluteFill} />
              <View style={styles.buttonContent}>
                {status === 'connecting' ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.buttonText}>Connect</Text>
                )}
              </View>
            </Pressable>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              onPress={handleAutoDiscover}
              disabled={status === 'connecting'}
              style={({ pressed }) => [
                styles.discoverButton,
                pressed && status !== 'connecting' ? { opacity: 0.7 } : null,
              ]}
            >
              <Text style={styles.discoverText}>
                {status === 'connecting' ? 'Searching...' : 'Auto-Discover Devices'}
              </Text>
            </Pressable>

            {status === 'error' && (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>⚠️ {errorMessage}</Text>
                <Text style={styles.errorHint}>• Ensure device is on the same WiFi network</Text>
                <Text style={styles.errorHint}>• Verify the IP address is correct</Text>
                <Text style={styles.errorHint}>• Check device is powered on and responsive</Text>
              </View>
            )}
          </View>

          {/* Bottom Hint */}
          <Text style={styles.bottomHint}>
            Device controls will appear after connection
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.layout.padding.screen,
    gap: 32,
  },
  heroSection: {
    alignItems: 'center',
    gap: 12,
  },
  heroSubtitle: {
    fontSize: 11,
    color: theme.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 2.5,
    fontFamily: 'monospace',
    fontWeight: '500',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.text.primary,
    letterSpacing: -0.5,
  },
  heroBody: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.text.secondary,
    textAlign: 'center',
    maxWidth: 340,
  },
  connectionCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: theme.layout.borderRadius.xl,
    borderWidth: hairlineWidth,
    borderColor: theme.border.default,
    padding: 24,
    overflow: 'hidden',
    gap: 16,
  },
  inputSection: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: theme.text.tertiary,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: theme.layout.borderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#ffffff',
    fontFamily: 'monospace',
    fontSize: 16,
    textAlign: 'center',
  },
  connectButton: {
    borderRadius: theme.layout.borderRadius.lg,
    borderWidth: hairlineWidth,
    borderColor: 'rgba(99, 102, 241, 0.5)',
    overflow: 'hidden',
    minHeight: 56,
    justifyContent: 'center',
  },
  buttonContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  dividerText: {
    fontSize: 11,
    color: theme.text.tertiary,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  discoverButton: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: theme.layout.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  discoverText: {
    color: theme.text.secondary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  errorBox: {
    marginTop: 8,
    padding: 16,
    borderRadius: theme.layout.borderRadius.md,
    borderWidth: hairlineWidth,
    borderColor: 'rgba(239, 68, 68, 0.6)',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    gap: 4,
  },
  errorTitle: {
    color: '#fca5a5',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  errorHint: {
    color: theme.text.secondary,
    fontSize: 12,
    lineHeight: 18,
  },
  bottomHint: {
    fontSize: 12,
    color: theme.text.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.7,
  },
});
