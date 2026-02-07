# Styling Guide - Modern Dark Theme with NativeWind

## Design Philosophy

**Goal:** Modern, performant dark theme without compromising on older devices.

**Approach:**
- ✅ **NativeWind** for fast iteration and modern utility-first styling
- ✅ **expo-blur** for 1-2 key surfaces only (performance-conscious)
- ✅ **Dark background** with soft rounded cards
- ✅ **Subtle borders** and minimal shadows
- ✅ **High contrast text** for accessibility

---

## Color System

### Dark Theme Palette

```typescript
const colors = {
  // Backgrounds
  background: '#0a0a0a',      // Almost black
  surface: '#1a1a1a',         // Dark gray cards
  surfaceHover: '#252525',    // Slightly lighter for hover

  // Borders
  border: '#2a2a2a',          // Subtle borders
  borderHover: '#3a3a3a',     // Hover state

  // Text (High Contrast)
  text: {
    primary: '#ffffff',       // White
    secondary: '#a3a3a3',     // Light gray
    tertiary: '#737373',      // Medium gray
    disabled: '#525252',      // Dark gray
  },

  // Brand Colors
  primary: '#3b82f6',         // Blue
  primaryHover: '#2563eb',    // Darker blue

  success: '#10b981',         // Green
  successHover: '#059669',    // Darker green

  danger: '#ef4444',          // Red
  dangerHover: '#dc2626',     // Darker red

  warning: '#f59e0b',         // Orange
  warningHover: '#d97706',    // Darker orange

  // Latency Colors
  latency: {
    excellent: '#10b981',     // Green
    good: '#fbbf24',          // Yellow
    slow: '#f97316',          // Orange
    verySlow: '#ef4444',      // Red
  },

  // Connection Status
  online: '#10b981',          // Green
  offline: '#ef4444',         // Red
  unknown: '#737373',         // Gray
};
```

---

## NativeWind Setup

### 1. Installation

```bash
npm install nativewind
npm install --save-dev tailwindcss@3.3.2
```

### 2. Tailwind Config

**File:** `tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        background: '#0a0a0a',
        surface: '#1a1a1a',
        'surface-hover': '#252525',

        // Borders
        border: '#2a2a2a',
        'border-hover': '#3a3a3a',

        // Brand
        primary: {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
        },
        success: {
          DEFAULT: '#10b981',
          hover: '#059669',
        },
        danger: {
          DEFAULT: '#ef4444',
          hover: '#dc2626',
        },
        warning: {
          DEFAULT: '#f59e0b',
          hover: '#d97706',
        },

        // Latency
        'latency-excellent': '#10b981',
        'latency-good': '#fbbf24',
        'latency-slow': '#f97316',
        'latency-very-slow': '#ef4444',

        // Text (using Tailwind's neutral scale)
        text: {
          primary: '#ffffff',
          secondary: '#a3a3a3',
          tertiary: '#737373',
          disabled: '#525252',
        },
      },
      borderRadius: {
        'card': '12px',
        'button': '16px',
        'pill': '9999px',
      },
      spacing: {
        'card': '16px',
      },
    },
  },
  plugins: [],
};
```

### 3. Metro Config

**File:** `metro.config.js`

```javascript
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
```

### 4. Global CSS

**File:** `global.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 5. App Entry

**File:** `app/_layout.tsx`

```tsx
import "../global.css";
// ... rest of your layout
```

---

## Blur Effects (Minimal)

### Where to Use Blur

**Only 2 surfaces:**
1. **Top Bar** - Header with device info (subtle blur)
2. **Modals** - Overlay backgrounds (medium blur)

**Do NOT use blur on:**
- Cards
- Buttons
- Response panels
- Connection cards

### Implementation

```tsx
import { BlurView } from 'expo-blur';

// Top Bar (subtle)
<BlurView intensity={20} tint="dark" className="...">
  {/* Header content */}
</BlurView>

// Modal Overlay (medium)
<BlurView intensity={50} tint="dark" className="...">
  {/* Modal content */}
</BlurView>
```

---

## Component Styling Patterns

### Cards

```tsx
<View className="bg-surface border border-border rounded-card p-card shadow-sm">
  {/* Card content */}
</View>
```

### Buttons (Large)

```tsx
// Primary
<TouchableOpacity className="bg-primary active:bg-primary-hover rounded-button p-6 items-center justify-center min-h-[100px]">
  <Text className="text-white text-xl font-semibold">Toggle</Text>
</TouchableOpacity>

// Success
<TouchableOpacity className="bg-success active:bg-success-hover rounded-button p-6 items-center justify-center min-h-[100px]">
  <Text className="text-white text-xl font-semibold">On</Text>
</TouchableOpacity>

// Danger
<TouchableOpacity className="bg-danger active:bg-danger-hover rounded-button p-6 items-center justify-center min-h-[100px]">
  <Text className="text-white text-xl font-semibold">Off</Text>
</TouchableOpacity>
```

### Text Hierarchy

```tsx
// Primary (Headings)
<Text className="text-text-primary text-2xl font-bold">
  ESP32 Device
</Text>

// Secondary (Body)
<Text className="text-text-secondary text-base">
  Last seen: 2s ago
</Text>

// Tertiary (Labels)
<Text className="text-text-tertiary text-sm">
  Response
</Text>

// Disabled
<Text className="text-text-disabled text-sm">
  No device connected
</Text>
```

### Borders

```tsx
// Subtle border
<View className="border border-border rounded-card">
  {/* Content */}
</View>

// No border (clean cards)
<View className="bg-surface rounded-card">
  {/* Content */}
</View>
```

### Shadows

**Use sparingly!** Only for elevated elements:

```tsx
// Minimal shadow (cards)
<View className="shadow-sm">
  {/* Content */}
</View>

// Medium shadow (buttons)
<TouchableOpacity className="shadow-md">
  {/* Button content */}
</TouchableOpacity>

// NO shadows on flat elements
```

---

## Layout Patterns

### Container

```tsx
<View className="flex-1 bg-background">
  {/* Screen content */}
</View>
```

### Scroll Content

```tsx
<ScrollView className="flex-1 bg-background">
  <View className="p-4 space-y-4">
    {/* Cards */}
  </View>
</ScrollView>
```

### Card Grid

```tsx
<View className="flex-row gap-4">
  <View className="flex-1 bg-surface rounded-card p-4">
    {/* Card 1 */}
  </View>
  <View className="flex-1 bg-surface rounded-card p-4">
    {/* Card 2 */}
  </View>
</View>
```

### Button Row

```tsx
<View className="flex-row gap-4">
  <TouchableOpacity className="flex-1 bg-primary rounded-button p-6">
    <Text className="text-white text-center">Toggle</Text>
  </TouchableOpacity>
  <TouchableOpacity className="flex-1 bg-success rounded-button p-6">
    <Text className="text-white text-center">On</Text>
  </TouchableOpacity>
  <TouchableOpacity className="flex-1 bg-danger rounded-button p-6">
    <Text className="text-white text-center">Off</Text>
  </TouchableOpacity>
</View>
```

---

## Accessibility

### High Contrast Text

All text meets WCAG AA standards:

- **White on dark:** 21:1 contrast (AAA)
- **Light gray on dark:** 8:1 contrast (AA)
- **Medium gray on dark:** 4.5:1 contrast (AA)

### Touch Targets

Minimum 44x44 points (iOS) / 48x48dp (Android):

```tsx
<TouchableOpacity className="min-h-[44px] min-w-[44px]">
  {/* Content */}
</TouchableOpacity>
```

### Focus States

```tsx
<TouchableOpacity
  className="bg-primary active:bg-primary-hover focus:ring-2 focus:ring-primary"
>
  {/* Content */}
</TouchableOpacity>
```

---

## Performance Considerations

### Blur Usage

```typescript
// ✅ GOOD: Only 2 surfaces
<BlurView intensity={20} tint="dark">  {/* Top bar */}
<BlurView intensity={50} tint="dark">  {/* Modal */}

// ❌ BAD: Too many blurs
<BlurView intensity={20}>  {/* Every card */}
<BlurView intensity={20}>  {/* Every button */}
<BlurView intensity={20}>  {/* Every panel */}
```

### Shadow Usage

```typescript
// ✅ GOOD: Minimal shadows
className="shadow-sm"     // Cards only
className="shadow-md"     // Buttons only

// ❌ BAD: Heavy shadows
className="shadow-2xl"    // Too heavy
className="shadow-lg"     // Too many elements
```

### Animation Performance

```tsx
// ✅ GOOD: Use native driver
Animated.timing(fadeAnim, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true,  // GPU-accelerated
}).start();

// ❌ BAD: No native driver
Animated.timing(fadeAnim, {
  toValue: 1,
  duration: 300,
  useNativeDriver: false,  // CPU-bound
}).start();
```

---

## Component Examples

### Top Bar (with Blur)

```tsx
import { BlurView } from 'expo-blur';

<BlurView
  intensity={20}
  tint="dark"
  className="flex-row justify-between items-center px-4 py-3 border-b border-border"
>
  <Text className="text-text-primary text-2xl font-bold">
    ESP32 Device
  </Text>
  <TouchableOpacity className="bg-surface-hover px-4 py-2 rounded-pill">
    <Text className="text-text-primary text-sm font-semibold">
      192.168.1.100
    </Text>
  </TouchableOpacity>
</BlurView>
```

### Connection Card

```tsx
<View className="bg-surface border border-border rounded-card p-4 mb-4">
  <View className="flex-row items-center mb-2">
    <View className="w-3 h-3 rounded-full bg-success mr-2" />
    <Text className="text-text-primary text-lg font-semibold">Online</Text>
  </View>

  <Text className="text-text-secondary text-sm mb-2">
    Last seen: 2s ago
  </Text>

  <View className="flex-row items-center">
    <Text className="text-text-primary mr-2">⚡ Latency:</Text>
    <View className="bg-latency-excellent px-2 py-1 rounded">
      <Text className="text-white text-sm font-semibold">43ms</Text>
    </View>
    <Text className="text-text-secondary text-sm ml-2">(Excellent)</Text>
  </View>
</View>
```

### Control Buttons

```tsx
<View className="flex-row gap-4 mb-4">
  <TouchableOpacity className="flex-1 bg-primary active:bg-primary-hover rounded-button p-6 items-center justify-center min-h-[100px] shadow-md">
    <Text className="text-white text-xl font-semibold">Toggle</Text>
  </TouchableOpacity>

  <TouchableOpacity className="flex-1 bg-success active:bg-success-hover rounded-button p-6 items-center justify-center min-h-[100px] shadow-md">
    <Text className="text-white text-xl font-semibold">On</Text>
  </TouchableOpacity>

  <TouchableOpacity className="flex-1 bg-danger active:bg-danger-hover rounded-button p-6 items-center justify-center min-h-[100px] shadow-md">
    <Text className="text-white text-xl font-semibold">Off</Text>
  </TouchableOpacity>
</View>
```

### LED Status

```tsx
<View className="bg-surface border border-border rounded-card p-4 mb-4 flex-row items-center justify-center">
  <View className="w-5 h-5 rounded-full bg-yellow-400 mr-3" />
  <Text className="text-text-primary text-lg font-semibold">LED is ON</Text>
</View>
```

### Response Panel

```tsx
<View className="bg-surface border border-border rounded-card mb-4 overflow-hidden">
  <TouchableOpacity
    className="flex-row justify-between items-center p-4 bg-surface-hover active:bg-border-hover"
    onPress={() => setExpanded(!expanded)}
  >
    <Text className="text-text-primary font-semibold">
      Response {expanded ? '▼' : '►'}
    </Text>
    {expanded && (
      <TouchableOpacity className="bg-primary px-3 py-1 rounded">
        <Text className="text-white text-xs font-semibold">Copy</Text>
      </TouchableOpacity>
    )}
  </TouchableOpacity>

  {expanded && (
    <View className="p-4 bg-black/20">
      <Text className="text-text-primary font-mono text-sm">
        {`{"led": "on"}`}
      </Text>
    </View>
  )}
</View>
```

### Modal (with Blur)

```tsx
<Modal visible={visible} transparent animationType="fade">
  <BlurView
    intensity={50}
    tint="dark"
    className="flex-1 justify-center items-center"
  >
    <View className="bg-surface border border-border rounded-card p-6 w-4/5 max-w-md">
      <Text className="text-text-primary text-xl font-bold mb-4">
        Set Device IP
      </Text>

      <TextInput
        className="bg-background border border-border rounded-lg p-3 text-text-primary mb-4"
        placeholder="192.168.1.100"
        placeholderTextColor="#737373"
      />

      <View className="flex-row gap-2">
        <TouchableOpacity className="flex-1 bg-surface-hover border border-border rounded-lg p-3">
          <Text className="text-text-primary text-center font-semibold">Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 bg-primary active:bg-primary-hover rounded-lg p-3">
          <Text className="text-white text-center font-semibold">Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  </BlurView>
</Modal>
```

---

## Migration Checklist

### From StyleSheet to NativeWind

1. **Remove StyleSheet imports:**
   ```tsx
   // ❌ Remove
   import { StyleSheet } from 'react-native';
   const styles = StyleSheet.create({...});

   // ✅ Use className
   <View className="bg-surface p-4 rounded-card" />
   ```

2. **Convert colors:**
   ```tsx
   // ❌ Old
   style={{ backgroundColor: '#1a1a1a' }}

   // ✅ New
   className="bg-surface"
   ```

3. **Convert spacing:**
   ```tsx
   // ❌ Old
   style={{ padding: 16, margin: 8 }}

   // ✅ New
   className="p-4 m-2"
   ```

4. **Convert layout:**
   ```tsx
   // ❌ Old
   style={{ flexDirection: 'row', justifyContent: 'space-between' }}

   // ✅ New
   className="flex-row justify-between"
   ```

---

## Testing Checklist

### Visual Tests
- [ ] Dark theme applied everywhere
- [ ] High contrast text readable
- [ ] Borders subtle but visible
- [ ] Shadows minimal
- [ ] Blur only on 2 surfaces (top bar, modals)

### Performance Tests
- [ ] Smooth scrolling (60fps)
- [ ] No lag on button presses
- [ ] Animations smooth on older devices
- [ ] Blur doesn't impact performance

### Accessibility Tests
- [ ] Text contrast meets WCAG AA
- [ ] Touch targets >= 44pt
- [ ] Screen reader announces correctly
- [ ] Dynamic type scales properly

---

## Summary

**Styling Approach:**
- ✅ **NativeWind** for utility-first styling (fast iteration)
- ✅ **Minimal blur** (only top bar + modals)
- ✅ **Dark background** (#0a0a0a)
- ✅ **Soft rounded cards** (12px radius)
- ✅ **Subtle borders** (#2a2a2a)
- ✅ **Minimal shadows** (shadow-sm, shadow-md)
- ✅ **High contrast text** (white, light gray)

**Performance-First:**
- Only 2 blur surfaces
- GPU-accelerated animations
- Minimal shadows
- Optimized for older devices

**Accessibility:**
- WCAG AA contrast ratios
- 44pt minimum touch targets
- Clear focus states
- Screen reader support

---

**Next Steps:**
1. Install NativeWind + dependencies
2. Configure Tailwind + Metro
3. Create `global.css`
4. Refactor components to use className
5. Add blur to top bar + modals only
6. Test on device

---

**Status:** Ready for implementation
**Version:** 1.0.0
**Date:** 2026-02-07
