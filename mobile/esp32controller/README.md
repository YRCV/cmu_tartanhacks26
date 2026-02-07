# ESP32 Controller - Mobile App

A React Native (Expo) mobile app for controlling ESP32 devices over local WiFi.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Run on your device
# Scan the QR code with Expo Go app
```

## 📱 Features

- ✅ LED Control (On/Off/Toggle)
- ✅ Over-The-Air (OTA) Updates
- ✅ Real-time device status monitoring
- ✅ Network latency tracking
- ✅ Comprehensive error handling

## 🏗️ Project Structure

```
mobile/esp32controller/
├── app/                    # Expo Router app directory
│   └── (tabs)/
│       └── index.tsx      # Main LED control screen
├── src/
│   └── lib/
│       ├── deviceClient.ts           # Main device communication client
│       ├── deviceClient.example.ts   # Usage examples
│       └── deviceClient.test.ts      # Test cases
├── docs/                   # Documentation
│   ├── ui-contract.md               # API contract (SOURCE OF TRUTH)
│   ├── deviceClient-summary.md      # Client architecture overview
│   ├── architecture-diagram.md      # Visual architecture
│   ├── migration-guide.md           # Refactoring guide
│   └── QUICKSTART.md                # Quick implementation guide
└── README.md              # This file
```

## 📚 Documentation Index

### For UI Developers
1. **Start here:** [QUICKSTART.md](docs/QUICKSTART.md) - Get up and running in 5 minutes
2. **API Reference:** [ui-contract.md](docs/ui-contract.md) - Complete endpoint documentation
3. **Examples:** [deviceClient.example.ts](src/lib/deviceClient.example.ts) - Copy-paste code samples

### For Backend Developers
- [ui-contract.md](docs/ui-contract.md) - Expected API behavior and responses

### For Architects
- [architecture-diagram.md](docs/architecture-diagram.md) - System overview
- [deviceClient-summary.md](docs/deviceClient-summary.md) - Client design rationale

### For Refactoring
- [migration-guide.md](docs/migration-guide.md) - Step-by-step migration from inline fetch

## 🔌 Device Client API

The `deviceClient` provides a clean, type-safe interface for ESP32 communication:

```typescript
import { deviceClient } from '@/src/lib/deviceClient';

// Get device status
const status = await deviceClient.getStatus('192.168.1.100');

// Control LED
const result = await deviceClient.led('192.168.1.100', 'toggle');

// OTA update
const ota = await deviceClient.otaUpdate(
  '192.168.1.100',
  'http://example.com/firmware.bin'
);

// With cancellation
const controller = new AbortController();
const result = await deviceClient.led('192.168.1.100', 'on', {
  signal: controller.signal
});
```

See [deviceClient.example.ts](src/lib/deviceClient.example.ts) for complete examples.

## 🎯 Key Benefits

### 1. **Type Safety**
All requests and responses are fully typed with TypeScript.

### 2. **Mockable**
Easy to mock for testing and development without hardware:
```typescript
const mockClient = {
  getStatus: async () => ({ ok: true, data: { status: 'ok' } }),
  led: async () => ({ ok: true, data: { led: 'on' } }),
  // ...
};
```

### 3. **Error Handling**
Comprehensive error detection with user-friendly messages:
- Network timeouts
- Invalid IPs
- CORS issues
- Device offline
- Invalid firmware URLs

### 4. **Performance Tracking**
Every response includes `latencyMs` for monitoring network performance.

### 5. **Cancellation Support**
Built-in AbortController support for cancelling requests.

## 🔧 Configuration

### Timeouts (in ui-contract.md)
- LED commands: 5 seconds
- OTA updates: 30 seconds
- Status checks: 5 seconds

### Base URL
Device IP is provided per-request (no global configuration needed).

## 🧪 Testing

Run the test suite:
```bash
# Manual testing
npm test

# Or use the test file directly
npx tsx src/lib/deviceClient.test.ts
```

See [deviceClient.test.ts](src/lib/deviceClient.test.ts) for test scenarios.

## 📋 API Contract

All ESP32 endpoints are documented in [ui-contract.md](docs/ui-contract.md):

| Endpoint | Method | Purpose | Timeout |
|----------|--------|---------|---------|
| `/` | GET | Device status | 5s |
| `/led/on` | GET | Turn LED on | 5s |
| `/led/off` | GET | Turn LED off | 5s |
| `/led/toggle` | GET | Toggle LED | 5s |
| `/ota/update?url=...` | GET | OTA firmware update | 30s |

## 🚦 UI States

Every request follows this state machine:

```
idle → sending → success → lastUpdated
                ↓ error
```

See [ui-contract.md](docs/ui-contract.md) for TypeScript state types and examples.

## 🐛 Known Issues & Workarounds

### CORS in Development
If testing from web, the ESP32 must send proper CORS headers. See ui-contract for details.

### Network Timeouts
Mobile networks can be slow. Increase timeouts if needed:
```typescript
const result = await deviceClient.led(ip, 'on', {
  timeoutMs: 10000 // 10 seconds
});
```

### IP Discovery
This app requires manual IP entry. For automatic discovery, consider:
- mDNS (esp32.local)
- SSDP/UPnP discovery
- QR code scanning

## 🔄 Migration from Inline Fetch

See [migration-guide.md](docs/migration-guide.md) for step-by-step instructions.

**Quick comparison:**
```typescript
// ❌ Old (inline fetch)
const response = await fetch(`http://${espIp}/led/toggle`, {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
});

// ✅ New (deviceClient)
const result = await deviceClient.led(espIp, 'toggle');
```

## 🎨 UI Integration Examples

### React State Integration
```typescript
const [ledState, setLedState] = useState<'on' | 'off' | 'unknown'>('unknown');
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const handleToggle = async () => {
  setLoading(true);
  setError(null);

  const result = await deviceClient.led(ip, 'toggle');

  if (result.ok) {
    setLedState(result.data.led);
  } else {
    setError(result.error);
  }

  setLoading(false);
};
```

See [deviceClient.example.ts](src/lib/deviceClient.example.ts) for complete React component examples.

## 📖 Further Reading

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [ESP32 OTA Updates](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/system/ota.html)

## 🤝 Contributing

1. Check [ui-contract.md](docs/ui-contract.md) before making API changes
2. Update documentation when adding features
3. Add tests for new functionality
4. Follow TypeScript best practices

---

**Need help?** Start with [QUICKSTART.md](docs/QUICKSTART.md) or check the [examples](src/lib/deviceClient.example.ts).
