/**
 * Controller Screen - Modern iOS Dark Mode
 *
 * Implements a high-fidelity, dark-themed UI with neumorphic touches
 * and glassmorphism, matching the "Modern iOS" aesthetic.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { useDeviceState } from '@/src/lib/useDeviceState';
import { cn } from '@/src/lib/utils';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { NeumorphicButton } from '@/src/components/ui/NeumorphicButton';
import { CollapsibleConsole } from '@/src/components/ui/CollapsibleConsole';
import { GlassAlert } from '@/src/components/ui/GlassAlert';
import { useRouter } from 'expo-router';
import { Power, Zap, Activity } from 'lucide-react-native';

export default function ControllerScreen() {
  // ─── State ───────────────────────────────────────────────
  const device = useDeviceState('192.168.1.100');
  const router = useRouter();

  const [deviceName] = useState('Living Room');
  const [showIpModal, setShowIpModal] = useState(false);
  const [ipInput, setIpInput] = useState(device.state.deviceIp);

  // Derive gauge value from LED state (0 = Off, 100 = On)
  const isLedOn = device.state.lastResponseText?.toLowerCase().includes('on') || false;

  // ─── Handlers ────────────────────────────────────────────

  const handleSaveIp = () => {
    if (ipInput) {
      device.setDeviceIp(ipInput);
      setShowIpModal(false);
    }
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

  // ─── Render ──────────────────────────────────────────────

  return (
    <View className="flex-1 bg-background">
      <StatusBar barStyle="light-content" />

      {/* Header (Glass, Name, IP) */}
      <View className="flex-row justify-between items-center px-6 pt-16 pb-4">
        <View>
          <Text className="text-neutral-500 text-xs font-semibold tracking-widest uppercase mb-1">
            CONTROLLER
          </Text>
          <Text className="text-white text-xl font-bold tracking-tight">
            {deviceName}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setShowIpModal(true)}
          className="bg-surface-highlight px-3 py-1.5 rounded-full flex-row items-center gap-2 border border-white/5"
        >
          <View className={`w-2 h-2 rounded-full ${device.isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
          <Text className="text-neutral-300 text-xs font-mono">{device.state.deviceIp || "No IP"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} className="px-6">

        {/* Error Alert */}
        {device.state.error && (
          <View className="mb-4">
            <GlassAlert
              title="Connection Error"
              message={device.state.error}
              onDismiss={device.clearError}
            />
          </View>
        )}

        {/* Instrument Cluster (Status, Latency, Timestamp) */}
        <GlassCard className="mb-6 p-0 overflow-hidden">
          <View className="flex-row divide-x divide-white/5">
            <View className="flex-1 p-4 items-center">
              <Text className="text-neutral-500 text-[10px] uppercase font-bold tracking-wider mb-1">STATUS</Text>
              <Text className={cn("text-base font-semibold", device.isOnline ? "text-green-500" : "text-red-500")}>
                {device.isOnline ? "ONLINE" : "OFFLINE"}
              </Text>
            </View>
            <View className="flex-1 p-4 items-center">
              <Text className="text-neutral-500 text-[10px] uppercase font-bold tracking-wider mb-1">LATENCY</Text>
              <Text className="text-white text-base font-semibold font-mono">
                {device.state.lastLatencyMs ? `${device.state.lastLatencyMs}ms` : '--'}
              </Text>
            </View>
            <View className="flex-1 p-4 items-center">
              <Text className="text-neutral-500 text-[10px] uppercase font-bold tracking-wider mb-1">LAST SEEN</Text>
              <Text className="text-neutral-300 text-base font-semibold">
                {device.state.lastUpdatedAt ? new Date(device.state.lastUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Primary Controls (Row of 3) */}
        <View className="flex-row gap-4 mb-8 h-32">
          {/* Toggle (Blue) */}
          <NeumorphicButton
            className="flex-1 h-full bg-primary/10 border-primary/30"
            onPress={device.toggleLed}
            disabled={device.isBusy}
            active={isLedOn} // Using active check for styling if needed, or visual feedback
          >
            <View className="items-center gap-2">
              <Power size={32} color="#0a84ff" />
              <Text className="text-primary font-bold">TOGGLE</Text>
            </View>
          </NeumorphicButton>

          {/* On (Green) */}
          <NeumorphicButton
            className="flex-1 h-full bg-green-500/10 border-green-500/30"
            onPress={device.turnLedOn}
            disabled={device.isBusy}
          >
            <View className="items-center gap-2">
              <View className="w-8 h-8 rounded-full border-4 border-green-500" />
              <Text className="text-green-500 font-bold">ON</Text>
            </View>
          </NeumorphicButton>

          {/* Off (Red) */}
          <NeumorphicButton
            className="flex-1 h-full bg-red-500/10 border-red-500/30"
            onPress={device.turnLedOff}
            disabled={device.isBusy}
          >
            <View className="items-center gap-2">
              <View className="w-8 h-8 rounded-full border-4 border-red-500 opacity-30" />
              <Text className="text-red-500 font-bold">OFF</Text>
            </View>
          </NeumorphicButton>
        </View>

        {/* Secondary Actions (OTA, etc) - Reusing Glass Layout */}
        <GlassCard className="mb-6">
          <View className="flex-row justify-between items-center mb-4 border-b border-white/5 pb-2">
            <Text className="text-neutral-400 text-xs font-bold uppercase tracking-widest">SYSTEM ACTIONS</Text>
          </View>

          <TouchableOpacity
            onPress={handleOtaPress}
            className="flex-row items-center justify-between py-3"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-8 h-8 rounded-full bg-warning/10 items-center justify-center">
                <Zap size={16} color="#f59e0b" />
              </View>
              <View>
                <Text className="text-neutral-200 font-medium">Firmware Update</Text>
                <Text className="text-neutral-500 text-xs">OTA Flash</Text>
              </View>
            </View>
            <Text className="text-neutral-600 text-lg">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/diagnostics')} // Assuming diagnostics route exists or reused
            className="flex-row items-center justify-between py-3 border-t border-white/5"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-8 h-8 rounded-full bg-blue-500/10 items-center justify-center">
                <Activity size={16} color="#0a84ff" />
              </View>
              <View>
                <Text className="text-neutral-200 font-medium">Diagnostics</Text>
                <Text className="text-neutral-500 text-xs">Network Stats</Text>
              </View>
            </View>
            <Text className="text-neutral-600 text-lg">›</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* Debug Console */}
        <CollapsibleConsole
          logs={device.state.lastResponseText || "No response data available."}
          className="mb-8"
        />

      </ScrollView>

      {/* IP Edit Modal */}
      <Modal visible={showIpModal} transparent animationType="fade">
        <View className="flex-1 bg-black/80 items-center justify-center p-6">
          <GlassCard className="w-full max-w-sm">
            <Text className="text-white text-xl font-bold mb-4">Device IP</Text>
            <TextInput
              className="bg-surface-highlight text-white p-4 rounded-xl mb-4 text-lg font-mono"
              value={ipInput}
              onChangeText={setIpInput}
              placeholderTextColor="#525252"
              autoFocus
            />
            <View className="flex-row gap-4">
              <NeumorphicButton
                className="flex-1"
                variant="secondary"
                onPress={() => setShowIpModal(false)}
              >
                Cancel
              </NeumorphicButton>
              <NeumorphicButton
                className="flex-1"
                onPress={handleSaveIp}
              >
                Save
              </NeumorphicButton>
            </View>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
}


