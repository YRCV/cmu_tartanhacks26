/**
 * Device Screen State Model
 *
 * Prevents "UI lies" by tracking request IDs and ensuring
 * only the latest response updates the UI.
 *
 * See docs/ui-state-model.md for complete documentation.
 */

/**
 * Connection status with the ESP32 device
 */
export type ConnectionStatus = 'unknown' | 'online' | 'offline';

/**
 * Commands that can be sent to the device
 */
export type DeviceCommand = 'status' | 'toggle' | 'on' | 'off' | 'ota';

/**
 * Status of a command in the log
 */
export type CommandStatus = 'pending' | 'success' | 'error';

/**
 * Single entry in the command log
 */
export interface CommandLogEntry {
  /** Unique request ID (e.g., "req_1707268800_abc123") */
  id: string;

  /** Command that was executed */
  command: DeviceCommand;

  /** When the command was sent */
  timestamp: Date;

  /** Current status of the command */
  status: CommandStatus;

  /** Response text (only for success) */
  responseText?: string;

  /** Request latency in milliseconds (only for success) */
  latencyMs?: number;

  /** Error message (only for error) */
  errorMessage?: string;
}

/**
 * Core UI state for device interaction
 *
 * This model prevents race conditions and stale data by:
 * 1. Tracking the latest request ID
 * 2. Only applying responses that match the latest request
 * 3. Maintaining immutable command history
 */
export interface DeviceScreenState {
  // ─── Device Configuration ────────────────────────────────

  /** IP address of the ESP32 device (e.g., "192.168.1.100") */
  deviceIp: string;

  // ─── Connection Status ───────────────────────────────────

  /** Current connection status */
  connection: ConnectionStatus;

  // ─── Current Operation ───────────────────────────────────

  /**
   * Currently executing command (null when idle)
   * Used to disable UI controls during request
   */
  busyCommand: DeviceCommand | null;

  // ─── Last Successful Response ────────────────────────────

  /** Raw response text from last successful request */
  lastResponseText: string;

  /** Latency of last successful request in milliseconds */
  lastLatencyMs: number;

  /** Timestamp of last successful response */
  lastUpdatedAt: Date | null;

  // ─── Command History ─────────────────────────────────────

  /**
   * Last 10 commands (newest first)
   * Used for debugging and showing user feedback
   */
  commandLog: CommandLogEntry[];

  // ─── Request Tracking ────────────────────────────────────

  /**
   * ID of the most recent request
   * CRITICAL: Only apply responses matching this ID
   * Prevents race conditions when multiple requests are in flight
   */
  latestRequestId: string | null;

  // ─── Error State ─────────────────────────────────────────

  /** Current error message (null when no error) */
  error: string | null;
}

/**
 * Initial state for device screen
 */
export const initialDeviceScreenState: DeviceScreenState = {
  deviceIp: '',
  connection: 'unknown',
  busyCommand: null,
  lastResponseText: '',
  lastLatencyMs: 0,
  lastUpdatedAt: null,
  commandLog: [],
  latestRequestId: null,
  error: null,
};

/**
 * Generate unique request ID
 *
 * Format: req_<timestamp>_<random>
 * Example: "req_1707268800_abc123"
 */
export function generateRequestId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `req_${timestamp}_${random}`;
}

/**
 * Check if a response is stale (not the latest request)
 */
export function isStaleResponse(
  responseId: string,
  state: DeviceScreenState
): boolean {
  return responseId !== state.latestRequestId;
}

/**
 * Add new entry to command log (keeps last 10)
 */
export function addToCommandLog(
  currentLog: CommandLogEntry[],
  entry: CommandLogEntry
): CommandLogEntry[] {
  return [entry, ...currentLog.slice(0, 9)];
}

/**
 * Update existing entry in command log
 */
export function updateCommandLogEntry(
  currentLog: CommandLogEntry[],
  requestId: string,
  updates: Partial<CommandLogEntry>
): CommandLogEntry[] {
  return currentLog.map((entry) =>
    entry.id === requestId ? { ...entry, ...updates } : entry
  );
}

/**
 * Create a pending command log entry
 */
export function createPendingLogEntry(
  requestId: string,
  command: DeviceCommand
): CommandLogEntry {
  return {
    id: requestId,
    command,
    timestamp: new Date(),
    status: 'pending',
  };
}

/**
 * Determine connection status from device result
 */
export function getConnectionStatus(result: {
  ok: boolean;
  errorType?: string;
}): ConnectionStatus {
  if (result.ok) {
    return 'online';
  }

  // Check error type
  switch (result.errorType) {
    case 'timeout':
    case 'network':
      return 'offline';

    case 'cors':
    case 'http':
    case 'parse':
      // Device responded, but with error
      return 'online';

    case 'validation':
      // Invalid input, connection unknown
      return 'unknown';

    default:
      return 'offline';
  }
}

/**
 * Check if the screen is busy (request in progress)
 */
export function isBusy(state: DeviceScreenState): boolean {
  return state.busyCommand !== null;
}

/**
 * Get user-friendly connection status label
 */
export function getConnectionLabel(status: ConnectionStatus): string {
  const labels: Record<ConnectionStatus, string> = {
    online: '🟢 Connected',
    offline: '🔴 Offline',
    unknown: '⚪ Unknown',
  };
  return labels[status];
}

/**
 * Get color for connection status
 */
export function getConnectionColor(status: ConnectionStatus): string {
  const colors: Record<ConnectionStatus, string> = {
    online: '#4ade80', // green
    offline: '#f87171', // red
    unknown: '#9ca3af', // gray
  };
  return colors[status];
}

/**
 * Format timestamp for display
 */
export function formatCommandTimestamp(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Get emoji icon for command status
 */
export function getStatusIcon(status: CommandStatus): string {
  const icons: Record<CommandStatus, string> = {
    pending: '⏳',
    success: '✅',
    error: '❌',
  };
  return icons[status];
}

/**
 * State machine invariants (for debugging/testing)
 */
export function assertStateInvariants(state: DeviceScreenState): void {
  // Invariant 1: If busy, must have request ID
  if (state.busyCommand !== null && state.latestRequestId === null) {
    throw new Error('Invariant violation: busy but no request ID');
  }

  // Invariant 2: Command log is never longer than 10
  if (state.commandLog.length > 10) {
    throw new Error('Invariant violation: command log too long');
  }

  // Invariant 3: If lastUpdatedAt is set, lastResponseText must be non-empty
  if (state.lastUpdatedAt !== null && state.lastResponseText === '') {
    console.warn(
      'Warning: lastUpdatedAt set but no response text (OTA command?)'
    );
  }
}

/**
 * Type guard: Check if error type indicates device is offline
 */
export function isOfflineError(errorType?: string): boolean {
  return errorType === 'timeout' || errorType === 'network';
}

/**
 * Type guard: Check if error type indicates device is online but erroring
 */
export function isOnlineError(errorType?: string): boolean {
  return (
    errorType === 'cors' || errorType === 'http' || errorType === 'parse'
  );
}

/**
 * Get user-friendly error message based on error type
 */
export function getUserFriendlyErrorMessage(
  errorType?: string,
  originalError?: string
): string {
  switch (errorType) {
    case 'timeout':
      return 'Device not responding. Check your WiFi connection.';
    case 'network':
      return 'Cannot reach device. Is it powered on?';
    case 'cors':
      return 'CORS error. This may happen in web browsers.';
    case 'http':
      return 'Device returned an error. Try again.';
    case 'parse':
      return 'Received invalid response from device.';
    case 'validation':
      return 'Invalid IP address or URL.';
    default:
      return originalError || 'An unknown error occurred.';
  }
}

/**
 * Example: Complete state update for sending a command
 */
export function createSendingState(
  currentState: DeviceScreenState,
  command: DeviceCommand,
  requestId: string
): DeviceScreenState {
  return {
    ...currentState,
    busyCommand: command,
    latestRequestId: requestId,
    error: null,
    commandLog: addToCommandLog(
      currentState.commandLog,
      createPendingLogEntry(requestId, command)
    ),
  };
}

/**
 * Example: Complete state update for successful response
 */
export function createSuccessState(
  currentState: DeviceScreenState,
  requestId: string,
  responseText: string,
  latencyMs: number
): DeviceScreenState | null {
  // Check if stale
  if (isStaleResponse(requestId, currentState)) {
    console.warn('Ignoring stale response:', requestId);
    return null;
  }

  return {
    ...currentState,
    connection: 'online',
    busyCommand: null,
    lastResponseText: responseText,
    lastLatencyMs: latencyMs,
    lastUpdatedAt: new Date(),
    error: null,
    commandLog: updateCommandLogEntry(currentState.commandLog, requestId, {
      status: 'success',
      responseText,
      latencyMs,
    }),
  };
}

/**
 * Example: Complete state update for error response
 */
export function createErrorState(
  currentState: DeviceScreenState,
  requestId: string,
  error: string,
  errorType?: string
): DeviceScreenState | null {
  // Check if stale
  if (isStaleResponse(requestId, currentState)) {
    console.warn('Ignoring stale error:', requestId);
    return null;
  }

  return {
    ...currentState,
    connection: getConnectionStatus({ ok: false, errorType }),
    busyCommand: null,
    error: getUserFriendlyErrorMessage(errorType, error),
    commandLog: updateCommandLogEntry(currentState.commandLog, requestId, {
      status: 'error',
      errorMessage: error,
    }),
  };
}
