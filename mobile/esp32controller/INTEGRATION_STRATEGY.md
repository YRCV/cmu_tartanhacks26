# Integration Strategy: UI Shell → Production Backend

## Overview

This document outlines how to integrate the polished UI shell with the production Dedalus Labs backend when ready.

## Current Architecture

### UI Shell (feature/ui-shell)
```
Mobile App (React Native/Expo)
├── Screens (5 complete flows)
├── Components (12+ custom components)
├── Mock Data (hardcoded in screens)
└── Dev Mode Banner (visual indicator)
```

### Production Backend (agent-pipeline-integration)
```
Dedalus Labs SDK
├── Python Pipeline (test_dir/firmware_pipeline.py)
│   ├── AsyncDedalus client
│   ├── LLM routing
│   └── Firmware generation/validation
├── ESP32 Firmware
│   ├── AI-generated code (firmware/src/ai.cpp)
│   ├── Web server for control
│   └── OTA update support
└── Minimal Mobile App (basic LED control)
```

## Integration Plan

### Phase 1: API Layer Setup

#### 1.1 Backend API Service
Create a REST/WebSocket API to bridge mobile app and Python pipeline:

```python
# backend/api_server.py
from fastapi import FastAPI, WebSocket
from dedalus_labs import AsyncDedalus, DedalusRunner

app = FastAPI()

@app.post("/api/firmware/generate")
async def generate_firmware(request: FirmwareRequest):
    """
    Endpoint for mobile app to request firmware generation
    Input: { "intent": "user's natural language description" }
    Output: { "code": "...", "reasoning": "...", "config": {...} }
    """
    client = AsyncDedalus()
    runner = DedalusRunner(client)
    # ... firmware generation logic from firmware_pipeline.py
    return result

@app.websocket("/ws/device/{device_id}")
async def device_stream(websocket: WebSocket, device_id: str):
    """
    WebSocket for real-time device data streaming
    """
    # Stream sensor data, logs, status updates
    pass
```

#### 1.2 Mobile Client Service
Create abstraction layer in mobile app:

```typescript
// mobile/esp32controller/src/services/dedalusApi.ts

export interface FirmwareGenerationRequest {
  intent: string;
  deviceType?: string;
  constraints?: Record<string, any>;
}

export interface FirmwareGenerationResponse {
  success: boolean;
  code: string;
  reasoning: string[];
  config: DeviceConfig;
  estimatedCompileTime?: number;
}

export class DedalusApiClient {
  private baseUrl: string;
  private wsClient: WebSocket | null = null;

  constructor() {
    // Use environment variable for API URL
    this.baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
  }

  async generateFirmware(request: FirmwareGenerationRequest): Promise<FirmwareGenerationResponse> {
    const response = await fetch(`${this.baseUrl}/api/firmware/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return response.json();
  }

  connectDeviceStream(deviceId: string, callbacks: {
    onData: (data: any) => void;
    onError: (error: Error) => void;
  }) {
    this.wsClient = new WebSocket(`${this.baseUrl.replace('http', 'ws')}/ws/device/${deviceId}`);
    this.wsClient.onmessage = (event) => callbacks.onData(JSON.parse(event.data));
    this.wsClient.onerror = (error) => callbacks.onError(new Error('WebSocket error'));
  }
}
```

#### 1.3 Mock/Real Toggle Hook
Create hook that switches between mock and real data:

```typescript
// mobile/esp32controller/src/hooks/useDedalusClient.ts

import { useDevMode } from '@/src/components/ui/DevModeBanner';
import { DedalusApiClient } from '@/src/services/dedalusApi';
import { MockDedalusClient } from '@/src/services/dedalusApi.mock';

export const useDedalusClient = () => {
  const { isDevMode } = useDevMode();

  // Return mock client in dev mode, real client in production
  const client = useMemo(() => {
    return isDevMode ? new MockDedalusClient() : new DedalusApiClient();
  }, [isDevMode]);

  return client;
};
```

### Phase 2: Screen Integration

#### 2.1 Intent Input Screen ([index.tsx](app/index.tsx))
**Changes needed:**
```typescript
// Replace mock timeout with real API call
const handleDeploy = async () => {
  const client = useDedalusClient();

  try {
    setIsLoading(true);
    setLoadingText('Understanding your intent...');

    const result = await client.generateFirmware({ intent });

    // Store result in context/state for review screen
    setGeneratedFirmware(result);

    router.push('/review');
  } catch (error) {
    setError('Failed to generate firmware. Please try again.');
  } finally {
    setIsLoading(false);
  }
};
```

#### 2.2 Review Screen ([review.tsx](app/review.tsx))
**Changes needed:**
```typescript
// Replace mock data with context/props from generation
const ReviewScreen = () => {
  const { generatedFirmware } = useGeneratedFirmwareContext();

  // Display real code, reasoning, and config
  const { code, reasoning, config } = generatedFirmware;

  // Deploy to ESP32 via OTA
  const handleDeploy = async () => {
    // Compile code
    // Upload to ESP32
    // Monitor deployment
  };
};
```

#### 2.3 Control Screen ([control.tsx](app/control.tsx))
**Changes needed:**
```typescript
// Replace mock controls with dynamically generated schema
const ControlScreen = () => {
  const client = useDedalusClient();
  const [controls, setControls] = useState([]);

  useEffect(() => {
    // Connect to device WebSocket
    client.connectDeviceStream(deviceId, {
      onData: (data) => {
        // Update controls with real sensor data
        setControls(data.controls);
      },
      onError: (error) => {
        setConnectionStatus('error');
      },
    });
  }, [deviceId]);

  const handleControlChange = async (id: string, value: any) => {
    // Send command to ESP32
    await client.sendDeviceCommand(deviceId, id, value);
  };
};
```

### Phase 3: ESP32 Communication

#### 3.1 HTTP Endpoints
ESP32 firmware should expose:
```cpp
// GET /api/controls - Return current control schema
// POST /api/control/{id} - Update control value
// GET /api/status - Device health/status
// POST /api/ota - OTA update endpoint
```

#### 3.2 WebSocket Stream
For real-time sensor data:
```cpp
// WS /ws - Stream sensor updates
// Format: { "controls": [{ "id": "c1", "value": 24.5 }, ...] }
```

### Phase 4: OTA Update Flow

#### 4.1 Compilation Service
Backend service to compile generated code:
```python
# backend/compiler.py
import subprocess

async def compile_firmware(code: str) -> bytes:
    """
    Compile C++ code for ESP32 using PlatformIO/Arduino CLI
    Returns: compiled binary
    """
    # Write code to temp file
    # Run: arduino-cli compile --fqbn esp32:esp32:esp32
    # Return .bin file
    pass
```

#### 4.2 OTA Upload
Mobile app triggers compilation and upload:
```typescript
const deployFirmware = async (code: string) => {
  // 1. Send code to backend for compilation
  const binary = await client.compileFirmware(code);

  // 2. Upload to ESP32 via HTTP
  await uploadToDevice(deviceIp, binary, {
    onProgress: (percent) => setUploadProgress(percent),
  });

  // 3. Monitor reboot and reconnection
};
```

## Environment Configuration

### Development Mode (.env)
```bash
EXPO_PUBLIC_MOCK_DEVICE=true
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_ESP_IP=192.168.1.100
```

### Production Mode (.env.production)
```bash
EXPO_PUBLIC_MOCK_DEVICE=false
EXPO_PUBLIC_API_URL=https://api.dedaluslabs.com
EXPO_PUBLIC_ESP_IP=  # User inputs in app
```

## Migration Checklist

- [ ] Set up FastAPI backend service
- [ ] Implement firmware generation endpoint
- [ ] Create WebSocket streaming endpoint
- [ ] Build DedalusApiClient in mobile app
- [ ] Create MockDedalusClient matching real API interface
- [ ] Add useDedalusClient hook with dev mode toggle
- [ ] Update index.tsx to use real API
- [ ] Update review.tsx with real generation results
- [ ] Update control.tsx with WebSocket streaming
- [ ] Implement ESP32 HTTP endpoints
- [ ] Implement ESP32 WebSocket server
- [ ] Add compilation service (PlatformIO/Arduino CLI)
- [ ] Implement OTA update flow
- [ ] Add error handling and retry logic
- [ ] Test end-to-end flow
- [ ] Performance testing (latency, memory, battery)
- [ ] Security review (authentication, encryption)

## Data Flow

### Firmware Generation Flow
```
User Input (mobile)
  ↓
Intent → Backend API → Dedalus SDK → LLM
  ↓
Generated Code + Reasoning
  ↓
Review Screen (mobile)
  ↓
Deploy Button → Compile → Upload to ESP32
  ↓
Device Running New Firmware
```

### Real-Time Control Flow
```
ESP32 Sensors
  ↓
WebSocket → Backend → Mobile App
  ↓
UI Updates (gauges, readouts)

User Interaction (slider, toggle)
  ↓
Mobile → Backend → ESP32 HTTP
  ↓
Actuator Changes
```

## Testing Strategy

### Unit Tests
- Test DedalusApiClient methods
- Test mock client matches real client interface
- Test state management in screens

### Integration Tests
- Test full generation flow with real backend
- Test WebSocket connection and reconnection
- Test OTA update process

### E2E Tests (Maestro)
- Keep existing Maestro tests for UI
- Add tests for real API integration
- Test error scenarios

## Gradual Migration Path

### Option 1: Feature Flags
Add granular toggles:
```typescript
const features = {
  useLiveGeneration: process.env.EXPO_PUBLIC_FEATURE_LIVE_GEN === 'true',
  useLiveStreaming: process.env.EXPO_PUBLIC_FEATURE_LIVE_STREAM === 'true',
  useOtaUpload: process.env.EXPO_PUBLIC_FEATURE_OTA === 'true',
};
```

### Option 2: Branch Strategy
1. Keep `feature/ui-shell` for pure UI development
2. Create `feature/integration` from `agent-pipeline-integration`
3. Bring over components one-by-one
4. Test each integration incrementally
5. Merge to main when complete

## Recommended Next Steps

1. **Backend First**: Set up FastAPI service with /generate endpoint
2. **Client Layer**: Build DedalusApiClient and MockDedalusClient
3. **One Screen**: Integrate just the index.tsx → review.tsx flow
4. **Test**: Verify end-to-end generation works
5. **Expand**: Add WebSocket streaming for control screen
6. **Polish**: Add loading states, error handling, edge cases
7. **OTA**: Implement compilation and deployment flow

## Questions to Answer

- [ ] Where will the backend API be hosted? (AWS, GCP, local?)
- [ ] How should authentication work? (API keys, OAuth, etc.)
- [ ] Should compilation happen on backend or mobile device?
- [ ] What's the error handling strategy? (retries, fallbacks)
- [ ] How to handle offline mode? (cache, queue commands)
- [ ] What analytics/monitoring to add?

---

**Remember**: Keep the dev mode toggle working even in production. It's useful for:
- Demos without hardware
- UI testing and screenshots
- Rapid iteration without waiting for backend
- Offline development
