# UI Contract: ESP32 Controller API

**Version:** 1.0
**Last Updated:** 2026-02-07
**Purpose:** This document defines the stable contract between the mobile UI and ESP32 backend, ensuring UI development can proceed independently of backend changes.

---

## Base Configuration

- **Default Port:** `80`
- **Protocol:** `http://`
- **Base URL Format:** `http://{ESP32_IP_ADDRESS}`
- **Timeout:** 5000ms (recommended)
- **Content-Type:** `text/plain` (for most responses)

---

## Available Endpoints

### 1. Root Endpoint - Health Check

**Endpoint:** `/`
**Method:** `GET`
**Purpose:** Verify ESP32 is reachable and responding

**Success Response:**
```
Status: 200 OK
Body: "Hello from ESP32!"
```

**UI States:**
- `idle` - Not yet checked
- `sending` - Request in flight
- `success` - ESP32 is online
- `error` - ESP32 is unreachable or timeout
- `lastUpdated` - Timestamp of last successful check

**Use Cases:**
- Initial connection validation
- Periodic health checks
- Connection status indicator

---

### 2. LED On

**Endpoint:** `/led/on`
**Method:** `GET`
**Purpose:** Turn the LED on

**Success Response:**
```
Status: 200 OK
Body: "LED is now ON"
```

**UI States:**
- `idle` - LED state unknown or unchanged
- `sending` - Command being sent to ESP32
- `success` - LED confirmed ON
- `error` - Command failed
- `lastUpdated` - Timestamp of last successful command

**Visual Feedback:**
- Show loading indicator while `sending`
- Update LED icon/color on `success`
- Show error toast on `error`

---

### 3. LED Off

**Endpoint:** `/led/off`
**Method:** `GET`
**Purpose:** Turn the LED off

**Success Response:**
```
Status: 200 OK
Body: "LED is now OFF"
```

**UI States:**
- `idle` - LED state unknown or unchanged
- `sending` - Command being sent to ESP32
- `success` - LED confirmed OFF
- `error` - Command failed
- `lastUpdated` - Timestamp of last successful command

**Visual Feedback:**
- Show loading indicator while `sending`
- Update LED icon/color on `success`
- Show error toast on `error`

---

### 4. LED Toggle

**Endpoint:** `/led/toggle`
**Method:** `GET`
**Purpose:** Toggle LED between ON and OFF states

**Success Responses:**
```
Status: 200 OK
Body: "LED toggled to ON"
  OR
Body: "LED toggled to OFF"
```

**UI States:**
- `idle` - No toggle operation pending
- `sending` - Toggle command in flight
- `success` - Toggle completed, parse response for new state
- `error` - Toggle failed
- `lastUpdated` - Timestamp of last successful toggle

**State Parsing:**
- Parse response body to extract "ON" or "OFF"
- Update UI to reflect current LED state
- Consider maintaining local state that syncs on success

**Visual Feedback:**
- Disable toggle button while `sending`
- Animate transition on `success`
- Show error toast and maintain previous state on `error`

---

### 5. OTA Update

**Endpoint:** `/ota/update?url={FIRMWARE_URL}`
**Method:** `GET`
**Purpose:** Trigger Over-The-Air firmware update

**Query Parameters:**
- `url` (required) - Full HTTP URL to firmware binary (.bin file)

**Example Request:**
```
GET /ota/update?url=http://192.168.1.100:8000/firmware.bin
```

**Success Response:**
```
Status: 200 OK
Body: "OTA Update started..."
```

**UI States:**
- `idle` - No update in progress
- `sending` - Update request sent (may take 10-30 seconds)
- `success` - Update started (ESP32 will reboot)
- `error` - Update failed to start
- `lastUpdated` - Timestamp of last update attempt

**Special Considerations:**
- **Long Operation:** OTA updates take time; expect 10-30 second delays
- **Connection Loss:** ESP32 will disconnect during reboot
- **Extended Timeout:** Use 30000ms timeout for this endpoint
- **Post-Update:** Wait 5-10 seconds after success before attempting reconnection
- **No Progress Updates:** ESP32 doesn't provide streaming progress

**Visual Feedback:**
- Show modal/overlay during `sending` with progress indicator
- Display warning that connection will be lost temporarily
- Auto-retry health check after success (with delay)
- Show detailed error message on failure

---

## Known Failure Modes

### 1. Network Timeout
**Symptom:** Request exceeds timeout duration
**Status Code:** None (network error)
**Common Causes:**
- ESP32 is powered off
- Wrong IP address
- ESP32 not on same network
- ESP32 WiFi disconnected

**UI Handling:**
```typescript
catch (error) {
  if (error.name === 'AbortError' || error.message.includes('timeout')) {
    // Show "ESP32 not responding - check connection"
  }
}
```

---

### 2. 404 Not Found
**Symptom:** Endpoint doesn't exist
**Status Code:** `404`
**Common Causes:**
- Typo in endpoint URL
- Firmware version mismatch
- Endpoint not implemented in current firmware

**UI Handling:**
```typescript
if (response.status === 404) {
  // Show "Command not supported - firmware update may be required"
}
```

---

### 3. CORS Issues
**Symptom:** Request blocked by browser (web-only)
**Status Code:** None (CORS error)
**Common Causes:**
- Running in web browser instead of native app
- Development server configuration

**UI Handling:**
- Should not occur in React Native apps (native HTTP)
- If building web version, document CORS limitations
- Consider proxy server for web development

---

### 4. Connection Refused
**Symptom:** TCP connection fails immediately
**Status Code:** None (network error)
**Common Causes:**
- ESP32 web server not started
- Firewall blocking connection
- IP address changed

**UI Handling:**
```typescript
catch (error) {
  if (error.message.includes('ECONNREFUSED')) {
    // Show "Cannot connect to ESP32 - verify IP address"
  }
}
```

---

### 5. Invalid IP Address
**Symptom:** Request fails immediately with format error
**Status Code:** None (validation error)
**Common Causes:**
- User entered malformed IP
- Empty IP field

**UI Handling:**
- Validate IP format before sending request
- Regex: `/^(\d{1,3}\.){3}\d{1,3}$/`
- Additional check: each octet 0-255

---

### 6. OTA Update Failures
**Symptom:** Update starts but ESP32 doesn't respond
**Status Code:** May be 200 or timeout
**Common Causes:**
- Invalid firmware URL
- Firmware binary corrupted
- Incompatible firmware version
- Insufficient ESP32 memory

**UI Handling:**
- Wait for full timeout period
- Attempt health check after delay
- If health check fails, show "Update may have failed - check ESP32"
- If health check succeeds, show "Update successful"

---

## UI State Machine

### Recommended State Type
```typescript
type RequestState =
  | { status: 'idle' }
  | { status: 'sending'; startedAt: number }
  | { status: 'success'; data: string; timestamp: number }
  | { status: 'error'; error: string; timestamp: number };
```

### State Transitions

```
idle ──[user action]──> sending
                           │
         ┌─────────────────┴─────────────────┐
         ↓                                   ↓
      success                              error
         │                                   │
         └─────────[timeout/user action]─────┘
                         ↓
                       idle
```

### Example State Management
```typescript
const [ledState, setLedState] = useState<RequestState>({ status: 'idle' });

async function toggleLED() {
  setLedState({ status: 'sending', startedAt: Date.now() });

  try {
    const response = await fetch(`http://${esp32IP}/led/toggle`, {
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      const data = await response.text();
      setLedState({
        status: 'success',
        data,
        timestamp: Date.now()
      });
    } else {
      setLedState({
        status: 'error',
        error: `HTTP ${response.status}`,
        timestamp: Date.now()
      });
    }
  } catch (error) {
    setLedState({
      status: 'error',
      error: error.message,
      timestamp: Date.now()
    });
  }
}
```

---

## Response Body Examples

### Success Responses
```
"Hello from ESP32!"              // Root endpoint
"LED is now ON"                  // /led/on
"LED is now OFF"                 // /led/off
"LED toggled to ON"              // /led/toggle (when turning on)
"LED toggled to OFF"             // /led/toggle (when turning off)
"OTA Update started..."          // /ota/update
```

### Parsing Guidelines
- All responses are plain text
- Use `.includes()` for state detection
- Example: `response.includes("ON")` to detect LED is on
- Don't rely on exact string match (allows backend flexibility)

---

## Recommended Timeouts

| Endpoint | Timeout | Rationale |
|----------|---------|-----------|
| `/` | 5000ms | Quick health check |
| `/led/on` | 5000ms | Simple command |
| `/led/off` | 5000ms | Simple command |
| `/led/toggle` | 5000ms | Simple command |
| `/ota/update` | 30000ms | Long-running operation |

---

## Error Message Guidelines

### User-Facing Error Messages

| Error Type | User Message |
|------------|--------------|
| Timeout | "ESP32 not responding. Check that it's powered on and connected to WiFi." |
| 404 | "Command not supported. Firmware update may be required." |
| Connection Refused | "Cannot connect to ESP32. Verify the IP address is correct." |
| Invalid IP | "Invalid IP address format. Please enter a valid IP (e.g., 192.168.1.100)." |
| OTA Timeout | "Update taking longer than expected. ESP32 may be rebooting..." |
| Generic Error | "Command failed. Check your connection and try again." |

---

## Testing Checklist

### Manual Testing Scenarios
- [ ] Test with ESP32 powered off (expect timeout)
- [ ] Test with wrong IP address (expect timeout/connection refused)
- [ ] Test each endpoint with ESP32 online (expect success)
- [ ] Test rapid successive calls (ensure state updates correctly)
- [ ] Test OTA update with valid firmware (expect success + reboot)
- [ ] Test OTA update with invalid URL (expect error or timeout)
- [ ] Test network disconnection during request (expect timeout)

### UI State Testing
- [ ] Verify loading indicators appear during `sending`
- [ ] Verify success feedback is clear and immediate
- [ ] Verify error messages are user-friendly
- [ ] Verify states reset appropriately (idle after timeout)
- [ ] Verify lastUpdated timestamps update correctly
- [ ] Verify no race conditions with rapid button presses

---

## Future Considerations

### Potential API Changes (Not Yet Implemented)
- JSON responses instead of plain text
- WebSocket for real-time updates
- Authentication/authorization
- Batch commands
- LED brightness control (PWM)
- Status endpoint returning JSON with all states

### Backward Compatibility Strategy
- UI should gracefully handle missing endpoints (404)
- UI should parse response bodies flexibly (substring matching)
- Version negotiation if JSON responses are added
- Consider `/version` endpoint to detect firmware capabilities

---

## Notes for UI Developers

1. **Always validate IP before sending requests** - saves network time and provides immediate feedback
2. **Use AbortSignal for timeouts** - ensures requests don't hang indefinitely
3. **Maintain local state optimistically** - update UI immediately, rollback on error
4. **Debounce rapid actions** - prevent overwhelming ESP32 with requests
5. **Log failed requests** - helps with debugging connection issues
6. **Test on actual device** - React Native simulator may behave differently
7. **Handle platform differences** - iOS vs Android networking can vary
8. **Consider offline mode** - cache last known ESP32 state

---

## Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-07 | Initial contract definition with all existing endpoints |

---

## Contact & Support

If the ESP32 backend changes in ways that break this contract, update this document first before modifying the UI. This ensures the UI team always has a stable reference point.
