/**
 * Diagnostics Screen
 * 
 * Tools for testing connectivity, mocking, and debugging.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { mockControls, isMockMode, getDeviceClient } from '@/src/lib/deviceClient.mock';

import deviceClient from '@/src/lib/deviceClient';

export default function DiagnosticsScreen() {
  const router = useRouter();
  const [deviceIp, setDeviceIp] = useState('192.168.1.100');
  const [logs, setLogs] = useState<string[]>([]);

  // Mock State
  const [useMock, setUseMock] = useState(isMockMode());
  const [mockOnline, setMockOnline] = useState(true);
  const [mockLatency, setMockLatency] = useState('50');

  // Add log
  const log = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  };

  // Ping Test
  const handlePing = async () => {
    log(`Pinging ${deviceIp}...`);
    try {
      const client = useMock ? getDeviceClient() : deviceClient;
      const result = await client.getStatus(deviceIp, { timeoutMs: 3000 });

      if (result.ok) {
        log(`✅ Success (${result.latencyMs}ms): ${result.rawText}`);
      } else {
        log(`❌ Failed (${result.latencyMs}ms): ${result.error} [${result.errorType}]`);
      }
    } catch (e) {
      log(`🔥 Exception: ${e}`);
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
    <View className="flex-1 bg-background">
      <View className="p-4 border-b border-border bg-surface flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary text-base">← Back</Text>
        </TouchableOpacity>
        <Text className="text-text-primary text-xl font-bold">Diagnostics</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 p-4">

        {/* Environment Info */}
        <View className="bg-surface p-4 rounded-card mb-4 border border-border">
          <Text className="text-text-secondary text-xs uppercase mb-2">Environment</Text>
          <View className="flex-row justify-between mb-2">
            <Text className="text-text-primary">Mock Mode (Env)</Text>
            <Text className={isMockMode() ? "text-success" : "text-text-disabled"}>
              {isMockMode() ? 'ENABLED' : 'DISABLED'}
            </Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-text-primary">Force Mock</Text>
            <Switch value={useMock} onValueChange={setUseMock} />
          </View>
        </View>

        {/* Mock Controls */}
        {useMock && (
          <View className="bg-surface p-4 rounded-card mb-4 border border-border">
            <Text className="text-text-secondary text-xs uppercase mb-2">Mock Controls</Text>
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-text-primary">Device Online</Text>
              <Switch value={mockOnline} onValueChange={setMockOnline} />
            </View>
            <View>
              <Text className="text-text-primary mb-2">Base Latency (ms)</Text>
              <TextInput
                className="bg-background border border-border rounded p-2 text-text-primary"
                value={mockLatency}
                onChangeText={setMockLatency}
                keyboardType="numeric"
              />
            </View>
          </View>
        )}

        {/* Connectivity Test */}
        <View className="bg-surface p-4 rounded-card mb-4 border border-border">
          <Text className="text-text-secondary text-xs uppercase mb-2">Connectivity Test</Text>
          <TextInput
            className="bg-background border border-border rounded p-2 text-text-primary mb-4"
            value={deviceIp}
            onChangeText={setDeviceIp}
            placeholder="Device IP"
            placeholderTextColor="#666"
          />
          <TouchableOpacity
            className="bg-primary p-3 rounded-button items-center"
            onPress={handlePing}
          >
            <Text className="text-white font-semibold">Ping Device</Text>
          </TouchableOpacity>
        </View>

        {/* Logs */}
        <View className="bg-surface p-4 rounded-card mb-4 border border-border">
          <View className="flex-row justify-between mb-2">
            <Text className="text-text-secondary text-xs uppercase">Logs</Text>
            <TouchableOpacity onPress={() => setLogs([])}>
              <Text className="text-primary text-xs">Clear</Text>
            </TouchableOpacity>
          </View>
          <View className="bg-background p-2 rounded h-60">
            <ScrollView nestedScrollEnabled>
              {logs.length === 0 && <Text className="text-text-disabled text-xs italic">No logs yet...</Text>}
              {logs.map((L, i) => (
                <Text key={i} className="text-text-primary text-xs font-mono mb-1">{L}</Text>
              ))}
            </ScrollView>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}
