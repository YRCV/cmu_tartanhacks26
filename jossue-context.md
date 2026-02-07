# TartanHacks 2026 - ESP32 IoT Controller

## What This Project Does

This project lets you control an ESP32 microcontroller from a mobile app over WiFi — and update its firmware remotely without re-flashing over USB. An AI-powered pipeline can also generate and validate new firmware code on the fly. Right now the hardware demo toggles the built-in LED, but the architecture supports extending to any GPIO-controlled hardware.

## Architecture

```
┌──────────────────┐                        ┌──────────────────┐
│  Dedalus Pipeline│ (generates firmware)   │                  │
│  (Python/LLMs)   │───── .bin file ───────▶│                  │
└──────────────────┘        OTA             │                  │
                                            │   ESP32          │
┌──────────────────┐     HTTP GET/POST      │   (Arduino/C++)  │
│  Mobile App      │ ──────────────────────▶│                  │
│  (Expo/React     │                        │                  │
│   Native)        │ ◀─────────────────────-│                  │
└──────────────────┘   text/plain response  └────────┬─────────┘
                                                     │ GPIO
                                                     ▼
                                                  LED (pin 2)
```

All devices must be on the same WiFi network. The ESP32 gets a local IP and serves HTTP endpoints that the mobile app and OTA pipeline talk to.

## Repository Structure

```
firmware/                        ESP32 embedded code (PlatformIO/Arduino)
├── src/main.cpp                 All firmware logic (~220 lines)
├── platformio.ini.example       Build config template (real .ini is gitignored)
├── include/
├── lib/
└── test/

mobile/esp32controller/          Expo React Native app
├── app/                         Screens (file-based routing via Expo Router)
│   ├── (tabs)/index.tsx         Main control screen (LED buttons, status)
│   └── (tabs)/explore.tsx       Documentation/info screen
├── components/                  Reusable UI (ThemedText, ThemedView, Collapsible, etc.)
├── constants/                   Color themes
├── hooks/                       useColorScheme, useThemeColor
├── app.json                     Expo config
├── package.json                 Dependencies
└── .env.example                 ESP32 IP address template

test_dir/                        AI firmware generation pipeline (dedalus-test branch)
├── firmware_pipeline.py         Orchestrator script
└── firmware_session.json        Conversation history (persisted between runs)
```

## Firmware (ESP32)

**File:** `firmware/src/main.cpp`

The firmware does four things:

1. **Connects to WiFi** using credentials injected at compile time via PlatformIO build flags (`-DWIFI_SSID` and `-DWIFI_PASSWORD` in `platformio.ini`).

2. **Runs an HTTP server** on port 80 with these endpoints:

   | Endpoint              | Method   | Action                                    | Response                              |
   |-----------------------|----------|-------------------------------------------|---------------------------------------|
   | `/`                   | GET      | Returns status + LED state                | `"ESP32 is running! LED Status: ON/OFF"` |
   | `/led/on`             | GET      | Starts LED blinking mode                  | `"LED Blinking Mode ON"`              |
   | `/led/off`            | GET      | Turns LED off and stops blinking          | `"LED OFF"`                           |
   | `/led/toggle`         | GET      | Toggles LED state once                    | `"LED ON"` or `"LED OFF"`            |
   | `/ota/update?url=...` | GET/POST | Downloads a `.bin` from the URL and flashes it | `"Starting OTA update from ..."`  |

3. **Controls GPIO pin 2** (the ESP32 dev board's built-in LED). The `/led/on` endpoint now activates a blink mode (toggles every 2 seconds) instead of a static on — useful for visually confirming firmware updates worked.

4. **Supports Over-The-Air (OTA) updates** via two mechanisms:
   - **HTTP OTA** (`/ota/update?url=<firmware_url>`) — the ESP32 downloads a compiled `.bin` file from the given URL, flashes it, and reboots. This lets you update firmware without physical USB access.
   - **ArduinoOTA** — standard mDNS-based OTA for pushing updates from PlatformIO over the local network. The device advertises itself as `esp32-tartanhacks`.

All responses include CORS headers so the mobile app can make requests without being blocked.

### Building the Firmware

1. Copy `platformio.ini.example` to `platformio.ini`
2. Replace `YOUR_WIFI_SSID_HERE` and `YOUR_WIFI_PASSWORD_HERE` with your network credentials
3. Build and flash with PlatformIO (`pio run -t upload`)
4. Open the serial monitor to see the ESP32's IP address once it connects
5. For subsequent updates, you can use ArduinoOTA or hit the `/ota/update` endpoint instead of USB

## Mobile App

**Main screen:** `mobile/esp32controller/app/(tabs)/index.tsx`

The app is built with Expo (React Native) and TypeScript. It provides:

- A text input for the ESP32's IP address (defaults to the value in `.env`)
- Four buttons: Toggle LED, LED ON, LED OFF, Get Status
- Status display showing the ESP32's response
- Error handling with 3-second timeouts and alert messages

Each button sends an HTTP GET request using Axios to the corresponding ESP32 endpoint and displays the response.

### Running the Mobile App

1. `cd mobile/esp32controller`
2. `npm install`
3. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_ESP_IP` to your ESP32's IP
4. `npm start` (launches Expo dev server)
5. Scan the QR code with Expo Go on your phone

### Key Dependencies

- **expo ~54.0** / **react-native 0.81** - App framework
- **expo-router ~6.0** - File-based navigation
- **axios ^1.13** - HTTP client
- **react 19.1** - UI library

## AI Firmware Pipeline (Dedalus)

**Branch:** `origin/dedalus-test`
**File:** `test_dir/firmware_pipeline.py`

An interactive CLI tool that uses the Dedalus Labs SDK to generate and validate ESP32 firmware with LLMs. It works as a three-stage pipeline:

1. **User describes what they want** — e.g., "Blink LED on ESP32" or "Read temperature from DHT22 sensor"
2. **Generator agent** — uses `grok-code-fast-1` plus web search (Exa, Brave) to research libraries/datasheets and produce firmware code as a structured `CodeResponse`
3. **Validator agent** — uses `grok-4-1-fast-reasoning` to review the generated code against the original request, checking logic and security, and returning a `ValidationResult` report

An orchestrator model (`gpt-4o-mini`) coordinates the generator and validator as tool calls and presents the final result. Conversation history persists to `firmware_session.json` so you can iterate on the code across multiple prompts.

### Key Dependencies

- **dedalus_labs** — Dedalus SDK (`AsyncDedalus`, `DedalusRunner`)
- **pydantic** — Structured output models (`CodeResponse`, `ValidationResult`)
- **python-dotenv** — Environment variable loading

## Communication Protocol

Plain HTTP over the local WiFi network. No authentication, no encryption. The mobile app makes `GET` requests and reads the plain-text response body. The OTA endpoint accepts `GET` or `POST` with a `url` query parameter. This is fine for a hackathon demo on a trusted network but would need TLS and auth for anything beyond that.

## Credentials & Security

Sensitive values are kept out of git:

- **WiFi credentials** — stored in `platformio.ini` (gitignored), injected as build flags
- **ESP32 IP address** — stored in `.env` (gitignored), loaded at runtime by Expo
- **LLM API keys** — loaded via `python-dotenv` from a `.env` file (gitignored)

Template files (`.example` versions) are committed so others know what to configure.

## Branch Overview

| Branch | Purpose |
|--------|---------|
| `main` | Stable base |
| `feature/firmware-mobile-integration` | Initial working mobile + firmware integration |
| `feature/ota-updates` | Adds OTA update support (HTTP + ArduinoOTA), LED blink mode |
| `dedalus-test` | AI-powered firmware generation and validation pipeline |
