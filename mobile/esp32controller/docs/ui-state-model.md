# UI State Model - Preventing "UI Lies"

## Overview

This document defines the **canonical UI state model** for the ESP32 Controller app. Following this model prevents common UI bugs where:
- Stale responses overwrite newer data
- Multiple concurrent requests cause race conditions
- UI shows success when the device actually failed
- Users see outdated information

## The Problem: "UI Lies"

### Race Condition Example
```
Time  | User Action       | What Happens
------|-------------------|------------------------------------------
0s    | Toggle LED        | Request A sent (expects "on")
1s    | Toggle LED again  | Request B sent (expects "off")
2s    | Response B ✓      | LED is "off", UI shows "off" ✓
3s    | Response A ✓      | LED is STILL "off", but UI shows "on" ✗
```

**Result:** UI lies. LED is off, but UI says it's on.

### Solution: Request ID Tracking
Only apply responses that match the latest request.

---

## Core State Model

### TypeScript Definition

```typescript
/**
 * Core UI state for device interaction
 * Prevents race conditions and stale data
 */
interface DeviceScreenState {
  // Device Configuration
  deviceIp: string;

  // Connection Status
  connection: 'unknown' | 'online' | 'offline';

  // Current Operation (null when idle)
  busyCommand: 'status' | 'toggle' | 'on' | 'off' | 'ota' | null;

  // Last Successful Response
  lastResponseText: string;
  lastLatencyMs: number;
  lastUpdatedAt: Date | null;

  // Command History (last 10 commands)
  commandLog: CommandLogEntry[];

  // Request Tracking (prevents race conditions)
  latestRequestId: string | null;

  // Error State
  error: string | null;
}

/**
 * Single entry in command log
 */
interface CommandLogEntry {
  id: string;
  command: 'status' | 'toggle' | 'on' | 'off' | 'ota';
  timestamp: Date;
  status: 'pending' | 'success' | 'error';
  responseText?: string;
  latencyMs?: number;
  errorMessage?: string;
}
```

---

## State Transitions

### 1. Idle State (Initial)

```typescript
const initialState: DeviceScreenState = {
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
```

### 2. Sending Request

```typescript
// User presses "Toggle LED"
const requestId = generateRequestId(); // e.g., "req_1707268800_abc123"

setState({
  ...state,
  busyCommand: 'toggle',
  latestRequestId: requestId,
  error: null,
});

// Add to log
addToCommandLog({
  id: requestId,
  command: 'toggle',
  timestamp: new Date(),
  status: 'pending',
});
```

### 3. Receiving Response (Success)

```typescript
// Response arrives
const responseRequestId = 'req_1707268800_abc123';

// ✅ CRITICAL: Only apply if this matches the latest request
if (responseRequestId === state.latestRequestId) {
  setState({
    ...state,
    connection: 'online',
    busyCommand: null,
    lastResponseText: result.data.led, // "on" or "off"
    lastLatencyMs: result.latencyMs,
    lastUpdatedAt: new Date(),
    error: null,
  });

  updateCommandLog(responseRequestId, {
    status: 'success',
    responseText: result.data.led,
    latencyMs: result.latencyMs,
  });
} else {
  // ⚠️ Stale response, ignore it
  console.warn('Ignoring stale response', responseRequestId);
}
```

### 4. Receiving Response (Error)

```typescript
// Error response
if (responseRequestId === state.latestRequestId) {
  setState({
    ...state,
    connection: 'offline',
    busyCommand: null,
    error: result.error,
  });

  updateCommandLog(responseRequestId, {
    status: 'error',
    errorMessage: result.error,
  });
}
```

### 5. User Cancels

```typescript
// User navigates away or presses cancel
setState({
  ...state,
  busyCommand: null,
  latestRequestId: null, // Invalidate pending request
});

// Any response that arrives will be ignored because requestId won't match
```

---

## Request ID Generation

```typescript
/**
 * Generate unique request ID
 * Format: req_<timestamp>_<random>
 */
function generateRequestId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `req_${timestamp}_${random}`;
}
```

---

## Command Log Management

### Adding Entry

```typescript
function addToCommandLog(entry: CommandLogEntry) {
  setState(prev => ({
    ...prev,
    commandLog: [
      entry,
      ...prev.commandLog.slice(0, 9), // Keep last 10
    ],
  }));
}
```

### Updating Entry

```typescript
function updateCommandLog(
  requestId: string,
  updates: Partial<CommandLogEntry>
) {
  setState(prev => ({
    ...prev,
    commandLog: prev.commandLog.map(entry =>
      entry.id === requestId ? { ...entry, ...updates } : entry
    ),
  }));
}
```

---

## Complete Usage Example

```typescript
import React, { useState } from 'react';
import { deviceClient } from '@/src/lib/deviceClient';

function DeviceScreen() {
  const [state, setState] = useState<DeviceScreenState>({
    deviceIp: '192.168.1.100',
    connection: 'unknown',
    busyCommand: null,
    lastResponseText: '',
    lastLatencyMs: 0,
    lastUpdatedAt: null,
    commandLog: [],
    latestRequestId: null,
    error: null,
  });

  const sendCommand = async (command: 'toggle' | 'on' | 'off') => {
    // Generate unique request ID
    const requestId = generateRequestId();

    // Update state to "busy"
    setState(prev => ({
      ...prev,
      busyCommand: command,
      latestRequestId: requestId,
      error: null,
    }));

    // Add to log
    addToCommandLog({
      id: requestId,
      command,
      timestamp: new Date(),
      status: 'pending',
    });

    // Send request
    const result = await deviceClient.led(state.deviceIp, command);

    // ✅ CRITICAL: Only apply if this is still the latest request
    if (requestId === state.latestRequestId) {
      if (result.ok) {
        setState(prev => ({
          ...prev,
          connection: 'online',
          busyCommand: null,
          lastResponseText: result.data.led,
          lastLatencyMs: result.latencyMs,
          lastUpdatedAt: new Date(),
          error: null,
        }));

        updateCommandLog(requestId, {
          status: 'success',
          responseText: result.data.led,
          latencyMs: result.latencyMs,
        });
      } else {
        setState(prev => ({
          ...prev,
          connection: 'offline',
          busyCommand: null,
          error: result.error,
        }));

        updateCommandLog(requestId, {
          status: 'error',
          errorMessage: result.error,
        });
      }
    } else {
      console.warn('Ignoring stale response for', requestId);
    }
  };

  return (
    <View>
      <Text>Connection: {state.connection}</Text>
      <Text>Last Response: {state.lastResponseText}</Text>
      <Text>Latency: {state.lastLatencyMs}ms</Text>

      <Button
        title="Toggle LED"
        onPress={() => sendCommand('toggle')}
        disabled={state.busyCommand !== null}
      />

      {state.error && (
        <Text style={{ color: 'red' }}>{state.error}</Text>
      )}

      {/* Command Log */}
      <Text>Recent Commands:</Text>
      {state.commandLog.map(entry => (
        <Text key={entry.id}>
          {entry.command} - {entry.status} - {entry.latencyMs}ms
        </Text>
      ))}
    </View>
  );
}
```

---

## State Rules (Invariants)

### Rule 1: Only ONE busy command at a time
```typescript
// ✅ Good
state.busyCommand === null || state.busyCommand === 'toggle'

// ❌ Bad (impossible state)
state.busyCommand === 'toggle' && state.busyCommand === 'on'
```

### Rule 2: busyCommand !== null ⟹ latestRequestId !== null
```typescript
// If busy, there must be a request ID
if (state.busyCommand !== null) {
  assert(state.latestRequestId !== null);
}
```

### Rule 3: Only apply responses matching latestRequestId
```typescript
// ✅ Good
if (responseId === state.latestRequestId) {
  applyResponse(response);
}

// ❌ Bad
applyResponse(response); // No check!
```

### Rule 4: Command log is append-only (never modified)
```typescript
// ✅ Good
commandLog: [newEntry, ...prev.commandLog.slice(0, 9)]

// ❌ Bad
commandLog: prev.commandLog.filter(...) // Lost history
```

### Rule 5: lastUpdatedAt only changes on successful response
```typescript
// ✅ Good
if (result.ok && responseId === latestRequestId) {
  lastUpdatedAt: new Date()
}

// ❌ Bad
lastUpdatedAt: new Date() // Updated even on error
```

---

## Connection Status Logic

### Determining Connection State

```typescript
function updateConnectionStatus(result: DeviceResult<any>) {
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
```

### Connection Status Display

```typescript
function ConnectionIndicator({ status }: { status: ConnectionStatus }) {
  const colors = {
    online: 'green',
    offline: 'red',
    unknown: 'gray',
  };

  const labels = {
    online: '🟢 Connected',
    offline: '🔴 Offline',
    unknown: '⚪ Unknown',
  };

  return (
    <View style={{ backgroundColor: colors[status] }}>
      <Text>{labels[status]}</Text>
    </View>
  );
}
```

---

## Command Log Display

### Recent Commands Component

```typescript
function CommandLog({ entries }: { entries: CommandLogEntry[] }) {
  return (
    <ScrollView>
      {entries.map(entry => (
        <View key={entry.id} style={styles.logEntry}>
          <Text>{formatTime(entry.timestamp)}</Text>
          <Text>{entry.command}</Text>
          <StatusBadge status={entry.status} />
          {entry.latencyMs && <Text>{entry.latencyMs}ms</Text>}
          {entry.errorMessage && (
            <Text style={{ color: 'red' }}>{entry.errorMessage}</Text>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

function StatusBadge({ status }: { status: CommandLogEntry['status'] }) {
  const icons = {
    pending: '⏳',
    success: '✅',
    error: '❌',
  };

  return <Text>{icons[status]}</Text>;
}
```

---

## Advanced: Optimistic Updates

### With Rollback on Error

```typescript
async function toggleLedOptimistic() {
  const requestId = generateRequestId();

  // Optimistic update (assume success)
  const previousState = state.lastResponseText;
  const optimisticValue = previousState === 'on' ? 'off' : 'on';

  setState(prev => ({
    ...prev,
    busyCommand: 'toggle',
    latestRequestId: requestId,
    lastResponseText: optimisticValue, // Optimistic!
  }));

  const result = await deviceClient.led(state.deviceIp, 'toggle');

  if (requestId === state.latestRequestId) {
    if (result.ok) {
      // Success: keep optimistic value (or use real value)
      setState(prev => ({
        ...prev,
        busyCommand: null,
        lastResponseText: result.data.led, // Use real value
        lastLatencyMs: result.latencyMs,
        lastUpdatedAt: new Date(),
      }));
    } else {
      // Error: rollback optimistic update
      setState(prev => ({
        ...prev,
        busyCommand: null,
        lastResponseText: previousState, // Rollback!
        error: result.error,
      }));
    }
  }
}
```

---

## Testing Checklist

### Race Condition Tests

- [ ] Send 2 requests quickly, verify only latest response applies
- [ ] Cancel request mid-flight, verify response is ignored
- [ ] Send request, change screen, come back, verify stale response ignored

### Connection Status Tests

- [ ] Success response → connection = 'online'
- [ ] Timeout error → connection = 'offline'
- [ ] Network error → connection = 'offline'
- [ ] HTTP 404 → connection = 'online' (device responded)

### Command Log Tests

- [ ] New command appears at top of log
- [ ] Log never exceeds 10 entries
- [ ] Pending → Success transition updates entry
- [ ] Pending → Error transition updates entry
- [ ] Timestamps are accurate

### Busy State Tests

- [ ] Buttons disabled when busyCommand !== null
- [ ] Loading spinner shows when busy
- [ ] Busy state clears on success
- [ ] Busy state clears on error

---

## Common Mistakes to Avoid

### ❌ Mistake 1: No Request ID Tracking
```typescript
// BAD: No way to detect stale responses
const result = await deviceClient.led(ip, 'toggle');
setState({ lastResponseText: result.data.led }); // Race condition!
```

### ❌ Mistake 2: Applying All Responses
```typescript
// BAD: Applies every response, even stale ones
if (result.ok) {
  setState({ lastResponseText: result.data.led }); // No check!
}
```

### ❌ Mistake 3: Not Clearing Busy State on Error
```typescript
// BAD: busyCommand stays set forever
if (result.ok) {
  setState({ busyCommand: null }); // Only clears on success!
}
```

### ❌ Mistake 4: Modifying Command Log
```typescript
// BAD: Loses history
setState({
  commandLog: prev.commandLog.map(...) // Mutating history
});
```

---

## Summary

### Key Principles

1. **Request ID Tracking** - Every request gets unique ID
2. **Latest Wins** - Only apply responses matching latest request
3. **Single Source of Truth** - State drives UI, not vice versa
4. **Immutable History** - Command log is append-only
5. **Clear Busy State** - Always clear on success OR error

### Benefits

✅ No race conditions
✅ No stale data
✅ No "UI lies"
✅ Debuggable history
✅ Predictable state transitions

---

## References

- [ui-contract.md](ui-contract.md) - API specification
- [deviceClient.ts](../src/lib/deviceClient.ts) - Client implementation
- [deviceClient.example.ts](../src/lib/deviceClient.example.ts) - Usage examples

---

**Next Steps:**
1. Implement this state model in your screen
2. Add request ID tracking to all commands
3. Test race conditions thoroughly
4. Monitor command log in development
