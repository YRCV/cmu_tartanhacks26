/**
 * ESP32 Device Client
 *
 * A mockable, type-safe HTTP client for communicating with ESP32 devices.
 * Provides URL validation, timeout support, cancellation, and normalized responses.
 *
 * Key Features:
 * - Safe URL building with template literals (fixes common string concatenation bugs)
 * - IP address validation before making requests
 * - Normalized response shape for consistent error handling
 * - Latency tracking for monitoring network performance
 * - AbortController support for request cancellation
 * - Mock mode for UI development without hardware
 *
 * @see ../docs/ui-contract.md for API contract details
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Successful response from ESP32
 */
export type DeviceSuccess = {
  ok: true;
  rawText: string;
  latencyMs: number;
};

/**
 * Failed response (network error, timeout, HTTP error, etc.)
 */
export type DeviceError = {
  ok: false;
  error: string;
  errorType: 'timeout' | 'network' | 'http' | 'validation' | 'cancelled' | 'unknown';
  latencyMs: number;
  statusCode?: number;
};

/**
 * Normalized response type - always has ok field for discriminated union
 */
export type DeviceResponse = DeviceSuccess | DeviceError;

/**
 * LED command types
 */
export type LedCommand = 'toggle' | 'on' | 'off';

/**
 * Options for device requests
 */
export type RequestOptions = {
  /** Timeout in milliseconds (default: 5000ms) */
  timeoutMs?: number;
  /** AbortController signal for manual cancellation */
  signal?: AbortSignal;
};

// ============================================================================
// Validation
// ============================================================================

/**
 * Validates an IPv4 address format
 * Checks both format (x.x.x.x) and range (0-255 per octet)
 *
 * @example
 * isValidIP('192.168.1.100') // true
 * isValidIP('256.1.1.1')     // false (out of range)
 * isValidIP('192.168.1')     // false (incomplete)
 */
export function isValidIP(ip: string): boolean {
  if (!ip || typeof ip !== 'string') return false;

  // Check format: xxx.xxx.xxx.xxx
  const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = ip.match(ipRegex);

  if (!match) return false;

  // Check range: each octet must be 0-255
  const octets = match.slice(1, 5).map(Number);
  return octets.every(octet => octet >= 0 && octet <= 255);
}

/**
 * Validates a URL format (basic check for http/https)
 *
 * @example
 * isValidURL('http://192.168.1.100/firmware.bin') // true
 * isValidURL('https://example.com/test')          // true
 * isValidURL('ftp://invalid')                     // false
 */
export function isValidURL(url: string): boolean {
  if (!url || typeof url !== 'string') return false;

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Builds a safe URL with proper template literal handling
 * IMPORTANT: This fixes the common bug of forgetting backticks in template literals
 *
 * @example
 * buildURL('192.168.1.100', '/led/on')           // 'http://192.168.1.100/led/on'
 * buildURL('192.168.1.100', '/ota/update', {url: 'http://...'})
 */
function buildURL(ip: string, path: string, queryParams?: Record<string, string>): string {
  // Note: Using template literal with backticks - this is critical!
  let url = `http://${ip}${path}`;

  if (queryParams) {
    const params = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, value]) => {
      params.append(key, value);
    });
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  return url;
}

// ============================================================================
// HTTP Client
// ============================================================================

/**
 * Makes a GET request to the ESP32 with timeout and error handling
 * Returns normalized response with latency tracking
 *
 * @param url - Full URL to request
 * @param options - Request options (timeout, abort signal)
 * @returns Normalized response with ok discriminator
 */
async function makeRequest(
  url: string,
  options?: RequestOptions
): Promise<DeviceResponse> {
  const timeoutMs = options?.timeoutMs ?? 5000;
  const startTime = Date.now();

  // Create combined abort controller for timeout + manual cancellation
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);

  // If user provided signal, listen for it too
  if (options?.signal) {
    options.signal.addEventListener('abort', () => abortController.abort());
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: abortController.signal,
      headers: {
        'Accept': 'text/plain',
      },
    });

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    // Handle HTTP errors (4xx, 5xx)
    if (!response.ok) {
      return {
        ok: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        errorType: 'http',
        statusCode: response.status,
        latencyMs,
      };
    }

    // Success - read response text
    const rawText = await response.text();

    return {
      ok: true,
      rawText,
      latencyMs,
    };

  } catch (error: unknown) {
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    // Categorize error types for better UI handling
    if (error instanceof Error) {
      // Timeout or manual cancellation
      if (error.name === 'AbortError') {
        const wasCancelled = options?.signal?.aborted;
        return {
          ok: false,
          error: wasCancelled ? 'Request cancelled' : 'Request timed out',
          errorType: wasCancelled ? 'cancelled' : 'timeout',
          latencyMs,
        };
      }

      // Network errors (ECONNREFUSED, ENOTFOUND, etc.)
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return {
          ok: false,
          error: 'Network error - check ESP32 connection',
          errorType: 'network',
          latencyMs,
        };
      }

      // Generic error with message
      return {
        ok: false,
        error: error.message,
        errorType: 'unknown',
        latencyMs,
      };
    }

    // Unknown error type
    return {
      ok: false,
      error: 'Unknown error occurred',
      errorType: 'unknown',
      latencyMs,
    };
  }
}

// ============================================================================
// Device Client API
// ============================================================================

/**
 * Gets status/health check from ESP32 root endpoint
 *
 * @param ip - ESP32 IP address (e.g., '192.168.1.100')
 * @param options - Request options
 * @returns Response with status text or error
 *
 * @example
 * const result = await getStatus('192.168.1.100');
 * if (result.ok) {
 *   console.log('Status:', result.rawText);
 *   console.log('Latency:', result.latencyMs, 'ms');
 * } else {
 *   console.error('Error:', result.error);
 * }
 */
export async function getStatus(
  ip: string,
  options?: RequestOptions
): Promise<DeviceResponse> {
  // Validate IP before making request
  if (!isValidIP(ip)) {
    return {
      ok: false,
      error: 'Invalid IP address format',
      errorType: 'validation',
      latencyMs: 0,
    };
  }

  const url = buildURL(ip, '/');
  return makeRequest(url, options);
}

/**
 * Sends LED command to ESP32
 *
 * @param ip - ESP32 IP address
 * @param command - LED command ('toggle' | 'on' | 'off')
 * @param options - Request options
 * @returns Response with command result or error
 *
 * @example
 * const result = await led('192.168.1.100', 'toggle');
 * if (result.ok) {
 *   const isOn = result.rawText.includes('ON');
 *   console.log('LED is now:', isOn ? 'ON' : 'OFF');
 * }
 */
export async function led(
  ip: string,
  command: LedCommand,
  options?: RequestOptions
): Promise<DeviceResponse> {
  // Validate IP
  if (!isValidIP(ip)) {
    return {
      ok: false,
      error: 'Invalid IP address format',
      errorType: 'validation',
      latencyMs: 0,
    };
  }

  // Validate command
  const validCommands: LedCommand[] = ['toggle', 'on', 'off'];
  if (!validCommands.includes(command)) {
    return {
      ok: false,
      error: `Invalid LED command: ${command}. Must be 'toggle', 'on', or 'off'`,
      errorType: 'validation',
      latencyMs: 0,
    };
  }

  const url = buildURL(ip, `/led/${command}`);
  return makeRequest(url, options);
}

/**
 * Triggers OTA firmware update on ESP32
 *
 * IMPORTANT: This operation takes 10-30 seconds and will cause ESP32 to reboot
 * Use extended timeout (30000ms recommended)
 *
 * @param ip - ESP32 IP address
 * @param firmwareUrl - Full URL to firmware .bin file
 * @param options - Request options (recommend timeoutMs: 30000)
 * @returns Response indicating update started or error
 *
 * @example
 * const result = await otaUpdate(
 *   '192.168.1.100',
 *   'http://192.168.1.50:8000/firmware.bin',
 *   { timeoutMs: 30000 }
 * );
 *
 * if (result.ok) {
 *   console.log('OTA started! ESP32 will reboot...');
 *   // Wait 5-10 seconds before attempting to reconnect
 * }
 */
export async function otaUpdate(
  ip: string,
  firmwareUrl: string,
  options?: RequestOptions
): Promise<DeviceResponse> {
  // Validate IP
  if (!isValidIP(ip)) {
    return {
      ok: false,
      error: 'Invalid IP address format',
      errorType: 'validation',
      latencyMs: 0,
    };
  }

  // Validate firmware URL
  if (!isValidURL(firmwareUrl)) {
    return {
      ok: false,
      error: 'Invalid firmware URL - must be http:// or https://',
      errorType: 'validation',
      latencyMs: 0,
    };
  }

  // Use extended timeout for OTA (default 30s if not specified)
  const otaOptions: RequestOptions = {
    ...options,
    timeoutMs: options?.timeoutMs ?? 30000,
  };

  const url = buildURL(ip, '/ota/update', { url: firmwareUrl });
  return makeRequest(url, otaOptions);
}

// ============================================================================
// Mock Client (for UI development without hardware)
// ============================================================================

/**
 * Mock device client for UI development
 * Simulates ESP32 responses without actual hardware
 */
export const mockClient = {
  /**
   * Mock status check - always succeeds with simulated response
   */
  async getStatus(
    _ip: string,
    _options?: RequestOptions
  ): Promise<DeviceResponse> {
    await sleep(150 + Math.random() * 100); // Simulate network latency

    return {
      ok: true,
      rawText: 'ESP32 is running! LED Status: OFF',
      latencyMs: 150,
    };
  },

  /**
   * Mock LED command - simulates state changes
   */
  async led(
    _ip: string,
    command: LedCommand,
    _options?: RequestOptions
  ): Promise<DeviceResponse> {
    await sleep(100 + Math.random() * 150);

    const responses: Record<LedCommand, string> = {
      on: 'LED is now ON',
      off: 'LED is now OFF',
      toggle: Math.random() > 0.5 ? 'LED toggled to ON' : 'LED toggled to OFF',
    };

    return {
      ok: true,
      rawText: responses[command],
      latencyMs: 125,
    };
  },

  /**
   * Mock OTA update - simulates long-running operation
   */
  async otaUpdate(
    _ip: string,
    firmwareUrl: string,
    _options?: RequestOptions
  ): Promise<DeviceResponse> {
    // Validate URL even in mock mode
    if (!isValidURL(firmwareUrl)) {
      return {
        ok: false,
        error: 'Invalid firmware URL - must be http:// or https://',
        errorType: 'validation',
        latencyMs: 0,
      };
    }

    await sleep(2000 + Math.random() * 1000); // Simulate OTA delay

    return {
      ok: true,
      rawText: 'OTA Update started...',
      latencyMs: 2500,
    };
  },
};

/**
 * Creates a device client with optional mock mode
 *
 * @param useMock - If true, returns mock client for UI development
 * @returns Device client API
 *
 * @example
 * // Production mode
 * const client = createClient(false);
 *
 * // Mock mode for UI dev
 * const client = createClient(true);
 *
 * // Both have same API
 * const result = await client.led('192.168.1.100', 'toggle');
 */
export function createClient(useMock: boolean = false) {
  return useMock ? mockClient : {
    getStatus,
    led,
    otaUpdate,
  };
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Helper to sleep for testing/mocking
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Extracts LED state from response text
 * Parses common response patterns to determine if LED is on/off
 *
 * @param responseText - Raw response from LED command
 * @returns 'on' | 'off' | 'unknown'
 *
 * @example
 * parseLedState('LED is now ON')        // 'on'
 * parseLedState('LED toggled to OFF')   // 'off'
 * parseLedState('Hello from ESP32!')    // 'unknown'
 */
export function parseLedState(responseText: string): 'on' | 'off' | 'unknown' {
  const upper = responseText.toUpperCase();

  // Check for ON first (more specific patterns)
  if (upper.includes('LED IS NOW ON') ||
      upper.includes('LED TOGGLED TO ON') ||
      upper.includes('LED: ON')) {
    return 'on';
  }

  // Check for OFF
  if (upper.includes('LED IS NOW OFF') ||
      upper.includes('LED TOGGLED TO OFF') ||
      upper.includes('LED: OFF')) {
    return 'off';
  }

  // Fallback: just look for ON/OFF keywords
  if (upper.includes('ON')) return 'on';
  if (upper.includes('OFF')) return 'off';

  return 'unknown';
}

/**
 * User-friendly error messages for different error types
 * Use these for displaying errors in the UI
 */
export const ErrorMessages = {
  timeout: 'ESP32 not responding. Check that it\'s powered on and connected to WiFi.',
  network: 'Cannot connect to ESP32. Verify the IP address is correct.',
  http: 'Command not supported. Firmware update may be required.',
  validation: 'Invalid input. Please check your IP address or URL format.',
  cancelled: 'Request was cancelled.',
  unknown: 'Command failed. Check your connection and try again.',
} as const;

/**
 * Gets user-friendly error message from DeviceError
 *
 * @param error - DeviceError object
 * @returns User-friendly error message
 *
 * @example
 * const result = await led('192.168.1.100', 'toggle');
 * if (!result.ok) {
 *   Alert.alert('Error', getUserFriendlyError(result));
 * }
 */
export function getUserFriendlyError(error: DeviceError): string {
  return ErrorMessages[error.errorType];
}

// ============================================================================
// Exports
// ============================================================================

// Re-export everything for convenient imports
export default {
  getStatus,
  led,
  otaUpdate,
  createClient,
  isValidIP,
  isValidURL,
  parseLedState,
  getUserFriendlyError,
  ErrorMessages,
  mockClient,
};
