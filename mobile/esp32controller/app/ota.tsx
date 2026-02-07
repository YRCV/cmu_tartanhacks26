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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import deviceClient from '@/src/lib/deviceClient';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '@/src/lib/version';

export default function OtaScreen() {
  const router = useRouter();
  const { defaultIp } = useLocalSearchParams();

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
      const result = await deviceClient.otaUpdate(deviceIp, firmwareUrl, {
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>OTA Update</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Warning Card */}
        <View style={styles.warningCard}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <View style={styles.warningTextContainer}>
            <Text style={styles.warningTitle}>Important</Text>
            <Text style={styles.warningText}>
              • Device will reboot during update{'\n'}
              • Do not power off device{'\n'}
              • Update takes 30-60 seconds{'\n'}
              • Device must be on same network
            </Text>
          </View>
        </View>

        {/* Device IP Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Device IP Address</Text>
          <TextInput
            style={styles.input}
            value={deviceIp}
            onChangeText={setDeviceIp}
            placeholder="192.168.1.100"
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isUpdating}
          />
        </View>

        {/* Firmware URL Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Firmware URL</Text>
          <TextInput
            style={[styles.input, styles.urlInput]}
            value={firmwareUrl}
            onChangeText={setFirmwareUrl}
            placeholder="http://example.com/firmware.bin"
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isUpdating}
            multiline
          />
          <Text style={styles.hint}>
            Must be a publicly accessible HTTP URL to a .bin file
          </Text>
        </View>

        {/* Example URLs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Example URLs</Text>
          <View style={styles.exampleCard}>
            <Text style={styles.exampleLabel}>GitHub Release:</Text>
            <Text style={styles.exampleUrl}>
              https://github.com/user/repo/releases/download/v1.0.0/firmware.bin
            </Text>
          </View>
          <View style={styles.exampleCard}>
            <Text style={styles.exampleLabel}>Direct Server:</Text>
            <Text style={styles.exampleUrl}>
              http://192.168.1.50:8000/firmware.bin
            </Text>
          </View>
        </View>

        {/* Progress Display */}
        {progress && (
          <View style={styles.progressCard}>
            <Text style={styles.progressText}>{progress}</Text>
          </View>
        )}

        {/* Start Button */}
        <TouchableOpacity
          style={[styles.updateButton, isUpdating && styles.buttonDisabled]}
          onPress={handleStartUpdate}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <View style={styles.buttonContent}>
              <ActivityIndicator color="#ffffff" />
              <Text style={styles.buttonText}>Updating...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Start OTA Update</Text>
          )}
        </TouchableOpacity>

        {/* Info Section */}
        <View style={styles.infoSection}>
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
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    fontSize: FONT_SIZE.base,
    color: COLORS.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
  },
  warningIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: FONT_SIZE.base,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: SPACING.xs,
  },
  warningText: {
    fontSize: FONT_SIZE.sm,
    color: '#92400e',
    lineHeight: 20,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZE.base,
    backgroundColor: COLORS.surface,
  },
  urlInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  exampleCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
  exampleLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  exampleUrl: {
    fontSize: FONT_SIZE.xs,
    fontFamily: 'monospace',
    color: COLORS.primary,
  },
  progressCard: {
    backgroundColor: '#ecfdf5',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  progressText: {
    fontSize: FONT_SIZE.sm,
    color: '#065f46',
  },
  updateButton: {
    backgroundColor: COLORS.warning,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  buttonText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: '#ffffff',
  },
  infoSection: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  infoTitle: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '600',
    color: COLORS.text.primary,
  },
});
