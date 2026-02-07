/**
 * Mock Device Client
 * 
 * Simulates ESP32 device behavior for testing without hardware.
 * Enables UI development and testing even when device is offline.
 */

import {
  type DeviceResponse,
  type RequestOptions,
  type DeviceSuccess,
  type DeviceError,
  type LedCommand,
} from './deviceClient';

// ─── Mock Control Interface ────────────────────────────────

export interface MockControls {
  /** Set whether device is "online" (responding) */
  setOnline: (isOnline: boolean) => void;

  /** Set simulated network latency range */
  setLatency: (min: number, max: number) => void;

  /** Set current LED state */
  setLedState: (state: 'on' | 'off') => void;

  /** Reset to defaults */
  reset: () => void;
}

// ─── Internal Mock State ───────────────────────────────────

let isOnline = true;
let latencyMin = 50;
let latencyMax = 150;
let ledState: 'on' | 'off' = 'off';

/**
 * Control the mock device from tests or debug screens
 */
export const mockControls: MockControls = {
  setOnline: (online) => {
    isOnline = online;
  },
  setLatency: (min, max) => {
    latencyMin = min;
    latencyMax = max;
  },
  setLedState: (state) => {
    ledState = state;
  },
  reset: () => {
    isOnline = true;
    latencyMin = 50;
    latencyMax = 150;
    ledState = 'off';
  },
};

// ─── Helpers ───────────────────────────────────────────────

/**
 * Simulate network delay
 */
async function simulateDelay(signal?: AbortSignal): Promise<void> {
  const delay = Math.floor(Math.random() * (latencyMax - latencyMin + 1)) + latencyMin;

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      resolve();
    }, delay);

    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      });
    }
  });
}

/**
 * Create success response
 */
function createSuccess(text: string, latency: number): DeviceSuccess {
  return {
    ok: true,
    rawText: text,
    latencyMs: latency,
  };
}

/**
 * Create error response
 */
function createError(
  message: string,
  type: DeviceError['errorType'],
  latency: number
): DeviceError {
  return {
    ok: false,
    error: message,
    errorType: type,
    latencyMs: latency,
  };
}

// ─── Mock Implementation ───────────────────────────────────

export const mockDeviceClient = {
  /**
   * Mock getStatus (GET /)
   */
  async getStatus(ip: string, options?: RequestOptions): Promise<DeviceResponse> {
    const start = Date.now();
    try {
      await simulateDelay(options?.signal);

      if (!isOnline) {
        return createError(
          'Timeout',
          'timeout',
          Date.now() - start
        );
      }

      return createSuccess(
        `ESP32 Controller - LED is ${ledState.toUpperCase()}`,
        Date.now() - start
      );
    } catch (error) {
      // Handle cancellation
      if (error instanceof DOMException && error.name === 'AbortError') {
        return createError('Request cancelled', 'cancelled', Date.now() - start);
      }
      return createError('Unknown error', 'unknown', Date.now() - start);
    }
  },

  /**
   * Mock led control (GET /led/...)
   */
  async led(
    ip: string,
    command: LedCommand,
    options?: RequestOptions
  ): Promise<DeviceResponse> {
    const start = Date.now();
    try {
      await simulateDelay(options?.signal);

      if (!isOnline) {
        return createError(
          'Timeout',
          'timeout',
          Date.now() - start
        );
      }

      // Update state
      if (command === 'toggle') {
        ledState = ledState === 'on' ? 'off' : 'on';
      } else if (command === 'on') {
        ledState = 'on';
      } else if (command === 'off') {
        ledState = 'off';
      }

      return createSuccess(
        `LED is now ${ledState.toUpperCase()}`,
        Date.now() - start
      );

    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return createError('Request cancelled', 'cancelled', Date.now() - start);
      }
      return createError('Unknown error', 'unknown', Date.now() - start);
    }
  },

  /**
   * Mock OTA update (GET /ota/update...)
   */
  async otaUpdate(
    ip: string,
    url: string,
    options?: RequestOptions
  ): Promise<DeviceResponse> {
    const start = Date.now();
    try {
      // OTA takes longer
      const initialDelay = 500;
      await new Promise(r => setTimeout(r, initialDelay));

      if (options?.signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }

      if (!isOnline) {
        return createError(
          'Timeout',
          'timeout',
          Date.now() - start
        );
      }

      // Validate URL (just for mock realism)
      if (!url.startsWith('http')) {
        return createError(
          'Invalid URL protocol',
          'validation',
          Date.now() - start
        );
      }

      return createSuccess(
        'OTA Update Started',
        Date.now() - start
      );

    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return createError('Request cancelled', 'cancelled', Date.now() - start);
      }
      return createError('Unknown error', 'unknown', Date.now() - start);
    }
  }
};

/**
 * Check if mock mode is enabled via environment
 */
export function isMockMode(): boolean {
  return process.env.EXPO_PUBLIC_MOCK_DEVICE === 'true';
}

/**
 * Get the appropriate client (real or mock) based on env
 */
export function getDeviceClient() {
  if (isMockMode()) {
    console.log('[DeviceClient] Using MOCK client');
    return mockDeviceClient;
  }
  return require('./deviceClient').deviceClient;
}
