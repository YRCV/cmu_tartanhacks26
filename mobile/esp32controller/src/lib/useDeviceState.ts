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
import {
  getStatus as getDeviceStatus,
  led,
  otaUpdate,
  parseLedState,
  type DeviceResponse,
} from './deviceClient';
import type {
  DeviceScreenState,
  DeviceCommand,
} from './deviceScreenState';
import {
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
    async (
      command: DeviceCommand,
      executeRequest: (
        signal: AbortSignal
      ) => Promise<DeviceResponse>,
      extractResponse: (rawText: string) => string
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
              const responseText = extractResponse(result.rawText);
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
      (signal) => getDeviceStatus(state.deviceIp, { signal }),
      (rawText) => rawText
    );
  }, [state.deviceIp, sendCommand]);

  const toggleLed = useCallback(async () => {
    await sendCommand(
      'toggle',
      (signal) => led(state.deviceIp, 'toggle', { signal }),
      (rawText) => parseLedState(rawText)
    );
  }, [state.deviceIp, sendCommand]);

  const turnLedOn = useCallback(async () => {
    await sendCommand(
      'on',
      (signal) => led(state.deviceIp, 'on', { signal }),
      (rawText) => parseLedState(rawText)
    );
  }, [state.deviceIp, sendCommand]);

  const turnLedOff = useCallback(async () => {
    await sendCommand(
      'off',
      (signal) => led(state.deviceIp, 'off', { signal }),
      (rawText) => parseLedState(rawText)
    );
  }, [state.deviceIp, sendCommand]);

  const startOtaUpdate = useCallback(
    async (firmwareUrl: string) => {
      await sendCommand(
        'ota',
        (signal) =>
          otaUpdate(state.deviceIp, firmwareUrl, { signal }),
        (rawText) => rawText || 'OTA update started'
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
