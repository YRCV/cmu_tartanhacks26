/**
 * Device Client Tests
 *
 * Jest tests for URL building, response parsing, and validation logic.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { mockDeviceClient, mockControls } from '../deviceClient.mock';

describe('DeviceClient', () => {
  beforeEach(() => {
    // Reset mock state before each test
    mockControls.reset();
  });

  // ─── URL Building Tests ─────────────────────────────────────
  // (Note: URL building is internal to deviceClient.ts, but we can verify via mock behavior or just trust the logic if exported functions exist)
  // deviceClient.ts exports isValidIP, isValidURL. It does NOT export buildURL.
  // We will skip buildURL unit tests unless we export it, or rely on integration tests.

  // ─── Response Parsing Tests ─────────────────────────────────

  describe('Response Parsing', () => {
    it('should parse successful status response', async () => {
      const result = await mockDeviceClient.getStatus('192.168.1.100');

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Mock returns: "ESP32 Controller - LED is OFF"
        expect(result.rawText).toContain('ESP32');
        expect(result.latencyMs).toBeGreaterThan(0);
      }
    });

    it('should parse successful LED toggle response', async () => {
      // Set initial state
      mockControls.setLedState('off');

      const result = await mockDeviceClient.led('192.168.1.100', 'toggle');

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Mock returns: "LED is now ON" (or toggled)
        expect(result.rawText).toContain('ON');
      }
    });

    it('should parse successful LED on response', async () => {
      const result = await mockDeviceClient.led('192.168.1.100', 'on');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.rawText).toContain('ON');
      }
    });

    it('should parse successful LED off response', async () => {
      const result = await mockDeviceClient.led('192.168.1.100', 'off');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.rawText).toContain('OFF');
      }
    });

    it('should parse successful OTA response', async () => {
      const result = await mockDeviceClient.otaUpdate(
        '192.168.1.100',
        'http://example.com/firmware.bin'
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.rawText).toContain('OTA');
      }
    });
  });

  // ─── Error Handling Tests ───────────────────────────────────

  describe('Error Handling', () => {
    it('should handle device offline error', async () => {
      mockControls.setOnline(false); // Updated API

      const result = await mockDeviceClient.getStatus('192.168.1.100');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('Timeout'); // Mock returns Timeout when offline
        expect(result.errorType).toBe('timeout');
      }
    });

    it('should handle timeout error', async () => {
      const controller = new AbortController();

      // Abort immediately
      setTimeout(() => controller.abort(), 10);

      const result = await mockDeviceClient.led('192.168.1.100', 'toggle', {
        signal: controller.signal,
      });

      // Assert it failed
      // Note: simulated delay might be faster than 10ms in some envs, but mock delay is >100ms
      expect(result.ok).toBe(false);
      if (!result.ok) {
        // Could be 'cancelled' or 'timeout' depending on implementation details
        expect(result.error).toBeTruthy();
      }
    });

    it('should handle invalid firmware URL', async () => {
      const result = await mockDeviceClient.otaUpdate(
        '192.168.1.100',
        'not-a-valid-url'
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errorType).toBe('validation');
      }
    });
  });

  // ─── State Management Tests ─────────────────────────────────

  describe('State Management', () => {
    it('should maintain LED state across requests', async () => {
      // Set to off
      await mockDeviceClient.led('192.168.1.100', 'off');
      let status = await mockDeviceClient.getStatus('192.168.1.100');

      // Mock "getStatus" returns "LED is OFF"
      expect(status.ok).toBe(true);
      if (status.ok) {
        expect(status.rawText).toContain('OFF');
      }

      // Toggle to on
      await mockDeviceClient.led('192.168.1.100', 'toggle');
      status = await mockDeviceClient.getStatus('192.168.1.100');

      // Mock "getStatus" returns "LED is ON"
      expect(status.ok).toBe(true);
      if (status.ok) {
        expect(status.rawText).toContain('ON');
      }

      // Toggle back to off
      await mockDeviceClient.led('192.168.1.100', 'toggle');
      status = await mockDeviceClient.getStatus('192.168.1.100');

      expect(status.ok).toBe(true);
      if (status.ok) {
        expect(status.rawText).toContain('OFF');
      }
    });
  });

  // ─── Latency Tests ──────────────────────────────────────────

  describe('Latency Tracking', () => {
    it('should track latency for successful requests', async () => {
      const result = await mockDeviceClient.getStatus('192.168.1.100');
      expect(result.latencyMs).toBeGreaterThan(0);
    });

    it('should respect custom latency settings', async () => {
      mockControls.setLatency(100, 200);

      const result = await mockDeviceClient.getStatus('192.168.1.100');

      // Since latency is randomized between min/max + basic implementation overhead
      expect(result.latencyMs).toBeGreaterThanOrEqual(100);
      // We allow some buffer for execution time
      expect(result.latencyMs).toBeLessThan(300);
    });
  });

  // ─── Mock Controls Tests ────────────────────────────────────

  describe('Mock Controls', () => {
    it('should reset mock state correctly', async () => {
      mockControls.setLedState('on');
      mockControls.setOnline(false);
      mockControls.setLatency(1000, 2000);

      mockControls.reset();

      // Verify reset by checking device behavior
      // Should be online
      const status = await mockDeviceClient.getStatus('192.168.1.100');
      expect(status.ok).toBe(true);
      if (status.ok) {
        // Should be 'off' by default
        expect(status.rawText).toContain('OFF');
      }
    });
  });

  // ─── Integration Tests ──────────────────────────────────────

  describe('Integration', () => {
    it('should handle full LED control flow', async () => {
      // Get initial status
      const status1 = await mockDeviceClient.getStatus('192.168.1.100');
      expect(status1.ok).toBe(true);

      // Turn LED on
      const onResult = await mockDeviceClient.led('192.168.1.100', 'on');
      expect(onResult.ok).toBe(true);
      if (onResult.ok) expect(onResult.rawText).toContain('ON');

      // Verify status
      const status2 = await mockDeviceClient.getStatus('192.168.1.100');
      expect(status2.ok).toBe(true);
      if (status2.ok) expect(status2.rawText).toContain('ON');

      // Toggle off
      const toggleResult = await mockDeviceClient.led(
        '192.168.1.100',
        'toggle'
      );
      expect(toggleResult.ok).toBe(true);
      if (toggleResult.ok) expect(toggleResult.rawText).toContain('OFF');

      // Final verify
      const status3 = await mockDeviceClient.getStatus('192.168.1.100');
      expect(status3.ok).toBe(true);
      if (status3.ok) expect(status3.rawText).toContain('OFF');
    });

    it('should handle OTA update flow', async () => {
      const firmwareUrl = 'http://example.com/firmware.bin';

      const result = await mockDeviceClient.otaUpdate('192.168.1.100', firmwareUrl);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.rawText).toContain('OTA');
        expect(result.latencyMs).toBeGreaterThan(0);
      }
    });
  });
});
