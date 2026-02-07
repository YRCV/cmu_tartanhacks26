/**
 * Complete Example: Device Control Screen
 *
 * Demonstrates proper usage of useDeviceState hook
 * with race condition prevention and state management.
 *
 * This is a reference implementation you can copy/adapt.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useDeviceState } from './useDeviceState';
import type { CommandLogEntry } from './deviceScreenState';

export default function DeviceScreenExample() {
  // ─── Device State Hook ───────────────────────────────────
  const device = useDeviceState('');
  const [ipInput, setIpInput] = useState('192.168.1.100');
  const [otaUrl, setOtaUrl] = useState('');
  const [showCommandLog, setShowCommandLog] = useState(false);

  // ─── Handlers ────────────────────────────────────────────

  const handleSetIp = () => {
    device.setDeviceIp(ipInput);
    Alert.alert('Success', `Device IP set to ${ipInput}`);
  };

  const handleOtaUpdate = () => {
    if (!otaUrl) {
      Alert.alert('Error', 'Please enter a firmware URL');
      return;
    }
    device.startOtaUpdate(otaUrl);
  };

  // ─── Render ──────────────────────────────────────────────

  return (
    <ScrollView style={styles.container}>
      {/* ─── Header ────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.title}>ESP32 Controller</Text>
        <ConnectionStatusBadge
          label={device.connectionLabel}
          color={device.connectionColor}
        />
      </View>

      {/* ─── Device IP Configuration ──────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device Configuration</Text>
        <View style={styles.ipContainer}>
          <TextInput
            style={styles.input}
            value={ipInput}
            onChangeText={setIpInput}
            placeholder="192.168.1.100"
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.setButton}
            onPress={handleSetIp}
            disabled={!ipInput}
          >
            <Text style={styles.buttonText}>Set IP</Text>
          </TouchableOpacity>
        </View>
        {device.state.deviceIp && (
          <Text style={styles.currentIp}>
            Current: {device.state.deviceIp}
          </Text>
        )}
      </View>

      {/* ─── LED Controls ──────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>LED Control</Text>

        {/* Last State */}
        {device.state.lastResponseText && (
          <View style={styles.ledStatusContainer}>
            <View
              style={[
                styles.ledIndicator,
                {
                  backgroundColor:
                    device.state.lastResponseText === 'on'
                      ? '#fbbf24'
                      : '#6b7280',
                },
              ]}
            />
            <Text style={styles.ledStatusText}>
              LED is {device.state.lastResponseText.toUpperCase()}
            </Text>
            {device.state.lastUpdatedAt && (
              <Text style={styles.timestamp}>
                Updated: {formatTimestamp(device.state.lastUpdatedAt)}
              </Text>
            )}
          </View>
        )}

        {/* Control Buttons */}
        <View style={styles.buttonRow}>
          <ActionButton
            title="Toggle"
            onPress={device.toggleLed}
            disabled={device.isBusy || !device.state.deviceIp}
            loading={device.state.busyCommand === 'toggle'}
            color="#3b82f6"
          />
          <ActionButton
            title="On"
            onPress={device.turnLedOn}
            disabled={device.isBusy || !device.state.deviceIp}
            loading={device.state.busyCommand === 'on'}
            color="#10b981"
          />
          <ActionButton
            title="Off"
            onPress={device.turnLedOff}
            disabled={device.isBusy || !device.state.deviceIp}
            loading={device.state.busyCommand === 'off'}
            color="#ef4444"
          />
        </View>

        {/* Get Status Button */}
        <ActionButton
          title="Get Status"
          onPress={device.getStatus}
          disabled={device.isBusy || !device.state.deviceIp}
          loading={device.state.busyCommand === 'status'}
          color="#8b5cf6"
          fullWidth
        />
      </View>

      {/* ─── OTA Update ────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>OTA Firmware Update</Text>
        <TextInput
          style={styles.input}
          value={otaUrl}
          onChangeText={setOtaUrl}
          placeholder="http://example.com/firmware.bin"
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <ActionButton
          title="Start OTA Update"
          onPress={handleOtaUpdate}
          disabled={device.isBusy || !device.state.deviceIp || !otaUrl}
          loading={device.state.busyCommand === 'ota'}
          color="#f59e0b"
          fullWidth
        />
        <Text style={styles.warningText}>
          ⚠️ Device will reboot during update (30s timeout)
        </Text>
      </View>

      {/* ─── Latency Display ───────────────────────────────── */}
      {device.state.lastLatencyMs > 0 && (
        <View style={styles.latencyContainer}>
          <Text style={styles.latencyText}>
            ⚡ Last request: {device.state.lastLatencyMs}ms
          </Text>
        </View>
      )}

      {/* ─── Error Display ─────────────────────────────────── */}
      {device.state.error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{device.state.error}</Text>
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={device.clearError}
          >
            <Text style={styles.dismissButtonText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── Command Log ───────────────────────────────────── */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.logToggle}
          onPress={() => setShowCommandLog(!showCommandLog)}
        >
          <Text style={styles.sectionTitle}>
            Command Log ({device.state.commandLog.length})
          </Text>
          <Text style={styles.chevron}>
            {showCommandLog ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>

        {showCommandLog && (
          <>
            {device.state.commandLog.length > 0 ? (
              <>
                {device.state.commandLog.map((entry) => (
                  <CommandLogItem key={entry.id} entry={entry} />
                ))}
                <TouchableOpacity
                  style={styles.clearLogButton}
                  onPress={device.clearCommandLog}
                >
                  <Text style={styles.clearLogText}>Clear Log</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.emptyLog}>No commands yet</Text>
            )}
          </>
        )}
      </View>

      {/* ─── Debug Info ────────────────────────────────────── */}
      {__DEV__ && (
        <View style={styles.debugSection}>
          <Text style={styles.debugTitle}>Debug Info</Text>
          <Text style={styles.debugText}>
            Request ID: {device.state.latestRequestId || 'none'}
          </Text>
          <Text style={styles.debugText}>
            Busy: {device.state.busyCommand || 'false'}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

// ─── Subcomponents ─────────────────────────────────────────────

function ConnectionStatusBadge({
  label,
  color,
}: {
  label: string;
  color: string;
}) {
  return (
    <View style={[styles.statusBadge, { backgroundColor: color }]}>
      <Text style={styles.statusText}>{label}</Text>
    </View>
  );
}

function ActionButton({
  title,
  onPress,
  disabled,
  loading,
  color,
  fullWidth = false,
}: {
  title: string;
  onPress: () => void;
  disabled: boolean;
  loading: boolean;
  color: string;
  fullWidth?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.actionButton,
        { backgroundColor: disabled ? '#9ca3af' : color },
        fullWidth && styles.fullWidth,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {loading ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text style={styles.buttonText}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

function CommandLogItem({ entry }: { entry: CommandLogEntry }) {
  const statusIcons = {
    pending: '⏳',
    success: '✅',
    error: '❌',
  };

  const statusColors = {
    pending: '#f59e0b',
    success: '#10b981',
    error: '#ef4444',
  };

  return (
    <View style={styles.logEntry}>
      <View style={styles.logHeader}>
        <Text style={styles.logIcon}>{statusIcons[entry.status]}</Text>
        <Text style={styles.logCommand}>{entry.command}</Text>
        <Text style={styles.logTime}>
          {formatTime(entry.timestamp)}
        </Text>
      </View>

      {entry.responseText && (
        <Text style={styles.logResponse}>→ {entry.responseText}</Text>
      )}

      {entry.errorMessage && (
        <Text style={styles.logError}>✗ {entry.errorMessage}</Text>
      )}

      {entry.latencyMs !== undefined && (
        <Text style={styles.logLatency}>⚡ {entry.latencyMs}ms</Text>
      )}
    </View>
  );
}

// ─── Utilities ─────────────────────────────────────────────────

function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) {
    return `${Math.floor(diff / 1000)}s ago`;
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}m ago`;
  } else {
    return formatTime(date);
  }
}

// ─── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 20,
    backgroundColor: '#1f2937',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    margin: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1f2937',
  },
  ipContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  setButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  currentIp: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  ledStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    marginBottom: 12,
  },
  ledIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  ledStatusText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: '#6b7280',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  fullWidth: {
    flex: undefined,
    width: '100%',
  },
  warningText: {
    marginTop: 8,
    fontSize: 12,
    color: '#f59e0b',
    textAlign: 'center',
  },
  latencyContainer: {
    marginHorizontal: 16,
    padding: 12,
    backgroundColor: '#ecfdf5',
    borderRadius: 8,
    alignItems: 'center',
  },
  latencyText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  errorContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  errorText: {
    fontSize: 14,
    color: '#991b1b',
    marginBottom: 12,
  },
  dismissButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ef4444',
    borderRadius: 4,
  },
  dismissButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  logToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chevron: {
    fontSize: 16,
    color: '#6b7280',
  },
  logEntry: {
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logIcon: {
    fontSize: 16,
  },
  logCommand: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  logTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  logResponse: {
    marginTop: 4,
    fontSize: 12,
    color: '#059669',
  },
  logError: {
    marginTop: 4,
    fontSize: 12,
    color: '#dc2626',
  },
  logLatency: {
    marginTop: 4,
    fontSize: 12,
    color: '#6b7280',
  },
  emptyLog: {
    textAlign: 'center',
    color: '#6b7280',
    padding: 20,
  },
  clearLogButton: {
    marginTop: 8,
    padding: 8,
    alignItems: 'center',
  },
  clearLogText: {
    color: '#ef4444',
    fontSize: 14,
  },
  debugSection: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#92400e',
  },
});
