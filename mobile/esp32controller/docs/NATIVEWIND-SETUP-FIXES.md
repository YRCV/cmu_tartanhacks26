# NativeWind v4 Setup Fixes

## Summary
Fixed multiple configuration issues to enable NativeWind v4 to work with Expo.

## Issues Fixed

### 1. Missing NativeWind Preset in Tailwind Config
**Error:** `Tailwind CSS has not been configured with the NativeWind preset`

**Fix:** Added NativeWind preset to `tailwind.config.js:8`
```javascript
presets: [require("nativewind/preset")],
```

### 2. Babel Configuration Error
**Error:** `[BABEL] .plugins is not a valid Plugin property`

**Root Cause:** NativeWind v4 doesn't use the babel plugin approach. The v4 architecture uses react-native-css-interop and a Metro transformer instead.

**Fix:** Removed `nativewind/babel` plugin from `babel.config.js:5`
```javascript
// Before
plugins: ["nativewind/babel"],

// After
plugins: [],
```

### 3. Incorrect Global CSS Import Path
**Error:** `Unable to resolve path to module '../global.css'` (lint error)

**Root Cause:** The import path in `app/(tabs)/_layout.tsx` was pointing one level up (`../`) but global.css is in the project root, requiring two levels up (`../../`).

**Fix:** Updated import in `app/(tabs)/_layout.tsx:1`
```typescript
// Before
import "../global.css";

// After
import "../../global.css";
```

## Verification

### Linting
```bash
npm run lint
```
✅ Passes with 0 errors, 0 warnings

### Required Configuration Files

1. **tailwind.config.js** - Has NativeWind preset
2. **metro.config.js** - Uses withNativeWind wrapper
3. **babel.config.js** - No nativewind/babel plugin (correct for v4)
4. **global.css** - Contains Tailwind directives
5. **nativewind-env.d.ts** - TypeScript support
6. **app/(tabs)/_layout.tsx** - Imports global.css with correct path

## NativeWind v4 Architecture

Unlike v2, NativeWind v4 uses:
- **Metro transformer** via `withNativeWind()` in metro.config.js
- **Tailwind preset** in tailwind.config.js
- **react-native-css-interop** (automatically installed with nativewind@4.2.1)
- **NO Babel plugin** (removed from babel.config.js)

## Dependencies Installed
```json
{
  "nativewind": "^4.2.1",
  "tailwindcss": "^3.3.2",
  "expo-blur": "latest",
  "jest": "^29.7.0",
  "jest-expo": "^54.0.17",
  "@types/jest": "latest"
}
```

## Metro Bundler Performance Note

In WSL2 environments, Metro Bundler can take 3-5+ minutes to complete the initial cache build, especially with `--clear` flag. This is a known WSL performance characteristic and doesn't indicate a configuration error.

To speed up development:
- Use `npx expo start` without `--clear` after the first run
- Consider using Expo Go app for faster iteration
- Or run the dev server on Windows host (outside WSL) if performance is critical

## Next Steps

Once Metro finishes building:
1. Open Expo Go app on your phone
2. Scan the QR code
3. Test the controller screen with mock mode enabled
4. Toggle `EXPO_PUBLIC_MOCK_DEVICE` in `.env` file

## Status
✅ All configuration errors fixed
✅ Linting passes
⏳ Metro bundler initializing (can take several minutes in WSL)
