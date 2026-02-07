# Latency-First Controller Screen Design

## Design Philosophy

**Priority:** Latency visibility and tactile control feedback over visual polish.

This screen is optimized for:
1. **Instant feedback** - Show network latency prominently
2. **Debugging** - Raw response text always accessible
3. **Speed** - Large touch targets, minimal navigation
4. **Transparency** - No hidden state, everything visible

---

## Screen Hierarchy

```
┌─────────────────────────────────────────┐
│ [ESP32 Device]      [192.168.1.100 ⓘ]  │ ← Top Bar
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 🟢 Online                         │  │
│  │ Last seen: 2s ago                 │  │ ← Connection Card
│  │ ⚡ Latency: 43ms                  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│  │         │  │         │  │         │ │
│  │ Toggle  │  │   On    │  │   Off   │ │ ← Primary Actions
│  │         │  │         │  │         │ │   (Large, Round)
│  └─────────┘  └─────────┘  └─────────┘ │
│                                         │
│  LED Status: ON                         │ ← Current State
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Response ▼                        │  │
│  │ ─────────────────────────────────│  │ ← Raw Response
│  │ {"led": "on"}                    │  │   (Collapsible)
│  └───────────────────────────────────┘  │
│                                         │
│  [OTA Update →]                         │ ← Secondary Action
│                                         │
│  v1.0.0 • Updated 2m ago                │ ← Version Info
└─────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Top Bar
**Elements:**
- Device name (editable via tap)
- IP address pill (tap to edit)
- Settings icon (optional)

**Behavior:**
- Tap device name → Edit modal
- Tap IP pill → IP input modal
- Sticky header (stays visible on scroll)

### 2. Connection Card
**Elements:**
- Status indicator (🟢 Online / 🔴 Offline / ⚪ Unknown)
- Connection label ("Online", "Offline", "Checking...")
- Last seen timestamp
- Latency badge (color-coded)

**Latency Color Coding:**
- Green: < 100ms (Excellent)
- Yellow: 100-300ms (Good)
- Orange: 300-1000ms (Slow)
- Red: > 1000ms (Very Slow)

**Behavior:**
- Tap to refresh status
- Auto-refresh every 30s (optional)

### 3. Primary Actions
**Elements:**
- 3 large, round buttons: Toggle / On / Off
- Loading spinner inside button when busy
- Haptic feedback on press (iOS/Android)

**Visual States:**
- Default: Blue/Green/Red backgrounds
- Pressed: Darker shade + scale down slightly
- Disabled: Gray + reduced opacity
- Loading: Spinner + "Sending..." text

**Behavior:**
- Disabled when no IP set
- Disabled when another command is in progress
- Immediate visual feedback (optimistic UI possible later)

### 4. LED Status Display
**Elements:**
- Large LED indicator icon (circle)
- Text: "LED is ON" / "LED is OFF" / "Unknown"
- Color: Yellow (on) / Gray (off) / Gray (unknown)

**Behavior:**
- Updates from lastResponseText
- Animates on state change (optional)

### 5. Response Panel (Collapsible)
**Elements:**
- Header: "Response ▼" / "Response ►"
- Raw text display (monospace font)
- Copy button (tap to copy to clipboard)

**Behavior:**
- Collapsed by default
- Tap header to expand/collapse
- Shows last successful response
- Useful for debugging

### 6. OTA Button
**Elements:**
- Secondary button style (outline or ghost)
- Arrow icon →
- Text: "OTA Update"

**Behavior:**
- Navigate to separate OTA screen
- Disabled when device offline

### 7. Version Control
**Elements:**
- App version number (from package.json)
- Last updated timestamp
- Build info (optional: git hash, build date)

**Behavior:**
- Tap to show full version details modal
- Shows app version, not firmware version

---

## Latency Indicators

### Visual Design
```
⚡ 43ms  ← Excellent (green)
⚡ 150ms ← Good (yellow)
⚡ 450ms ← Slow (orange)
⚡ 1.2s  ← Very slow (red)
```

### Text Formatting
- < 1000ms: Show as "43ms"
- >= 1000ms: Show as "1.2s"

### Color Palette
```typescript
const LATENCY_COLORS = {
  excellent: '#10b981', // green
  good: '#fbbf24',      // yellow
  slow: '#f97316',      // orange
  verySlow: '#ef4444',  // red
  unknown: '#6b7280',   // gray
};
```

---

## Touch Targets

Following iOS/Android HIG:

- **Minimum touch target:** 44x44 points (iOS) / 48x48dp (Android)
- **Primary action buttons:** 120x120 minimum
- **IP pill:** 100x36 minimum
- **Collapsible header:** Full width, 48pt tall

---

## Loading States

### During Request
1. Button shows spinner
2. Other buttons disabled
3. Response panel shows "Waiting..."
4. Connection card shows "Checking..."

### After Success
1. Latency updates immediately
2. LED status updates
3. Response panel updates
4. Green flash animation (optional)

### After Error
1. Error banner appears at top
2. Buttons re-enabled
3. Connection status updates to offline
4. Red flash animation (optional)

---

## Accessibility

### Screen Reader Support
- Device name announced
- Connection status announced
- Button labels clear ("Toggle LED", not just "Toggle")
- Response panel marked as "Debug info"

### Dynamic Type
- All text scales with system font size
- Buttons maintain minimum size

### Color Contrast
- All text meets WCAG AA standards (4.5:1)
- Status indicators have text labels (not just color)

---

## Performance Optimizations

### Rendering
- Use `React.memo()` for static components
- Avoid unnecessary re-renders
- Debounce rapid button presses

### Network
- Cancel pending requests on new request
- Timeout after 5s for LED commands
- Show stale data indicator if > 1 minute old

### Animations
- Use native driver for animations
- Keep animations < 300ms
- Disable animations on low-end devices (optional)

---

## Version Control Implementation

### Display
```
v1.0.0 • Updated 2m ago
```

### Data Source
```typescript
interface VersionInfo {
  appVersion: string;      // From package.json
  buildNumber: string;     // From app.json (Expo)
  buildDate: Date;         // From build time
  gitHash?: string;        // From git (if available)
  gitBranch?: string;      // From git (if available)
}
```

### Tap Behavior
Opens modal with full details:
```
App Version
━━━━━━━━━━━━━━━━━━━━
Version:     1.0.0
Build:       23
Built:       2026-02-07 15:30
Git Hash:    abc1234
Git Branch:  main
Platform:    iOS 17.2
Device:      iPhone 15 Pro
```

---

## Future Enhancements (Not MVP)

### Circular Gauge (Visual Only)
- Circular progress ring around latency
- No functional purpose, just visual feedback
- Can be added later without changing layout

### History Graph
- Small sparkline of last 10 latency measurements
- Below latency indicator
- Helps identify network patterns

### Device Discovery
- mDNS scanner
- QR code scanner for IP
- Recent devices list

### Themes
- Light/Dark mode toggle
- Custom color schemes
- High contrast mode

---

## Layout Specifications

### Spacing
```typescript
const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
```

### Border Radius
```typescript
const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999, // for pills
};
```

### Shadows
```typescript
const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
};
```

---

## Color Palette

### Primary Colors
```typescript
const COLORS = {
  primary: '#3b82f6',    // Blue (toggle)
  success: '#10b981',    // Green (on)
  danger: '#ef4444',     // Red (off)
  warning: '#f59e0b',    // Orange (OTA)

  // Neutrals
  background: '#f9fafb',
  surface: '#ffffff',
  border: '#e5e7eb',

  // Text
  text: {
    primary: '#111827',
    secondary: '#6b7280',
    disabled: '#9ca3af',
  },
};
```

---

## Typography

### Font Sizes
```typescript
const FONT_SIZE = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
};
```

### Font Weights
```typescript
const FONT_WEIGHT = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};
```

---

## Animation Timings

```typescript
const ANIMATION = {
  fast: 150,    // Button press
  normal: 300,  // Panel expand
  slow: 500,    // State transitions
};
```

---

## Testing Checklist

### Visual
- [ ] All touch targets >= 44pt
- [ ] Color contrast meets WCAG AA
- [ ] Text scales with system font size
- [ ] Works in light and dark mode

### Functional
- [ ] Buttons disabled when offline
- [ ] Latency color-codes correctly
- [ ] Response panel expands/collapses
- [ ] Version info displays correctly
- [ ] IP pill opens edit modal

### Performance
- [ ] No jank when pressing buttons
- [ ] Response time < 16ms for interactions
- [ ] Smooth animations at 60fps
- [ ] Memory usage stable

### Accessibility
- [ ] Screen reader announces all states
- [ ] All interactive elements focusable
- [ ] Focus order logical
- [ ] Labels descriptive

---

## File Structure

```
app/
├── (tabs)/
│   └── controller.tsx          ← Main screen
├── ota.tsx                     ← OTA screen (separate)
└── modals/
    ├── edit-device.tsx         ← Device name edit
    ├── edit-ip.tsx             ← IP address edit
    └── version-info.tsx        ← Version details

components/
├── controller/
│   ├── ConnectionCard.tsx      ← Connection status
│   ├── ControlButtons.tsx      ← Toggle/On/Off buttons
│   ├── LedStatusDisplay.tsx    ← LED state indicator
│   ├── ResponsePanel.tsx       ← Collapsible response
│   ├── LatencyBadge.tsx        ← Latency indicator
│   └── TopBar.tsx              ← Header bar
└── ui/
    ├── Button.tsx              ← Reusable button
    ├── Card.tsx                ← Reusable card
    └── Badge.tsx               ← Reusable badge

lib/
└── version.ts                  ← Version info utilities
```

---

## Next Steps

1. Create reusable UI components
2. Build main controller screen
3. Implement version tracking
4. Create OTA screen
5. Add haptic feedback
6. Test on real device

---

**Design Version:** 1.0.0
**Last Updated:** 2026-02-07
