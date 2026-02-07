# UI Shell - Development & Testing Environment

## Purpose

This branch (`feature/ui-shell`) is a **UI prototype and testing environment** for the Dedalus Labs mobile application. It allows UI/UX development and iteration independently from the backend AI firmware generation system.

## Branch Strategy

### Production Branch: `agent-pipeline-integration`
- Contains working Dedalus Labs SDK (AI-powered firmware generation)
- Python pipeline for LLM routing and code generation
- ESP32 firmware with AI integration
- Minimal mobile app for demonstration

### UI Shell Branch: `feature/ui-shell` (this branch)
- **Purpose**: UI/UX prototyping and design iteration
- **Focus**: Mobile app interface, components, and user flows
- **Data**: Uses mock data exclusively for testing
- **Goal**: Create a polished UI that can be integrated with real backend later

## Current UI Components

### Screens
1. **[index.tsx](app/index.tsx)** - Intent Input Screen
   - Natural language firmware description input
   - Voice input support (commented out - requires native build)
   - Example prompts for quick testing
   - Character count validation

2. **[review.tsx](app/review.tsx)** - Configuration Review
   - Generated firmware code preview
   - AI reasoning display
   - Deployment controls

3. **[control.tsx](app/control.tsx)** - Device Control Interface
   - Live device controls (gauges, sliders, toggles)
   - Real-time sensor readings simulation
   - Connection status monitoring
   - Create new configuration flow

4. **[diagnostics.tsx](app/diagnostics.tsx)** - System Diagnostics
   - Device health monitoring
   - Performance metrics
   - Debug console

5. **[ota.tsx](app/ota.tsx)** - Over-the-Air Updates
   - Firmware update interface
   - Version management
   - Update progress tracking

### UI Components (`src/components/ui/`)
- **CircularGauge** - Animated gauge for sensor readings
- **CollapsibleConsole** - Expandable console for logs
- **ControlRenderer** - Dynamic control rendering (toggle/slider/gauge/text)
- **GlassAlert** - Glassmorphic alert component
- **GlassCard** - Glassmorphic card container
- **IntentInput** - Multi-line text input for natural language
- **NeumorphicButton** - Neumorphic style buttons
- **PrimaryActionButton** - Main CTA button with loading states
- **ReasoningCard** - Display AI reasoning/explanations
- **StatusBanner** - Connection status indicator
- **VoiceInputButton** - Voice input with visual feedback

### Control Components (`src/components/controls/`)
- **GaugeControl** - Read-only circular gauge
- **SliderControl** - Interactive slider
- **TextReadout** - Read-only text display
- **ToggleControl** - Toggle switch

## Mock Mode

All screens use hardcoded mock data for UI testing. This allows:
- ✅ UI iteration without backend dependency
- ✅ Design system refinement
- ✅ User flow testing
- ✅ Animation and interaction polish
- ✅ Performance optimization

### Environment Configuration

The `.env.example` includes:
```bash
EXPO_PUBLIC_MOCK_DEVICE=true
EXPO_PUBLIC_ESP_IP=192.168.1.100
```

## Design System

### Theme
- **Style**: Modern iOS dark mode
- **Design Language**: Glassmorphism + Neumorphism
- **Framework**: NativeWind (TailwindCSS for React Native)
- **Colors**: Neutral scale with semantic status colors

### Typography
- System fonts with rounded alternatives
- Clear hierarchy (4xl → xs)
- Consistent spacing

### Interactions
- Smooth animations
- Haptic feedback
- Loading states
- Error handling

## Testing Setup

- **Unit Tests**: Jest configured
- **E2E Tests**: Maestro configured
- **Mock Client**: `src/lib/deviceClient.mock.ts`

## Future Integration Strategy

When ready to integrate with the real backend:

1. **Create Integration Layer**
   ```typescript
   // src/lib/dedalusClient.ts
   export const useDedalus = () => {
     const mockMode = process.env.EXPO_PUBLIC_MOCK_DEVICE === 'true';
     return mockMode ? mockClient : realClient;
   };
   ```

2. **Connect to Python Backend**
   - Point to firmware generation API
   - Handle streaming responses
   - Implement WebSocket for real-time updates

3. **ESP32 Communication**
   - HTTP endpoints for control commands
   - WebSocket for live sensor data
   - OTA update protocol

4. **Preserve Mock Mode**
   - Keep toggle for development
   - Useful for demos without hardware
   - UI testing and screenshots

## Development Workflow

### Running the UI Shell
```bash
cd mobile/esp32controller
npm install
npx expo start
```

### Testing UI Changes
1. Modify components in `src/components/`
2. Update mock data in screen files
3. Test on iOS/Android simulators
4. Verify dark mode appearance

### Voice Input Testing
Voice input requires native build:
```bash
npx expo prebuild
npm run ios  # or npm run android
```

## Key Differences from Production Branch

| Feature | UI Shell (this branch) | Production (agent-pipeline-integration) |
|---------|----------------------|----------------------------------------|
| Mobile App | Full-featured UI | Minimal LED controller |
| Data Source | Mock/Hardcoded | Real ESP32 + AI backend |
| Purpose | UI/UX development | Working demonstration |
| Components | 12+ custom components | Standard Expo components |
| Screens | 5 screens | 2 screens (tabs) |
| Styling | NativeWind + custom | Basic StyleSheet |
| Testing | Jest + Maestro | None configured |

## Recommendations for Efficiency

### 1. Keep UI Shell Separate
- Continue developing UI independently
- Don't worry about backend integration yet
- Focus on polish and user experience

### 2. Document Component API
- Each component should have clear props interface
- Add JSDoc comments for integration clarity
- Create Storybook or similar for component showcase

### 3. Design Handoff Preparation
When integrating:
- Create integration checklist
- Map UI states to backend states
- Define error handling strategy
- Plan loading/streaming UI

### 4. Mock Data Realism
- Use realistic firmware code examples
- Simulate actual timing delays
- Include error states in mocks
- Test edge cases (long text, many controls, etc.)

### 5. Performance Testing
- Test with complex control schemas
- Simulate rapid updates
- Monitor memory usage
- Optimize animations

## Next Steps

1. ✅ **Rebase complete** - UI shell now includes backend changes
2. 🔄 **Add dev mode indicator** - Show visual flag when using mocks
3. 📝 **Enhance mock data** - More realistic scenarios
4. 🎨 **UI polish** - Refinements based on usage
5. 🔌 **Integration planning** - Define backend contracts

## Questions?

This UI shell approach allows your team to:
- Work in parallel (UI + Backend)
- Iterate quickly on design
- Maintain clean separation of concerns
- Integrate smoothly when backend is ready

Keep this branch for UI experimentation. When ready to integrate, create a new branch from `agent-pipeline-integration` and bring over the polished components.
