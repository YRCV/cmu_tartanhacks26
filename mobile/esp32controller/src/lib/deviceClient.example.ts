/**
 * Device Client Usage Examples
 *
 * This file demonstrates how to use the deviceClient in your React Native app.
 * Copy these patterns into your components.
 */

import { useState } from 'react';
import { Alert } from 'react-native';
import {
  createClient,
  getStatus,
  led,
  otaUpdate,
  isValidIP,
  parseLedState,
  getUserFriendlyError,
  type DeviceResponse,
  type LedCommand,
} from './deviceClient';

// ============================================================================
// Example 1: Basic Usage (Direct API)
// ============================================================================

export async function example1_BasicUsage() {
  const espIP = '192.168.1.100';

  // Check status
  const statusResult = await getStatus(espIP);
  if (statusResult.ok) {
    console.log('ESP32 is online!');
    console.log('Response:', statusResult.rawText);
    console.log('Latency:', statusResult.latencyMs, 'ms');
  } else {
    console.error('Failed:', statusResult.error);
    console.error('Error type:', statusResult.errorType);
  }

  // Control LED
  const ledResult = await led(espIP, 'toggle');
  if (ledResult.ok) {
    const state = parseLedState(ledResult.rawText);
    console.log('LED is now:', state);
  } else {
    Alert.alert('Error', getUserFriendlyError(ledResult));
  }

  // OTA Update (with extended timeout)
  const otaResult = await otaUpdate(
    espIP,
    'http://192.168.1.50:8000/firmware.bin',
    { timeoutMs: 30000 }
  );

  if (otaResult.ok) {
    console.log('OTA started! Device will reboot...');
    // Wait before reconnecting
    await sleep(10000);
    await getStatus(espIP);
  }
}

// ============================================================================
// Example 2: Using Mock Client for UI Development
// ============================================================================

export function example2_MockMode() {
  // Toggle this flag to switch between real and mock mode
  const USE_MOCK = true; // Set to false for real hardware
  const client = createClient(USE_MOCK);

  // Now use client API - works identically in both modes!
  return {
    checkHealth: async (ip: string) => {
      return await client.getStatus(ip);
    },

    toggleLed: async (ip: string) => {
      return await client.led(ip, 'toggle');
    },

    updateFirmware: async (ip: string, firmwareUrl: string) => {
      return await client.otaUpdate(ip, firmwareUrl, { timeoutMs: 30000 });
    },
  };
}

// ============================================================================
// Example 3: React Component Integration
// ============================================================================

export function useESP32Connection(espIP: string, useMock: boolean = false) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'online' | 'error'>('idle');
  const [lastResponse, setLastResponse] = useState<string>('');
  const [latency, setLatency] = useState<number>(0);

  const client = createClient(useMock);

  const connect = async () => {
    if (!isValidIP(espIP)) {
      Alert.alert('Invalid IP', 'Please enter a valid IP address (e.g., 192.168.1.100)');
      return;
    }

    setStatus('connecting');

    const result = await client.getStatus(espIP);

    if (result.ok) {
      setStatus('online');
      setLastResponse(result.rawText);
      setLatency(result.latencyMs);
    } else {
      setStatus('error');
      Alert.alert('Connection Failed', getUserFriendlyError(result));
    }
  };

  const sendLedCommand = async (command: LedCommand) => {
    if (status !== 'online') {
      Alert.alert('Not Connected', 'Please connect to ESP32 first');
      return;
    }

    const result = await client.led(espIP, command);

    if (result.ok) {
      setLastResponse(result.rawText);
      setLatency(result.latencyMs);

      // Parse LED state from response
      const ledState = parseLedState(result.rawText);
      return ledState;
    } else {
      Alert.alert('Command Failed', getUserFriendlyError(result));
      return 'unknown';
    }
  };

  return {
    status,
    lastResponse,
    latency,
    connect,
    sendLedCommand,
  };
}

// ============================================================================
// Example 4: Request Cancellation
// ============================================================================

export function useCancellationExample() {
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const startLongRequest = async (espIP: string) => {
    // Create abort controller
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const result = await otaUpdate(
        espIP,
        'http://example.com/firmware.bin',
        {
          timeoutMs: 30000,
          signal: controller.signal, // Pass signal for cancellation
        }
      );

      if (result.ok) {
        console.log('OTA completed');
      } else if (result.errorType === 'cancelled') {
        console.log('User cancelled the request');
      } else {
        console.error('OTA failed:', result.error);
      }
    } finally {
      setAbortController(null);
    }
  };

  const cancelRequest = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
  };

  return { startLongRequest, cancelRequest };
}

// ============================================================================
// Example 5: Robust Error Handling
// ============================================================================

export async function example5_ErrorHandling(espIP: string) {
  const result = await led(espIP, 'toggle');

  if (result.ok) {
    // Success case
    console.log('✅ Success:', result.rawText);
    return { success: true, state: parseLedState(result.rawText) };
  }

  // Error case - handle different error types
  switch (result.errorType) {
    case 'timeout':
      Alert.alert(
        'Connection Timeout',
        'ESP32 is not responding. Please check:\n' +
        '• ESP32 is powered on\n' +
        '• Connected to WiFi\n' +
        '• IP address is correct'
      );
      break;

    case 'network':
      Alert.alert(
        'Network Error',
        'Cannot connect to ESP32. Please verify:\n' +
        '• IP address is correct\n' +
        '• ESP32 and phone are on same network\n' +
        '• No firewall blocking connection'
      );
      break;

    case 'http':
      if (result.statusCode === 404) {
        Alert.alert(
          'Feature Not Available',
          'This command is not supported by your ESP32 firmware. ' +
          'Please update to the latest firmware version.'
        );
      } else {
        Alert.alert('HTTP Error', `Server returned error: ${result.statusCode}`);
      }
      break;

    case 'validation':
      Alert.alert('Invalid Input', result.error);
      break;

    default:
      Alert.alert('Error', getUserFriendlyError(result));
  }

  return { success: false, error: result.error };
}

// ============================================================================
// Example 6: Retry Logic
// ============================================================================

export async function example6_RetryLogic(
  espIP: string,
  maxRetries: number = 3
): Promise<DeviceResponse> {
  let lastError: DeviceResponse | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`Attempt ${attempt}/${maxRetries}...`);

    const result = await getStatus(espIP);

    if (result.ok) {
      console.log(`✅ Success on attempt ${attempt}`);
      return result;
    }

    lastError = result;

    // Don't retry validation errors
    if (result.errorType === 'validation') {
      break;
    }

    // Don't retry HTTP 404
    if (result.errorType === 'http' && result.statusCode === 404) {
      break;
    }

    // Wait before retrying (exponential backoff)
    if (attempt < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      console.log(`Waiting ${delay}ms before retry...`);
      await sleep(delay);
    }
  }

  console.error(`❌ All ${maxRetries} attempts failed`);
  return lastError!;
}

// ============================================================================
// Example 7: Polling for Status
// ============================================================================

export function usePollingExample() {
  const [polling, setPolling] = useState(false);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  const startPolling = (espIP: string, intervalMs: number = 1000) => {
    if (polling) return;

    const id = setInterval(async () => {
      const result = await getStatus(espIP);

      if (result.ok) {
        console.log('[Poll]', result.rawText, `(${result.latencyMs}ms)`);
      } else {
        console.error('[Poll] Failed:', result.error);
        // Optionally stop polling on persistent errors
        if (result.errorType === 'network') {
          stopPolling();
        }
      }
    }, intervalMs);

    setIntervalId(id);
    setPolling(true);
  };

  const stopPolling = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
      setPolling(false);
    }
  };

  return { startPolling, stopPolling, isPolling: polling };
}

// ============================================================================
// Utilities
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// Example 8: Full Component Example
// ============================================================================

/**
 * Complete example showing how to refactor existing component to use deviceClient
 *
 * BEFORE (from index.tsx):
 * ```
 * const baseUrl = useMemo(() => `http://${espIp}`, [espIp]); // ❌ Missing backticks!
 * const res = await axios.get(url, { timeout: timeoutMs });
 * ```
 *
 * AFTER (using deviceClient):
 */
export function Example8_RefactoredComponent() {
  const [espIp, setEspIp] = useState('192.168.1.100');
  const [useMock, setUseMock] = useState(false);
  const [busy, setBusy] = useState(false);

  const client = createClient(useMock);

  const handleConnect = async () => {
    setBusy(true);

    const result = await client.getStatus(espIp);

    if (result.ok) {
      Alert.alert(
        'Connected!',
        `${result.rawText}\n\nLatency: ${result.latencyMs}ms`
      );
    } else {
      Alert.alert('Connection Failed', getUserFriendlyError(result));
    }

    setBusy(false);
  };

  const handleToggleLed = async () => {
    setBusy(true);

    const result = await client.led(espIp, 'toggle');

    if (result.ok) {
      const state = parseLedState(result.rawText);
      Alert.alert('Success', `LED is now ${state.toUpperCase()}`);
    } else {
      Alert.alert('Error', getUserFriendlyError(result));
    }

    setBusy(false);
  };

  return {
    espIp,
    setEspIp,
    useMock,
    setUseMock,
    busy,
    handleConnect,
    handleToggleLed,
  };
}
