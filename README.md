# Forge

<img width="490" height="259" alt="esp32" src="https://github.com/user-attachments/assets/61a3bec6-ef10-4fa6-a372-ad33ca7abac2" />

AI-powered embedded development from your phone. No laptop required.

Forge brings hardware programming to everyone by combining natural language AI with over-the-air firmware updates. Describe what you want to build, and Forge generates the code, compiles it, and flashes your ESP32 wirelessly. All from your phone.

## The Problem

Most people do not know how to get started with hardware, and many do not have the tools to do so. Traditional embedded development requires:
- Desktop IDE (Arduino, PlatformIO)
- USB connection for every code change
- Manual pin configuration and wiring knowledge
- Separate tools for compilation, flashing, and control interfaces

## Our Solution

Forge is a mobile-first development platform that lets you:
1. Describe your project in plain language - "Make an LED blink every 500ms on pin 2"
2. AI generates hardware-aware code - Knows what's connected and which pins to use
3. Automatic compilation and OTA updates - Code is compiled in the cloud and flashed wirelessly
4. Auto-generated control interface - GUI appears based on your components (sliders, buttons, toggles)

## How It Works
```
[Mobile App] -> [AI Backend] -> [ESP32 Hardware]
     |              |               |
  Voice/Text   Dedalus Labs    OTA Firmware
  Input        Code Gen         Updates
               + Compile
```

Workflow:
1. User speaks or types intent: "Add a servo on pin 9 that sweeps back and forth"
2. Dedalus AI generates Arduino code with full hardware context
3. Backend compiles firmware using PlatformIO
4. ESP32 receives OTA update wirelessly
5. App displays auto-generated controls for the servo
6. User interacts with hardware immediately

## Key Features

### Hardware-Aware AI

### True Mobile Development
- Write code with natural language
- No laptop required after initial setup
- Iterate and debug from your phone
- Voice or text input

### Instant Updates
- Over-the-air firmware flashing
- No USB cable needed
- See changes immediately

### Auto-Generated GUI
- Controls appear based on your components
- Sliders for servos and motors
- Toggles for LEDs
- Indicators for sensors
- No manual interface building

## Tech Stack

**Mobile App:** React Native + Expo  
**AI Backend:** Dedalus Labs (LLM-powered code generation)  
**Compilation:** PlatformIO CLI  
**Hardware:** ESP32 with ArduinoOTA  
**Communication:** REST API + WiFi OTA updates  
Forge - Where hardware begins.

Bringing the fire of development to everyone.
