/**
 * Controller Screen - Latency-First LED Controller
 *
 * Main screen for controlling ESP32 device with emphasis on
 * network latency visibility and tactile controls.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useDeviceState } from '@/src/lib/useDeviceState';
import { TopBar } from '@/components/controller/TopBar';
import { ConnectionCard } from '@/components/controller/ConnectionCard';
import { ControlButtons } from '@/components/controller/ControlButtons';
import { LedStatusDisplay } from '@/components/controller/LedStatusDisplay';
import { ResponsePanel } from '@/components/controller/ResponsePanel';
import {
  getVersionInfo,
  getVersionFooter,
  COLORS,
  SPACING,
  RADIUS,
  FONT_SIZE,
} from '@/src/lib/version';
import { useRouter } from 'expo-router';

export default function ControllerScreen() {
  // ─── State ───────────────────────────────────────────────
  const device = useDeviceState('192.168.1.100');
  const router = useRouter();
  const versionInfo = getVersionInfo();

  const [deviceName, setDeviceName] = useState('ESP32 Device');
  const [showIpModal, setShowIpModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);

  const [ipInput, setIpInput] = useState(device.state.deviceIp);
  const [nameInput, setNameInput] = useState(deviceName);

  // ─── Handlers ────────────────────────────────────────────

  const handleSaveIp = () => {
    if (ipInput) {
      device.setDeviceIp(ipInput);
      setShowIpModal(false);
      Alert.alert('Success', `Device IP set to ${ipInput}`);
    }
  };

  const handleSaveName = () => {
    if (nameInput) {
      setDeviceName(nameInput);
      setShowNameModal(false);
    }
  };

  const handleRefreshStatus = () => {
    device.getStatus();
  };

  const handleOtaPress = () => {
    if (device.isOffline) {
      Alert.alert('Device Offline', 'Device must be online for OTA updates');
      return;
    }
    router.push({
      pathname: '/ota',
      params: { defaultIp: device.state.deviceIp },
    });
  };

  // Derive LED state from last response
  const ledState = deriveLedState(device.state.lastResponseText);

  // ─── Render ──────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <TopBar
        deviceName={deviceName}
        deviceIp={device.state.deviceIp}
        onEditName={() => setShowNameModal(true)}
        onEditIp={() => setShowIpModal(true)}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Connection Card */}
        <ConnectionCard
          status={device.state.connection}
          lastSeen={device.state.lastUpdatedAt || undefined}
          latencyMs={device.state.lastLatencyMs || undefined}
          onPress={handleRefreshStatus}
          isRefreshing={device.state.busyCommand === 'status'}
        />

        {/* Primary Control Buttons */}
        <ControlButtons
          onToggle={device.toggleLed}
          onTurnOn={device.turnLedOn}
          onTurnOff={device.turnLedOff}
          disabled={!device.state.deviceIp || device.isBusy}
          busyButton={
            ['toggle', 'on', 'off'].includes(device.state.busyCommand as any)
              ? (device.state.busyCommand as any)
              : undefined
          }
        />

        {/* LED Status Display */}
        {device.state.lastResponseText && (
          <LedStatusDisplay ledState={ledState} />
        )}

        {/* Error Banner */}
        {device.state.error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{device.state.error}</Text>
            <TouchableOpacity onPress={device.clearError}>
              <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Response Panel */}
        <ResponsePanel responseText={device.state.lastResponseText} />

        {/* OTA Button */}
        <TouchableOpacity
          style={[
            styles.otaButton,
            device.isOffline && styles.otaButtonDisabled,
          ]}
          onPress={handleOtaPress}
          disabled={device.isOffline}
        >
          <Text style={styles.otaButtonText}>OTA Update →</Text>
        </TouchableOpacity>

        {/* Version Footer */}
        <TouchableOpacity
          onPress={() => setShowVersionModal(true)}
          style={styles.versionFooter}
        >
          <Text style={styles.versionText}>
            {getVersionFooter(versionInfo)}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* IP Edit Modal */}
      <Modal
        visible={showIpModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowIpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Device IP</Text>
            <TextInput
              style={styles.modalInput}
              value={ipInput}
              onChangeText={setIpInput}
              placeholder="192.168.1.100"
              keyboardType="numbers-and-punctuation"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowIpModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleSaveIp}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Name Edit Modal */}
      <Modal
        visible={showNameModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Device Name</Text>
            <TextInput
              style={styles.modalInput}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="ESP32 Device"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowNameModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleSaveName}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Version Info Modal */}
      <Modal
        visible={showVersionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVersionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>App Version</Text>
            <View style={styles.versionDetails}>
              <VersionRow label="Version" value={versionInfo.appVersion} />
              <VersionRow label="Build" value={versionInfo.buildNumber} />
              <VersionRow label="Platform" value={versionInfo.platform} />
              <VersionRow label="OS" value={versionInfo.osVersion} />
              {versionInfo.deviceModel && (
                <VersionRow label="Device" value={versionInfo.deviceModel} />
              )}
              {versionInfo.gitHash && (
                <VersionRow
                  label="Git Hash"
                  value={versionInfo.gitHash.substring(0, 7)}
                />
              )}
              {versionInfo.gitBranch && (
                <VersionRow label="Branch" value={versionInfo.gitBranch} />
              )}
            </View>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSave]}
              onPress={() => setShowVersionModal(false)}
            >
              <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/**
 * Version detail row
 */
function VersionRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.versionRow}>
      <Text style={styles.versionLabel}>{label}:</Text>
      <Text style={styles.versionValue}>{value}</Text>
    </View>
  );
}

/**
 * Derive LED state from response text
 */
function deriveLedState(
  responseText: string
): 'on' | 'off' | 'unknown' {
  if (!responseText) return 'unknown';

  const lower = responseText.toLowerCase();

  if (lower.includes('"led":"on"') || lower.includes('led is on')) {
    return 'on';
  } else if (lower.includes('"led":"off"') || lower.includes('led is off')) {
    return 'off';
  }

  return 'unknown';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: '#991b1b',
  },
  dismissText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.danger,
    fontWeight: '600',
  },
  otaButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.warning,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  otaButtonDisabled: {
    borderColor: COLORS.border,
    opacity: 0.5,
  },
  otaButtonText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.warning,
  },
  versionFooter: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  versionText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.text.disabled,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    marginBottom: SPACING.md,
    color: COLORS.text.primary,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZE.base,
    marginBottom: SPACING.md,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  modalButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalButtonSave: {
    backgroundColor: COLORS.primary,
  },
  modalButtonText: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  versionDetails: {
    marginBottom: SPACING.md,
  },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  versionLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  versionValue: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.primary,
    fontFamily: 'monospace',
  },
});
