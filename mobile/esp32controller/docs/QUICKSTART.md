# Quick Start Guide: Device Client

Get up and running with the device client in **5 minutes**! ⚡

---

## 30-Second Overview

The device client is a type-safe, mockable HTTP library for ESP32 communication with:

- ✅ 3 simple functions: `getStatus()`, `led()`, `otaUpdate()`
- ✅ Built-in validation, error handling, and mock support
- ✅ Works with or without hardware

---

## Step 1: Import the Client (10 seconds)

```typescript
import { createClient, getUserFriendlyError } from '@/src/lib/deviceClient';
```

---

## Step 2: Create Client Instance (10 seconds)

```typescript
// Toggle this flag to switch between real and mock mode
const USE_MOCK = false;  // false = real ESP32, true = mock for UI dev
const client = createClient(USE_MOCK);
```

---

## Step 3: Use the API (1 minute)

### Check Connection Status
```typescript
const result = await client.getStatus('192.168.1.100');

if (result.ok) {
  console.log('✅ Connected:', result.rawText);
  console.log('Latency:', result.latencyMs, 'ms');
} else {
  Alert.alert('Error', getUserFriendlyError(result));
}
```

### Control LED
```typescript
const result = await client.led('192.168.1.100', 'toggle');

if (result.ok) {
  console.log('✅ LED toggled:', result.rawText);
} else {
  Alert.alert('Error', getUserFriendlyError(result));
}
```

### OTA Update
```typescript
const result = await client.otaUpdate(
  '192.168.1.100',
  'http://192.168.1.50:8000/firmware.bin',
  { timeoutMs: 30000 }  // Extended timeout for OTA
);

if (result.ok) {
  console.log('✅ OTA started! ESP32 will reboot...');
} else {
  Alert.alert('Error', getUserFriendlyError(result));
}
```

---

## That's It! 🎉

You now have a production-ready ESP32 client with:

- ✅ Type safety
- ✅ Error handling
- ✅ Mock support
- ✅ Validation
- ✅ Latency tracking

---

## Common Patterns

### Pattern 1: With Validation
```typescript
import { isValidIP, client } from '@/src/lib/deviceClient';

if (!isValidIP(espIp)) {
  Alert.alert('Invalid IP', 'Please enter a valid IP address');
  return;
}

const result = await client.getStatus(espIp);
```

### Pattern 2: Parse LED State
```typescript
import { parseLedState } from '@/src/lib/deviceClient';

const result = await client.led(espIp, 'toggle');
if (result.ok) {
  const state = parseLedState(result.rawText);  // 'on' | 'off' | 'unknown'
  console.log('LED is now:', state);
}
```

### Pattern 3: Handle Specific Errors
```typescript
const result = await client.led(espIp, 'toggle');

if (!result.ok) {
  switch (result.errorType) {
    case 'timeout':
      Alert.alert('Timeout', 'ESP32 not responding');
      break;
    case 'network':
      Alert.alert('Network Error', 'Check IP address');
      break;
    default:
      Alert.alert('Error', getUserFriendlyError(result));
  }
}
```

---

## Development Workflow

### 1. Start with Mock Mode (UI development)
```typescript
const client = createClient(true);  // Mock mode ← No hardware needed!

// Build your UI, test all states, polish UX
// All API calls work identically
```

### 2. Switch to Real Mode (Testing)
```typescript
const client = createClient(false);  // Real mode ← Connect to ESP32

// Same code, now talks to real hardware
// No code changes needed!
```

### 3. Deploy to Production
```typescript
const USE_MOCK = __DEV__;  // Mock in dev, real in production
const client = createClient(USE_MOCK);
```

---

## Full Example: React Component

```typescript
import { useState } from 'react';
import { Alert, Button, TextInput, View } from 'react-native';
import {
  createClient,
  getUserFriendlyError,
  isValidIP,
  parseLedState
} from '@/src/lib/deviceClient';

export default function ESP32Control() {
  const [espIp, setEspIp] = useState('192.168.1.100');
  const [status, setStatus] = useState('Not connected');
  const [busy, setBusy] = useState(false);

  const USE_MOCK = false;  // Toggle for development
  const client = createClient(USE_MOCK);

  const handleConnect = async () => {
    if (!isValidIP(espIp)) {
      Alert.alert('Invalid IP', 'Please enter a valid IP address');
      return;
    }

    setBusy(true);
    const result = await client.getStatus(espIp);
    setBusy(false);

    if (result.ok) {
      setStatus(`Connected! (${result.latencyMs}ms)`);
    } else {
      Alert.alert('Connection Failed', getUserFriendlyError(result));
    }
  };

  const handleToggleLED = async () => {
    setBusy(true);
    const result = await client.led(espIp, 'toggle');
    setBusy(false);

    if (result.ok) {
      const ledState = parseLedState(result.rawText);
      setStatus(`LED is now ${ledState.toUpperCase()}`);
    } else {
      Alert.alert('Error', getUserFriendlyError(result));
    }
  };

  return (
    <View>
      <TextInput
        value={espIp}
        onChangeText={setEspIp}
        placeholder="ESP32 IP Address"
      />
      <Button title="Connect" onPress={handleConnect} disabled={busy} />
      <Button title="Toggle LED" onPress={handleToggleLED} disabled={busy} />
      <Text>{status}</Text>
    </View>
  );
}
```

**That's all you need!** ✨

---

## Testing Without Hardware

```bash
# 1. Set mock mode
const client = createClient(true);  // ← Mock mode

# 2. Use API normally
const result = await client.led('192.168.1.100', 'toggle');

# 3. Get instant responses (no network!)
if (result.ok) {
  console.log(result.rawText);  // "LED toggled to ON" (simulated)
}
```

---

## API Cheat Sheet

| Function | Purpose | Example |
|----------|---------|---------|
| `getStatus(ip)` | Check ESP32 health | `await client.getStatus('192.168.1.100')` |
| `led(ip, cmd)` | Control LED | `await client.led('192.168.1.100', 'toggle')` |
| `otaUpdate(ip, url)` | Firmware update | `await client.otaUpdate(ip, url, { timeoutMs: 30000 })` |
| `isValidIP(ip)` | Validate IP address | `if (isValidIP(ip)) { ... }` |
| `isValidURL(url)` | Validate URL | `if (isValidURL(url)) { ... }` |
| `parseLedState(text)` | Parse LED state | `const state = parseLedState(result.rawText)` |
| `getUserFriendlyError(error)` | Get error message | `Alert.alert('Error', getUserFriendlyError(result))` |

---

## Response Shape

Every API call returns:

### Success
```typescript
{
  ok: true,
  rawText: "LED is now ON",
  latencyMs: 123
}
```

### Error
```typescript
{
  ok: false,
  error: "Request timed out",
  errorType: "timeout",
  latencyMs: 5000,
  statusCode?: 404  // Only for HTTP errors
}
```

**Use `result.ok` to check success!** TypeScript will narrow the type automatically.

---

## Error Types

| Type | Meaning | Example User Message |
|------|---------|---------------------|
| `timeout` | ESP32 not responding | "ESP32 not responding. Check that it's powered on..." |
| `network` | Connection refused | "Cannot connect to ESP32. Verify the IP address..." |
| `http` | HTTP error (4xx, 5xx) | "Command not supported. Firmware update may be required." |
| `validation` | Invalid input | "Invalid IP address format" |
| `cancelled` | User cancelled | "Request was cancelled" |
| `unknown` | Unknown error | "Command failed. Check your connection..." |

---

## Timeouts

| Endpoint | Default Timeout | Override Example |
|----------|----------------|------------------|
| `getStatus()` | 5000ms | `{ timeoutMs: 10000 }` |
| `led()` | 5000ms | `{ timeoutMs: 10000 }` |
| `otaUpdate()` | 30000ms | `{ timeoutMs: 60000 }` |

```typescript
// Custom timeout example
const result = await client.getStatus(espIp, {
  timeoutMs: 10000  // 10 seconds
});
```

---

## Cancellation

```typescript
const controller = new AbortController();

// Start request with cancel signal
const result = await client.otaUpdate(espIp, firmwareUrl, {
  signal: controller.signal
});

// Cancel anytime
controller.abort();
```

---

## Next Steps

- 📖 **Full API Reference**: See [deviceClient-summary.md](./deviceClient-summary.md)
- 🔧 **Migration Guide**: See [migration-guide.md](./migration-guide.md)
- 📝 **API Contract**: See [ui-contract.md](./ui-contract.md)
- 🎯 **Examples**: See [deviceClient.example.ts](../src/lib/deviceClient.example.ts)
- 🏗️ **Architecture**: See [architecture-diagram.md](./architecture-diagram.md)

---

## Troubleshooting

### "Cannot find module '@/src/lib/deviceClient'"

Use relative import:
```typescript
import { createClient } from '../../../src/lib/deviceClient';
```

### "Request timed out"

1. Check ESP32 is powered on
2. Verify IP address is correct
3. Ensure ESP32 and phone on same WiFi network
4. Try increasing timeout: `{ timeoutMs: 10000 }`

### "Invalid IP address format"

Use `isValidIP()` to validate before calling API:
```typescript
if (!isValidIP(espIp)) {
  Alert.alert('Invalid IP', 'Format: 192.168.1.100');
  return;
}
```

### Mock mode not working

Ensure you pass `true` to factory:
```typescript
const client = createClient(true);  // ← Must be true
```

---

## Need Help?

1. Check [deviceClient.example.ts](../src/lib/deviceClient.example.ts) for 8 usage patterns
2. Review [migration-guide.md](./migration-guide.md) for step-by-step refactoring
3. Read [ui-contract.md](./ui-contract.md) for complete API contract
4. Run [deviceClient.test.ts](../src/lib/deviceClient.test.ts) to see examples in action

---

**You're ready to build! 🚀**

The device client handles all the complexity - you just focus on building great UX.
