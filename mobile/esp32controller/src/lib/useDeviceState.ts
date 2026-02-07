/**
 * useDeviceState - React Hook for Device State Management
 *
 * Implements the complete state model from docs/ui-state-model.md
 * Prevents race conditions and stale data automatically.
 *
 * @example
 * ```tsx
 * function MyScreen() {
 *   const device = useDeviceState('192.168.1.100');
 *
 *   return (
 *     <View>
 *       <Text>{device.connection}</Text>
 *       <Button
 *         onPress={() => device.toggleLed()}
 *         disabled={device.isBusy}
 *       />
 *     </View>
 *   );
 * }
 * ```
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { deviceClient } from './deviceClient';
import type { DeviceResult } from './deviceClient';
import {
  type DeviceScreenState,
  type DeviceCommand,
  type CommandLogEntry,
  initialDeviceScreenState,
  generateRequestId,
  createSendingState,
  createSuccessState,
  createErrorState,
  isBusy as checkIsBusy,
  getConnectionLabel,
  getConnectionColor,
  assertStateInvariants,
} from './deviceScreenState';

/**
 * Return type of useDeviceState hook
 */
export interface UseDeviceStateReturn {
  // ─── State ───────────────────────────────────────────────
  /** Current state */
  state: DeviceScreenState;

  // ─── Actions ─────────────────────────────────────────────
  /** Get device status */
  getStatus: () => Promise<void>;

  /** Toggle LED */
  toggleLed: () => Promise<void>;

  /** Turn LED on */
  turnLedOn: () => Promise<void>;

  /** Turn LED off */
  turnLedOff: () => Promise<void>;

  /** Start OTA update */
  startOtaUpdate: (firmwareUrl: string) => Promise<void>;

  /** Set device IP */
  setDeviceIp: (ip: string) => void;

  /** Clear error */
  clearError: () => void;

  /** Clear command log */
  clearCommandLog: () => void;

  // ─── Computed Values ─────────────────────────────────────
  /** Is a command currently executing? */
  isBusy: boolean;

  /** User-friendly connection label */
  connectionLabel: string;

  /** Color for connection status indicator */
  connectionColor: string;

  /** Is device online? */
  isOnline: boolean;

  /** Is device offline? */
  isOffline: boolean;
}

/**
 * Hook for managing device state with race condition prevention
 */
export function useDeviceState(
  initialIp: string = ''
): UseDeviceStateReturn {
  // ─── Core State ──────────────────────────────────────────
  const [state, setState] = useState<DeviceScreenState>({
    ...initialDeviceScreenState,
    deviceIp: initialIp,
  });

  // ─── Refs for Cleanup ────────────────────────────────────
  const abortControllerRef = useRef<AbortController | null>(null);

  // ─── Cleanup on Unmount ──────────────────────────────────
  useEffect(() => {
    return () => {
      // Cancel any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // ─── Generic Command Sender ──────────────────────────────
  const sendCommand = useCallback(
    async <T,>(
      command: DeviceCommand,
      executeRequest: (
        signal: AbortSignal
      ) => Promise<DeviceResult<T>>,
      extractResponse: (data: T) => string
    ): Promise<void> => {
      // Generate unique request ID
      const requestId = generateRequestId();

      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Update state to "sending"
      setState((prev) => {
        const newState = createSendingState(prev, command, requestId);
        if (__DEV__) assertStateInvariants(newState);
        return newState;
      });

      try {
        // Execute the request
        const result = await executeRequest(controller.signal);

        // Only apply response if not aborted and not stale
        if (!controller.signal.aborted) {
          setState((prev) => {
            if (result.ok) {
              const responseText = extractResponse(result.data);
              const newState = createSuccessState(
                prev,
                requestId,
                responseText,
                result.latencyMs
              );

              // newState is null if response is stale
              if (newState) {
                if (__DEV__) assertStateInvariants(newState);
                return newState;
              }
            } else {
              const newState = createErrorState(
                prev,
                requestId,
                result.error,
                result.errorType
              );

              // newState is null if response is stale
              if (newState) {
                if (__DEV__) assertStateInvariants(newState);
                return newState;
              }
            }

            // Return unchanged if stale
            return prev;
          });
        }
      } catch (error) {
        // Handle unexpected errors
        if (!controller.signal.aborted) {
          setState((prev) => {
            const newState = createErrorState(
              prev,
              requestId,
              error instanceof Error ? error.message : 'Unknown error',
              'network'
            );

            if (newState) {
              if (__DEV__) assertStateInvariants(newState);
              return newState;
            }

            return prev;
          });
        }
      }
    },
    []
  );

  // ─── Actions ─────────────────────────────────────────────

  const getStatus = useCallback(async () => {
    await sendCommand(
      'status',
      (signal) => deviceClient.getStatus(state.deviceIp, { signal }),
      (data) => JSON.stringify(data)
    );
  }, [state.deviceIp, sendCommand]);

  const toggleLed = useCallback(async () => {
    await sendCommand(
      'toggle',
      (signal) => deviceClient.led(state.deviceIp, 'toggle', { signal }),
      (data) => data.led
    );
  }, [state.deviceIp, sendCommand]);

  const turnLedOn = useCallback(async () => {
    await sendCommand(
      'on',
      (signal) => deviceClient.led(state.deviceIp, 'on', { signal }),
      (data) => data.led
    );
  }, [state.deviceIp, sendCommand]);

  const turnLedOff = useCallback(async () => {
    await sendCommand(
      'off',
      (signal) => deviceClient.led(state.deviceIp, 'off', { signal }),
      (data) => data.led
    );
  }, [state.deviceIp, sendCommand]);

  const startOtaUpdate = useCallback(
    async (firmwareUrl: string) => {
      await sendCommand(
        'ota',
        (signal) =>
          deviceClient.otaUpdate(state.deviceIp, firmwareUrl, { signal }),
        (data) => data.message || 'OTA update started'
      );
    },
    [state.deviceIp, sendCommand]
  );

  const setDeviceIp = useCallback((ip: string) => {
    setState((prev) => ({ ...prev, deviceIp: ip }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const clearCommandLog = useCallback(() => {
    setState((prev) => ({ ...prev, commandLog: [] }));
  }, []);

  // ─── Computed Values ─────────────────────────────────────

  const isBusy = checkIsBusy(state);
  const connectionLabel = getConnectionLabel(state.connection);
  const connectionColor = getConnectionColor(state.connection);
  const isOnline = state.connection === 'online';
  const isOffline = state.connection === 'offline';

  // ─── Return ──────────────────────────────────────────────

  return {
    state,
    getStatus,
    toggleLed,
    turnLedOn,
    turnLedOff,
    startOtaUpdate,
    setDeviceIp,
    clearError,
    clearCommandLog,
    isBusy,
    connectionLabel,
    connectionColor,
    isOnline,
    isOffline,
  };
}

/**
 * Example: Component using the hook
 *
 * @example
 * ```tsx
 * import { useDeviceState } from '@/src/lib/useDeviceState';
 *
 * export default function DeviceScreen() {
 *   const device = useDeviceState('192.168.1.100');
 *
 *   return (
 *     <View style={styles.container}>
 *       {/\* Connection Status *\/}
 *       <View style={{ backgroundColor: device.connectionColor }}>
 *         <Text>{device.connectionLabel}</Text>
 *       </View>
 *
 *       {/\* Last Response *\/}
 *       <Text>LED: {device.state.lastResponseText}</Text>
 *       <Text>Latency: {device.state.lastLatencyMs}ms</Text>
 *
 *       {/\* Controls *\/}
 *       <Button
 *         title={device.isBusy ? 'Sending...' : 'Toggle LED'}
 *         onPress={device.toggleLed}
 *         disabled={device.isBusy}
 *       />
 *
 *       <Button
 *         title="LED On"
 *         onPress={device.turnLedOn}
 *         disabled={device.isBusy}
 *       />
 *
 *       <Button
 *         title="LED Off"
 *         onPress={device.turnLedOff}
 *         disabled={device.isBusy}
 *       />
 *
 *       {/\* Error Display *\/}
 *       {device.state.error && (
 *         <View style={styles.errorBox}>
 *           <Text style={styles.errorText}>{device.state.error}</Text>
 *           <Button title="Dismiss" onPress={device.clearError} />
 *         </View>
 *       )}
 *
 *       {/\* Command Log *\/}
 *       <Text>Recent Commands:</Text>
 *       {device.state.commandLog.map((entry) => (
 *         <CommandLogItem key={entry.id} entry={entry} />
 *       ))}
 *     </View>
 *   );
 * }
 * ```
 */

/**
 * Example: Command log item component
 */
export function CommandLogItem({ entry }: { entry: CommandLogEntry }) {
  const statusIcons = {
    pending: '⏳',
    success: '✅',
    error: '❌',
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <div style={{ padding: 8, borderBottom: '1px solid #ccc' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span>{statusIcons[entry.status]}</span>
        <span>{formatTime(entry.timestamp)}</span>
        <span>{entry.command}</span>
        {entry.latencyMs && <span>{entry.latencyMs}ms</span>}
      </div>
      {entry.errorMessage && (
        <div style={{ color: 'red', fontSize: 12 }}>
          {entry.errorMessage}
        </div>
      )}
      {entry.responseText && (
        <div style={{ color: 'green', fontSize: 12 }}>
          {entry.responseText}
        </div>
      )}
    </div>
  );
}
