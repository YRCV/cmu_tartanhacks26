# Phase 2: Visual Refinement & Native Alignment

## Implementation Status & Next Steps

---

## ✅ COMPLETED

### 1. Unified Sticky Header Component
**File**: `/src/components/ui/StickyHeader.tsx`

Features:
- Single sticky glass header with blur
- Optional live status badge (Dev Mode, Connected, etc.)
- Hairline bottom border
- San Francisco font (system default)
- Proper z-index layering

Usage:
```tsx
<StickyHeader
  title="Monitor"
  subtitle="ESP32 Controller"
  statusBadge={{ label: 'Dev Mode', color: 'success' }}
/>
```

### 2. Dashboard Refactor ✅
**File**: `/app/(tabs)/dashboard.tsx`

Changes Applied:
- ✅ Removed floating DevModeBanner pill
- ✅ Implemented StickyHeader with status badge
- ✅ Cards now have `border-white/10` hairline borders
- ✅ "Add Widget" button styled with glass effect (no dashed border)
- ✅ `active:scale-95` animation on pressables
- ✅ San Francisco font enforced
- ✅ Removed monospace from card labels

---

## 🔧 TODO: Apply to Remaining Tabs

### 2. Console Tab (`/app/(tabs)/generate.tsx`)

**Changes Needed:**

1. **Replace Header**:
```tsx
// Remove DevModeBanner + old header
// Add:
<StickyHeader
  title="Console"
  subtitle="AI Assistant"
  statusBadge={{ label: 'Online', color: 'success' }}
/>
```

2. **Message Bubbles**:
- Add `borderWidth: hairlineWidth, borderColor: theme.border.default`
- Keep glass blur effect
- Ensure San Francisco font (no monospace for message text)

3. **Suggestion Pills**:
- Remove box style
- Use: `backgroundColor: theme.surfaceGlass, borderRadius: 999`

---

### 3. Code Tab (`/app/(tabs)/code.tsx`)

**Critical Changes:**

1. **Segmented Control for File Tabs**:

Replace current button-style tabs with:

```tsx
<View style={styles.segmentedControl}>
  <View style={styles.segmentContainer}>
    {MOCK_FILES.map((file, idx) => (
      <Pressable
        key={file.name}
        onPress={() => setSelectedFileIndex(idx)}
        style={({ pressed }) => [
          styles.segment,
          { opacity: pressed ? 0.7 : 1 }
        ]}
      >
        {idx === selectedFileIndex && (
          <View style={styles.segmentIndicator} />
        )}
        <Text style={[
          styles.segmentText,
          idx === selectedFileIndex && styles.segmentTextActive
        ]}>
          {file.name}
        </Text>
      </Pressable>
    ))}
  </View>
</View>

const styles = StyleSheet.create({
  segmentedControl: {
    marginHorizontal: theme.layout.padding.screen,
    marginBottom: 16,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 10,
    padding: 2,
    gap: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  segmentIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    zIndex: -1,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.text.tertiary,
  },
  segmentTextActive: {
    color: theme.text.primary,
  },
});
```

2. **Syntax Colors** (Already done in CodeBlock.tsx):
- `115200` → `text-amber-300` ✅
- Strings → `text-emerald-300` ✅

3. **Header**:
```tsx
<StickyHeader
  title="Code"
  subtitle="Generated Files"
  statusBadge={{ label: 'Ready', color: 'info' }}
/>
```

---

### 4. Diagnostics Tab (`/app/(tabs)/terminal.tsx`)

**Major Refactor: Inset Grouped Style**

Replace flat cards with iOS Settings-style islands:

```tsx
<View style={styles.island}>
  {/* Environment Section */}
  <View style={styles.row}>
    <Text style={styles.rowLabel}>Mock Mode (Env)</Text>
    <Text style={styles.rowValue}>
      {isMockMode ? 'ENABLED' : 'DISABLED'}
    </Text>
  </View>

  <View style={styles.divider} />

  <View style={styles.row}>
    <Text style={styles.rowLabel}>Force Mock</Text>
    <Switch
      value={useMock}
      onValueChange={setUseMock}
      trackColor={{ false: theme.border.default, true: theme.colors.success }}
    />
  </View>
</View>

const styles = StyleSheet.create({
  island: {
    backgroundColor: theme.surface,
    borderRadius: theme.layout.borderRadius.md,
    borderWidth: hairlineWidth,
    borderColor: theme.border.default,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44, // iOS touch target
  },
  divider: {
    height: hairlineWidth,
    backgroundColor: theme.border.subtle,
    marginLeft: 16,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '400',
    color: theme.text.primary,
  },
  rowValue: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.text.secondary,
  },
});
```

**Text Input (Latency)**:
- Remove border box
- Align input text to right: `textAlign: 'right'`
- Style as detail accessory:

```tsx
<View style={styles.row}>
  <Text style={styles.rowLabel}>Base Latency (ms)</Text>
  <TextInput
    value={mockLatency}
    onChangeText={setMockLatency}
    keyboardType="numeric"
    style={styles.detailInput}
    placeholderTextColor={theme.text.placeholder}
  />
</View>

detailInput: {
  fontSize: 15,
  fontWeight: '400',
  color: theme.text.secondary,
  textAlign: 'right',
  minWidth: 60,
  fontVariant: ['tabular-nums'], // Monospace ONLY for raw data
},
```

---

## Typography Enforcement Checklist

### ✅ Use San Francisco (System Font)

**Remove Monospace From:**
- [ ] Screen titles ("Diagnostics", "Console", "Monitor")
- [ ] Card labels ("Temperature", "System Uptime")
- [ ] Button text ("Add Widget", "Ping Device")
- [ ] Message text in chat interface

**Keep Monospace For:**
- [x] Code editor content (CodeBlock)
- [x] Terminal logs
- [x] Raw data values (IP addresses: `192.168.1.100`)
- [x] Latency numbers: `50ms`
- [x] Timestamps with tabular-nums

### Font Weight Guide

| Element | Weight | Example |
|---------|--------|---------|
| Screen Title | `600` (semibold) | "Monitor" |
| Section Header | `500` (medium) | "Environment" |
| Data Label | `500` (medium) | "Temperature" |
| Body Text | `400` (regular) | Descriptions |
| Meta/Hint | `400` (regular) | "Tap to edit" |
| Numbers (Data) | `700` (bold) + tabular-nums | `24°C` |

---

## Slider Refactor (LED Pulse)

**Current**: Chunky pill thumb

**Target**: Thin iOS-style slider OR touch surface slider

### Option A: Standard iOS Slider
```tsx
import Slider from '@react-native-community/slider';

<Slider
  value={value}
  onValueChange={onValueChange}
  minimumValue={min}
  maximumValue={max}
  step={step}
  minimumTrackTintColor={theme.colors.primary}
  maximumTrackTintColor={theme.border.default}
  thumbTintColor="#ffffff"
  style={{ width: '100%', height: 40 }}
/>
```

### Option B: Touch Surface (HomeKit Style)

Full-width progress bar with tap-to-set:

```tsx
<Pressable onPress={(e) => handlePress(e)}>
  <View style={styles.touchSurface}>
    <View style={[styles.fill, { width: `${percentage}%` }]} />
    <Text style={styles.value}>{value}{unit}</Text>
  </View>
</Pressable>

const styles = StyleSheet.create({
  touchSurface: {
    height: 80,
    borderRadius: theme.layout.borderRadius.md,
    backgroundColor: theme.surface,
    borderWidth: hairlineWidth,
    borderColor: theme.border.default,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: theme.surfaceGlass,
  },
  value: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.text.primary,
    ...typography.tabularNums,
  },
});
```

---

## Quick Reference: Before/After

| Element | Before | After |
|---------|--------|-------|
| **Header** | Floating pill + separate header | Unified sticky header with badge |
| **Dev Mode** | Purple gradient pill | Small emerald badge in header |
| **Card Labels** | Monospace uppercase | San Francisco medium, uppercase |
| **Add Widget** | Dashed border | Glass surface, solid border |
| **Code Tabs** | Individual buttons | Segmented control with slide |
| **Diagnostics** | Separate cards | Grouped islands with dividers |
| **Text Input** | Bordered box | Right-aligned detail text |
| **Slider** | Chunky thumb | Thin native OR touch surface |

---

## Testing Checklist

After implementing each tab:

- [ ] Header: Status badge visible and correct color?
- [ ] Cards: All have hairline borders?
- [ ] Typography: No monospace in titles/labels?
- [ ] Fonts: San Francisco (system) applied?
- [ ] Pressables: `scale-95` animation works?
- [ ] Haptics: Light feedback on all taps?
- [ ] Scroll: Content blurs under sticky header?
- [ ] Safe areas: No cut-off at top/bottom?

---

## Priority Implementation Order

1. ✅ **Dashboard** (COMPLETE - Reference)
2. **Diagnostics** (Most visible impact)
3. **Code** (Segmented control is key)
4. **Console** (Straightforward header swap)

---

END OF PHASE 2 GUIDE
