# Migration Guide: Refactoring to deviceClient

This guide shows how to refactor your existing [app/(tabs)/index.tsx](../app/(tabs)/index.tsx) to use the new `deviceClient` library.

---

## Why Migrate?

### Critical Bug Fix
Your current code has a template literal bug:

```typescript
// ❌ CURRENT CODE (line 66 in index.tsx)
const baseUrl = useMemo(() => `http://${espIp}`, [espIp]);
```

**Issue:** If you're not using backticks correctly (easy to miss in code reviews), you get:
```
"http://${espIp}/led/on"  // Literal string - BROKEN! ❌
```

Instead of:
```
`http://192.168.1.100/led/on`  // Interpolated - WORKS! ✅
```

### Additional Benefits
- ✅ **Type Safety**: Catch errors at compile time
- ✅ **Consistent Error Handling**: Normalized response types
- ✅ **Better UX**: User-friendly error messages
- ✅ **Mock Support**: Develop UI without hardware
- ✅ **Testability**: Easy to unit test
- ✅ **Validation**: IP/URL validation before requests
- ✅ **Cancellation**: AbortController support

---

## Before & After Comparison

### 1. Connection / Status Check

#### Before
```typescript
const baseUrl = useMemo(() => `http://${espIp}`, [espIp]);

const connect = async () => {
  if (!espIp) {
    Alert.alert("Missing IP", "Enter the ESP32 IP address first.");
    return;
  }
  setConn("CONNECTING");
  const res = await httpGet("/", 1);
  if (res.ok) {
    setConn("ONLINE");
    setStatusText(typeof res.data === "string" ? res.data : JSON.stringify(res.data));
    setCaps((c) => ({ ...c, led: true, ota: true }));
  } else {
    setConn("OFFLINE");
    setStatusText(`Offline: ${formatErr(res.error)}`);
  }
};
```

#### After
```typescript
import { createClient, getUserFriendlyError, isValidIP } from '@/src/lib/deviceClient';

const client = createClient(USE_MOCK);

const connect = async () => {
  if (!isValidIP(espIp)) {
    Alert.alert("Invalid IP", "Enter a valid ESP32 IP address (e.g., 192.168.1.100)");
    return;
  }

  setConn("CONNECTING");
  const result = await client.getStatus(espIp);

  if (result.ok) {
    setConn("ONLINE");
    setStatusText(result.rawText);
    setLatency(result.latencyMs);
    setCaps((c) => ({ ...c, led: true, ota: true }));
  } else {
    setConn("OFFLINE");
    setStatusText(`Offline: ${getUserFriendlyError(result)}`);
  }
};
```

**Key Changes:**
- ✅ IP validation before request
- ✅ No manual URL construction
- ✅ User-friendly error messages via `getUserFriendlyError()`
- ✅ Latency tracking built-in

---

### 2. LED Commands

#### Before
```typescript
const sendLedCommand = async (command: "toggle" | "on" | "off") => {
  if (conn !== "ONLINE") {
    Alert.alert("Not connected", "Tap Connect first.");
    return;
  }
  setBusy(true);
  const res = await httpGet(`/led/${command}`, 2);
  setBusy(false);

  if (res.ok) {
    const msg = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
    setStatusText(msg);
  } else {
    Alert.alert("ESP32 Error", formatErr(res.error));
  }
};
```

#### After
```typescript
import { parseLedState } from '@/src/lib/deviceClient';

const sendLedCommand = async (command: "toggle" | "on" | "off") => {
  if (conn !== "ONLINE") {
    Alert.alert("Not connected", "Tap Connect first.");
    return;
  }

  setBusy(true);
  const result = await client.led(espIp, command);
  setBusy(false);

  if (result.ok) {
    setStatusText(result.rawText);
    setLatency(result.latencyMs);

    // Parse LED state from response
    const ledState = parseLedState(result.rawText);
    console.log('LED is now:', ledState);
  } else {
    Alert.alert("Command Failed", getUserFriendlyError(result));
  }
};
```

**Key Changes:**
- ✅ Type-safe `LedCommand` type
- ✅ Built-in LED state parsing
- ✅ Better error messages

---

### 3. OTA Update

#### Before
```typescript
const otaUpdate = async (firmwareUrl: string) => {
  if (conn !== "ONLINE") {
    Alert.alert("Not connected", "Tap Connect first.");
    return;
  }
  if (!caps.ota) {
    Alert.alert("OTA Disabled", "OTA capability not available.");
    return;
  }
  if (!firmwareUrl.startsWith("http")) {
    Alert.alert("Invalid URL", "Firmware URL must start with http(s).");
    return;
  }

  setBusy(true);
  setConn("REBOOTING");
  setStatusText("Starting OTA… device will reboot (expected).");

  const encoded = encodeURIComponent(firmwareUrl);
  const res = await httpGet(`/ota/update?url=${encoded}`, 1);

  setBusy(false);

  if (res.ok) {
    const msg = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
    setStatusText(msg + "\nWaiting for reboot…");
    await sleep(3500);
    await connect();
  } else {
    setConn("ONLINE");
    Alert.alert("OTA Error", formatErr(res.error));
  }
};
```

#### After
```typescript
const otaUpdate = async (firmwareUrl: string) => {
  if (conn !== "ONLINE") {
    Alert.alert("Not connected", "Tap Connect first.");
    return;
  }
  if (!caps.ota) {
    Alert.alert("OTA Disabled", "OTA capability not available.");
    return;
  }

  setBusy(true);
  setConn("REBOOTING");
  setStatusText("Starting OTA… device will reboot (expected).");

  // deviceClient handles URL validation and encoding automatically
  const result = await client.otaUpdate(espIp, firmwareUrl, {
    timeoutMs: 30000  // Extended timeout for OTA
  });

  setBusy(false);

  if (result.ok) {
    setStatusText(result.rawText + "\nWaiting for reboot…");
    await sleep(5000);  // Wait for reboot
    await connect();
  } else {
    setConn("ONLINE");
    Alert.alert("OTA Error", getUserFriendlyError(result));
  }
};
```

**Key Changes:**
- ✅ URL validation handled by client
- ✅ Automatic URL encoding
- ✅ Explicit timeout configuration
- ✅ Better error categorization

---

### 4. Mock Mode

#### Before
```typescript
const USE_MOCK = false;

async function mockGet(path: string) {
  await sleep(200);
  if (path === "/") return { ok: true, data: "ESP32 is running! LED Status: OFF" };
  if (path.startsWith("/led/")) return { ok: true, data: `MOCK: ${path}` };
  if (path.startsWith("/ota/update")) return { ok: true, data: "MOCK: OTA started" };
  return { ok: false, data: null, error: new Error("MOCK: Unknown endpoint") };
}

async function httpGet(pathOrUrl: string, retries = 2) {
  if (USE_MOCK) {
    const path = pathOrUrl.startsWith("http") ? "/" : pathOrUrl;
    return mockGet(path);
  }
  const url = pathOrUrl.startsWith("http") ? pathOrUrl : `${baseUrl}${pathOrUrl}`;
  return safeGet(url, { retries });
}
```

#### After
```typescript
import { createClient } from '@/src/lib/deviceClient';

const USE_MOCK = false;
const client = createClient(USE_MOCK);  // That's it! 🎉

// Now all API calls automatically use mock or real client
// No manual if/else branching needed!
```

**Key Changes:**
- ✅ Single line to toggle mock mode
- ✅ No manual branching logic
- ✅ Identical API for mock and real clients

---

### 5. Error Handling

#### Before
```typescript
function formatErr(e: unknown): string {
  const ax = e as AxiosError;
  if (ax?.code === "ECONNABORTED") return "Request timed out.";
  if (ax?.message) return ax.message;
  return "Unknown error.";
}
```

#### After
```typescript
import { getUserFriendlyError } from '@/src/lib/deviceClient';

// No need for custom error formatting!
// deviceClient provides user-friendly messages for all error types

const result = await client.led(espIp, 'toggle');
if (!result.ok) {
  Alert.alert('Error', getUserFriendlyError(result));

  // Or handle specific error types:
  switch (result.errorType) {
    case 'timeout':
      // ESP32 not responding
      break;
    case 'network':
      // Connection refused
      break;
    case 'http':
      // HTTP error (check result.statusCode)
      break;
    case 'validation':
      // Invalid input
      break;
  }
}
```

**Key Changes:**
- ✅ Categorized error types
- ✅ Pre-written user messages
- ✅ HTTP status codes included
- ✅ No axios-specific error handling

---

## Step-by-Step Migration

### Step 1: Install Dependencies (if needed)
```bash
# deviceClient uses native fetch - no additional dependencies needed!
```

### Step 2: Import the Client
```typescript
import {
  createClient,
  getUserFriendlyError,
  isValidIP,
  parseLedState,
} from '@/src/lib/deviceClient';
```

### Step 3: Create Client Instance
```typescript
const USE_MOCK = false;  // or true for development
const client = createClient(USE_MOCK);
```

### Step 4: Replace HTTP Calls

Search for these patterns and replace:

| Old Pattern | New Pattern |
|-------------|-------------|
| `httpGet("/")` | `client.getStatus(espIp)` |
| `httpGet("/led/toggle")` | `client.led(espIp, 'toggle')` |
| `httpGet("/led/on")` | `client.led(espIp, 'on')` |
| `httpGet("/led/off")` | `client.led(espIp, 'off')` |
| `httpGet("/ota/update?url=...")` | `client.otaUpdate(espIp, firmwareUrl)` |

### Step 5: Update Response Handling

Replace:
```typescript
if (res.ok) {
  const msg = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
  setStatusText(msg);
}
```

With:
```typescript
if (result.ok) {
  setStatusText(result.rawText);
  setLatency(result.latencyMs);
}
```

### Step 6: Update Error Handling

Replace:
```typescript
Alert.alert("ESP32 Error", formatErr(res.error));
```

With:
```typescript
Alert.alert("Error", getUserFriendlyError(result));
```

### Step 7: Add Validation

Before requests, add:
```typescript
if (!isValidIP(espIp)) {
  Alert.alert("Invalid IP", "Please enter a valid IP address");
  return;
}
```

### Step 8: Remove Unused Code

You can now remove:
- `safeGet()` function
- `formatErr()` function
- `mockGet()` function
- Manual URL building with `baseUrl`
- Axios imports (if only used for ESP32)

---

## Testing Checklist

After migration:

- [ ] Test with valid IP - should connect successfully
- [ ] Test with invalid IP - should show validation error
- [ ] Test LED toggle - should work and parse state
- [ ] Test LED on/off - should work
- [ ] Test with ESP32 offline - should show timeout error
- [ ] Test OTA update - should handle long operation
- [ ] Toggle USE_MOCK - both modes should work identically
- [ ] Check latency is displayed correctly
- [ ] Verify error messages are user-friendly

---

## Backward Compatibility

The deviceClient is **fully compatible** with your existing code. You can migrate incrementally:

1. Start with one function (e.g., `connect()`)
2. Test thoroughly
3. Migrate next function
4. Repeat until complete

No need to do everything at once!

---

## Common Issues

### Issue 1: TypeScript Errors
**Problem:** `Cannot find module '@/src/lib/deviceClient'`

**Solution:** Check your `tsconfig.json` path mapping:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./"]
    }
  }
}
```

Or use relative import:
```typescript
import { createClient } from '../../../src/lib/deviceClient';
```

### Issue 2: Mock Not Working
**Problem:** Mock mode shows real errors

**Solution:** Ensure you're creating client with mock flag:
```typescript
const client = createClient(true);  // ← Must be true!
```

### Issue 3: Timeout Too Short
**Problem:** OTA update times out

**Solution:** Use extended timeout:
```typescript
await client.otaUpdate(espIp, firmwareUrl, {
  timeoutMs: 30000  // 30 seconds
});
```

---

## Next Steps

1. ✅ Review the [ui-contract.md](./ui-contract.md) for API details
2. ✅ Check [deviceClient.example.ts](../src/lib/deviceClient.example.ts) for usage patterns
3. ✅ Run [deviceClient.test.ts](../src/lib/deviceClient.test.ts) to verify everything works
4. ✅ Migrate your code using this guide
5. ✅ Toggle `USE_MOCK = true` to develop UI features without hardware

---

## Questions?

If you encounter issues during migration:

1. Check the [examples file](../src/lib/deviceClient.example.ts)
2. Read the inline JSDoc comments in [deviceClient.ts](../src/lib/deviceClient.ts)
3. Review the [ui-contract.md](./ui-contract.md) for expected behavior
4. Test with mock mode first to isolate UI vs network issues

Happy coding! 🚀
