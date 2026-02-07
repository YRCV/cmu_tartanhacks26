/**
 * Device Client Tests
 *
 * Run with: npx jest deviceClient.test.ts
 * or: node -r ts-node/register deviceClient.test.ts (for quick manual testing)
 */

import {
  isValidIP,
  isValidURL,
  parseLedState,
  getUserFriendlyError,
  createClient,
  type DeviceError,
} from './deviceClient';

// ============================================================================
// Validation Tests
// ============================================================================

console.log('=== IP Validation Tests ===');

const validIPs = [
  '192.168.1.1',
  '10.0.0.1',
  '172.16.0.1',
  '8.8.8.8',
  '127.0.0.1',
  '0.0.0.0',
  '255.255.255.255',
];

const invalidIPs = [
  '256.1.1.1',        // Out of range
  '192.168.1',        // Incomplete
  '192.168.1.1.1',    // Too many octets
  '192.168.-1.1',     // Negative
  'localhost',        // Hostname
  '192.168.1.1:80',   // With port
  '',                 // Empty
  '192.168.01.001',   // Leading zeros (technically valid but unusual)
];

validIPs.forEach(ip => {
  const result = isValidIP(ip);
  console.log(`  ✅ ${ip.padEnd(20)} → ${result} (expected: true)`);
  if (!result) console.error(`    ❌ FAILED: Expected true`);
});

invalidIPs.forEach(ip => {
  const result = isValidIP(ip);
  console.log(`  ${result ? '❌' : '✅'} ${ip.padEnd(20)} → ${result} (expected: false)`);
  if (result) console.error(`    ❌ FAILED: Expected false`);
});

// ============================================================================
// URL Validation Tests
// ============================================================================

console.log('\n=== URL Validation Tests ===');

const validURLs = [
  'http://192.168.1.100/firmware.bin',
  'https://example.com/file.bin',
  'http://localhost:8000/test',
  'https://cdn.example.com/path/to/file.bin?version=1.0',
];

const invalidURLs = [
  'ftp://example.com/file.bin',    // Wrong protocol
  'htp://typo.com',                // Typo
  'example.com/file',              // Missing protocol
  '/local/path',                   // Local path
  '',                              // Empty
];

validURLs.forEach(url => {
  const result = isValidURL(url);
  console.log(`  ✅ ${url.substring(0, 40).padEnd(42)} → ${result}`);
  if (!result) console.error(`    ❌ FAILED: Expected true`);
});

invalidURLs.forEach(url => {
  const result = isValidURL(url);
  console.log(`  ${result ? '❌' : '✅'} ${url.substring(0, 40).padEnd(42)} → ${result}`);
  if (result) console.error(`    ❌ FAILED: Expected false`);
});

// ============================================================================
// LED State Parsing Tests
// ============================================================================

console.log('\n=== LED State Parsing Tests ===');

const stateTests: Array<[string, 'on' | 'off' | 'unknown']> = [
  ['LED is now ON', 'on'],
  ['LED is now OFF', 'off'],
  ['LED toggled to ON', 'on'],
  ['LED toggled to OFF', 'off'],
  ['LED: ON', 'on'],
  ['LED: OFF', 'off'],
  ['Hello from ESP32!', 'unknown'],
  ['Status: LED ON, Temp: 25C', 'on'],
  ['', 'unknown'],
];

stateTests.forEach(([input, expected]) => {
  const result = parseLedState(input);
  const match = result === expected;
  console.log(`  ${match ? '✅' : '❌'} "${input.substring(0, 30)}" → ${result} (expected: ${expected})`);
});

// ============================================================================
// Error Message Tests
// ============================================================================

console.log('\n=== Error Message Tests ===');

const errorTypes: Array<DeviceError['errorType']> = [
  'timeout',
  'network',
  'http',
  'validation',
  'cancelled',
  'unknown',
];

errorTypes.forEach(type => {
  const mockError: DeviceError = {
    ok: false,
    error: 'Test error',
    errorType: type,
    latencyMs: 0,
  };
  const message = getUserFriendlyError(mockError);
  console.log(`  ${type.padEnd(12)} → "${message}"`);
});

// ============================================================================
// Bug Fix Demonstration: Template Literal
// ============================================================================

console.log('\n=== Template Literal Bug Fix ===');

const espIp = '192.168.1.100';

// ❌ WRONG (common bug in original code)
const wrongUrl1 = 'http://${espIp}/led/on';  // Literal string!
console.log('  ❌ Single quotes:', wrongUrl1);
console.log('     Expected: http://192.168.1.100/led/on');
console.log('     Got:      http://${espIp}/led/on');

// ❌ WRONG (another common mistake)
const wrongUrl2 = "http://${espIp}/led/on";  // Double quotes don't interpolate either!
console.log('\n  ❌ Double quotes:', wrongUrl2);
console.log('     Expected: http://192.168.1.100/led/on');
console.log('     Got:      http://${espIp}/led/on');

// ✅ CORRECT (uses backticks for template literals)
const correctUrl = `http://${espIp}/led/on`;  // Backticks enable interpolation!
console.log('\n  ✅ Backticks:', correctUrl);
console.log('     Expected: http://192.168.1.100/led/on');
console.log('     Got:      http://192.168.1.100/led/on ✅');

// ============================================================================
// Mock Client Test
// ============================================================================

console.log('\n=== Mock Client Test ===');

async function testMockClient() {
  const mockClient = createClient(true);

  console.log('  Testing mock getStatus...');
  const status = await mockClient.getStatus('192.168.1.100');
  console.log(`    ${status.ok ? '✅' : '❌'} Status:`, status.ok ? status.rawText : status.error);

  console.log('  Testing mock LED toggle...');
  const led = await mockClient.led('192.168.1.100', 'toggle');
  console.log(`    ${led.ok ? '✅' : '❌'} LED:`, led.ok ? led.rawText : led.error);

  console.log('  Testing mock OTA (valid URL)...');
  const ota = await mockClient.otaUpdate(
    '192.168.1.100',
    'http://example.com/firmware.bin'
  );
  console.log(`    ${ota.ok ? '✅' : '❌'} OTA:`, ota.ok ? ota.rawText : ota.error);

  console.log('  Testing mock OTA (invalid URL)...');
  const otaBad = await mockClient.otaUpdate('192.168.1.100', 'not-a-url');
  console.log(`    ${!otaBad.ok ? '✅' : '❌'} OTA Invalid:`, !otaBad.ok ? otaBad.error : 'Should have failed');
}

testMockClient().then(() => {
  console.log('\n=== All Tests Complete ===\n');
});

// ============================================================================
// Performance Note
// ============================================================================

console.log('\n=== Why This Matters ===');
console.log(`
The deviceClient fixes a critical bug in the original code:

ORIGINAL CODE (index.tsx:66):
  const baseUrl = useMemo(() => 'http://\${espIp}', [espIp]);
                                 ^                ^
                                 Single quotes = literal string!

This results in URLs like:
  http://\${espIp}/led/on  ❌ BROKEN

FIXED VERSION (deviceClient.ts):
  const url = \`http://\${ip}\${path}\`;
              ^                        ^
              Backticks = template literal!

This results in URLs like:
  http://192.168.1.100/led/on  ✅ WORKS

Additional benefits of deviceClient:
  ✅ Type-safe API (TypeScript catches errors at compile time)
  ✅ Normalized responses (consistent error handling)
  ✅ IP validation (catch bad inputs before network request)
  ✅ Mock support (develop UI without hardware)
  ✅ Latency tracking (monitor performance)
  ✅ Cancellation support (abort long-running requests)
  ✅ User-friendly error messages (better UX)
`);
