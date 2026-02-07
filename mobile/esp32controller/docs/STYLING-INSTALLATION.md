# NativeWind + Dark Theme - Installation Guide

## Quick Start

### 1. Install Dependencies

```bash
cd mobile/esp32controller

# Install NativeWind and Tailwind CSS
npm install nativewind
npm install --save-dev tailwindcss@3.3.2

# Install expo-blur (for selective blur effects)
npx expo install expo-blur
```

### 2. Files Already Created ✅

The following configuration files have been created for you:

- ✅ `tailwind.config.js` - Tailwind configuration with dark theme
- ✅ `metro.config.js` - Metro bundler config with NativeWind
- ✅ `global.css` - Tailwind directives
- ✅ `docs/styling-guide.md` - Complete styling documentation

### 3. Update `app/_layout.tsx`

Add this import at the **very top** of your `app/_layout.tsx`:

```tsx
import "../global.css";  // ← Add this line

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
// ... rest of imports
```

### 4. Add TypeScript Support (Optional but Recommended)

Create `nativewind-env.d.ts` in the root:

```typescript
/// <reference types="nativewind/types" />
```

### 5. Restart Metro Bundler

**Important:** You must restart the Metro bundler for changes to take effect:

```bash
# Stop the current bundler (Ctrl+C)

# Clear cache and restart
npx expo start -c
```

---

## Verify Installation

### Test Component

Create a test component to verify NativeWind is working:

```tsx
import { View, Text } from 'react-native';

export function TestComponent() {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <View className="bg-surface border border-border rounded-card p-card">
        <Text className="text-text-primary text-2xl font-bold mb-2">
          NativeWind Works! 🎉
        </Text>
        <Text className="text-text-secondary">
          Dark theme is active
        </Text>
      </View>
    </View>
  );
}
```

If you see:
- **Dark background** (#0a0a0a)
- **Dark card** (#1a1a1a)
- **White text**
- **Rounded corners**

Then NativeWind is working correctly!

---

## Common Issues

### Issue 1: "className" not recognized

**Solution:** Make sure you:
1. Imported `"../global.css"` in `app/_layout.tsx`
2. Restarted Metro bundler with `-c` flag
3. Created `nativewind-env.d.ts` for TypeScript support

### Issue 2: Styles not applying

**Solution:**
1. Check `tailwind.config.js` has correct content paths
2. Verify `metro.config.js` is using `withNativeWind`
3. Clear Metro cache: `npx expo start -c`

### Issue 3: TypeScript errors on className

**Solution:**
Create `nativewind-env.d.ts`:
```typescript
/// <reference types="nativewind/types" />
```

### Issue 4: Hot reload not working

**Solution:**
Restart Metro bundler after any config changes:
```bash
npx expo start -c
```

---

## Next Steps

### 1. Refactor Existing Components

See [styling-guide.md](styling-guide.md) for migration patterns.

**Example migration:**

```tsx
// ❌ Before (StyleSheet)
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
  },
  text: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});

<View style={styles.container}>
  <Text style={styles.text}>Hello</Text>
</View>

// ✅ After (NativeWind)
<View className="bg-surface p-card rounded-card">
  <Text className="text-text-primary text-lg font-semibold">Hello</Text>
</View>
```

### 2. Add Blur Effects

Only use blur on **2 surfaces** (performance):

1. **Top Bar:**
```tsx
import { BlurView } from 'expo-blur';

<BlurView
  intensity={20}
  tint="dark"
  className="flex-row justify-between items-center px-4 py-3"
>
  {/* Header content */}
</BlurView>
```

2. **Modal Overlays:**
```tsx
<Modal visible={visible} transparent>
  <BlurView
    intensity={50}
    tint="dark"
    className="flex-1 justify-center items-center"
  >
    {/* Modal content */}
  </BlurView>
</Modal>
```

### 3. Use the Design System

Reference the complete styling guide:
- [styling-guide.md](styling-guide.md)

Includes:
- Color system
- Component patterns
- Layout examples
- Accessibility guidelines
- Performance tips

---

## File Structure

```
mobile/esp32controller/
├── tailwind.config.js          ← ⭐ Tailwind config (dark theme)
├── metro.config.js              ← ⭐ Metro config (NativeWind)
├── global.css                   ← ⭐ Tailwind directives
├── nativewind-env.d.ts          ← ⭐ TypeScript support (create this)
├── app/
│   └── _layout.tsx              ← ⭐ Import global.css here
├── components/
│   └── controller/              ← Refactor these to use className
└── docs/
    ├── styling-guide.md         ← ⭐ Complete styling guide
    └── STYLING-INSTALLATION.md  ← ⭐ This file
```

---

## Summary

✅ **Configuration files created**
✅ **Dark theme colors defined**
✅ **Tailwind utilities ready**
✅ **Blur support installed**

**To activate:**
1. Run `npm install nativewind tailwindcss@3.3.2`
2. Run `npx expo install expo-blur`
3. Add `import "../global.css";` to `app/_layout.tsx`
4. Create `nativewind-env.d.ts` (optional)
5. Restart with `npx expo start -c`

**Then:**
- Use `className` instead of `style`
- Reference colors like `bg-surface`, `text-text-primary`
- Add blur to top bar + modals only
- Follow patterns in `styling-guide.md`

You're ready to build with the modern dark theme! 🎨

---

**Status:** ✅ Ready for installation
**Version:** 1.0.0
**Date:** 2026-02-07
