/**
 * OTA Update Screen
 *
 * Separate screen for initiating firmware updates over-the-air.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { ArrowLeft, AlertTriangle, Wifi } from 'lucide-react-native';
import { otaUpdate } from '@/src/lib/deviceClient';
import { theme, hairlineWidth } from '@/src/theme/colors';

export default function OtaScreen() {
  const router = useRouter();
  const { defaultIp } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const [deviceIp, setDeviceIp] = useState(
    (defaultIp as string) || '192.168.1.100'
  );
  const [firmwareUrl, setFirmwareUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState('');

  const handleStartUpdate = async () => {
    if (!deviceIp) {
      Alert.alert('Error', 'Please enter device IP address');
      return;
    }

    if (!firmwareUrl) {
      Alert.alert('Error', 'Please enter firmware URL');
      return;
    }

    // Confirm before starting
    Alert.alert(
      'Confirm OTA Update',
      'Device will reboot during update. This may take up to 30 seconds.\n\nContinue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Update',
          style: 'destructive',
          onPress: startOtaUpdate,
        },
      ]
    );
  };

  const startOtaUpdate = async () => {
    setIsUpdating(true);
    setProgress('Initiating OTA update...');

    try {
      const result = await otaUpdate(deviceIp, firmwareUrl, {
        timeoutMs: 30000, // 30 second timeout
      });

      if (result.ok) {
        setProgress('Update started successfully!');
        Alert.alert(
          'Success',
          'OTA update initiated. Device will reboot.\n\nWait 30-60 seconds before reconnecting.',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        setProgress(`Error: ${result.error}`);
        Alert.alert('Update Failed', result.error);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      setProgress(`Error: ${message}`);
      Alert.alert('Update Failed', message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            { opacity: pressed ? 0.6 : 1 }
          ]}
        >
          <ArrowLeft size={20} color={theme.colors.primary} />
        </Pressable>
        <Text style={styles.title}>OTA Update</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 40 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Warning Card */}
        <View style={styles.warningCard}>
          <BlurView
            intensity={60}
            tint={theme.blur.thin}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.warningHeader}>
            <AlertTriangle size={18} color={theme.colors.warning} />
            <Text style={styles.warningTitle}>Important</Text>
          </View>
          <Text style={styles.warningText}>
            • Device will reboot during update{'\n'}
            • Do not power off device{'\n'}
            • Update takes 30-60 seconds{'\n'}
            • Device must be on same network
          </Text>
        </View>

        {/* Device IP Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Device IP Address</Text>
          <View style={styles.inputCard}>
            <BlurView
              intensity={40}
              tint={theme.blur.ultraThin}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.inputWrapper}>
              <Wifi size={16} color="rgba(255, 255, 255, 0.5)" />
              <TextInput
                style={styles.input}
                value={deviceIp}
                onChangeText={setDeviceIp}
                placeholder="192.168.1.100"
                placeholderTextColor={theme.text.placeholder}
                keyboardType="numbers-and-punctuation"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isUpdating}
              />
            </View>
          </View>
        </View>

        {/* Firmware URL Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Firmware URL</Text>
          <View style={[styles.inputCard, styles.urlInputCard]}>
            <BlurView
              intensity={40}
              tint={theme.blur.ultraThin}
              style={StyleSheet.absoluteFill}
            />
            <TextInput
              style={[styles.input, styles.urlInput]}
              value={firmwareUrl}
              onChangeText={setFirmwareUrl}
              placeholder="http://example.com/firmware.bin"
              placeholderTextColor={theme.text.placeholder}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isUpdating}
              multiline
            />
          </View>
          <Text style={styles.hint}>
            Must be a publicly accessible HTTP URL to a .bin file
          </Text>
        </View>

        {/* Example URLs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Example URLs</Text>
          <View style={styles.exampleCard}>
            <BlurView
              intensity={60}
              tint={theme.blur.thin}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.exampleLabel}>GitHub Release:</Text>
            <Text style={styles.exampleUrl}>
              https://github.com/user/repo/releases/download/v1.0.0/firmware.bin
            </Text>
          </View>
          <View style={styles.exampleCard}>
            <BlurView
              intensity={60}
              tint={theme.blur.thin}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.exampleLabel}>Direct Server:</Text>
            <Text style={styles.exampleUrl}>
              http://192.168.1.50:8000/firmware.bin
            </Text>
          </View>
        </View>

        {/* Progress Display */}
        {progress && (
          <View style={styles.progressCard}>
            <BlurView
              intensity={60}
              tint={theme.blur.thin}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.progressText}>{progress}</Text>
          </View>
        )}

        {/* Start Button */}
        <Pressable
          style={({ pressed }) => [
            styles.updateButton,
            isUpdating && styles.buttonDisabled,
            { opacity: pressed && !isUpdating ? 0.8 : 1 }
          ]}
          onPress={handleStartUpdate}
          disabled={isUpdating}
        >
          <BlurView
            intensity={80}
            tint={theme.blur.material}
            style={StyleSheet.absoluteFill}
          />
          {isUpdating ? (
            <View style={styles.buttonContent}>
              <ActivityIndicator color="#ffffff" />
              <Text style={styles.buttonText}>Updating...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Start OTA Update</Text>
          )}
        </Pressable>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <BlurView
            intensity={60}
            tint={theme.blur.thin}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.infoTitle}>How it works</Text>
          <Text style={styles.infoText}>
            1. ESP32 downloads firmware from the URL{'\n'}
            2. Firmware is verified and installed{'\n'}
            3. Device automatically reboots{'\n'}
            4. New firmware starts running
          </Text>
        </View>

        {/* Troubleshooting */}
        <View style={styles.infoSection}>
          <BlurView
            intensity={60}
            tint={theme.blur.thin}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.infoTitle}>Troubleshooting</Text>
          <Text style={styles.infoText}>
            <Text style={styles.bold}>Timeout:</Text> Device may not have
            internet access{'\n'}
            <Text style={styles.bold}>404 Error:</Text> Check firmware URL is
            correct{'\n'}
            <Text style={styles.bold}>Failed to download:</Text> Ensure URL is
            HTTP, not HTTPS{'\n'}
            <Text style={styles.bold}>Device not responding:</Text> Wait 60s,
            then power cycle
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.layout.padding.screen,
    paddingBottom: 16,
    borderBottomWidth: hairlineWidth,
    borderBottomColor: theme.border.subtle,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text.primary,
    letterSpacing: -0.5,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.layout.padding.screen,
  },
  warningCard: {
    borderRadius: theme.layout.borderRadius.lg,
    borderWidth: hairlineWidth,
    borderColor: theme.colors.warningDark,
    padding: 20,
    marginBottom: 24,
    overflow: 'hidden',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.warning,
  },
  warningText: {
    fontSize: 13,
    color: theme.text.secondary,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.text.primary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputCard: {
    borderRadius: theme.layout.borderRadius.md,
    borderWidth: hairlineWidth,
    borderColor: theme.border.default,
    overflow: 'hidden',
  },
  urlInputCard: {
    minHeight: 80,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: theme.text.primary,
    fontFamily: 'monospace',
    paddingVertical: 0,
  },
  urlInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  hint: {
    fontSize: 12,
    color: theme.text.tertiary,
    marginTop: 6,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.text.primary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  exampleCard: {
    borderRadius: theme.layout.borderRadius.md,
    borderWidth: hairlineWidth,
    borderColor: theme.border.default,
    padding: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  exampleLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.text.tertiary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  exampleUrl: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: theme.colors.primaryLight,
    lineHeight: 18,
  },
  progressCard: {
    borderRadius: theme.layout.borderRadius.md,
    borderWidth: hairlineWidth,
    borderColor: theme.colors.success,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressText: {
    fontSize: 13,
    color: theme.colors.successLight,
    fontWeight: '500',
  },
  updateButton: {
    borderRadius: theme.layout.borderRadius.lg,
    borderWidth: hairlineWidth,
    borderColor: theme.colors.warningDark,
    padding: 18,
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  infoSection: {
    borderRadius: theme.layout.borderRadius.md,
    borderWidth: hairlineWidth,
    borderColor: theme.border.default,
    padding: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.text.primary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoText: {
    fontSize: 13,
    color: theme.text.secondary,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '600',
    color: theme.text.primary,
  },
});
