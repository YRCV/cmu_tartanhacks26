# Linear-Grade iOS Refactor Guide

## Complete Implementation Reference

This guide shows the exact pattern for implementing the Premium Developer Tool aesthetic across all tabs.

---

## 1. Rich Black Foundation ✅ COMPLETE

**File**: `/src/theme/colors.ts`

Key changes:
- Background: `#050505` (prevents OLED ghosting)
- Surface cards: `#121212`
- Hairline borders: `0.5px` with `rgba(255, 255, 255, 0.10)`
- Pastel syntax colors (indigo-300, emerald-300, amber-300)
- Typography utilities with `tabular-nums`

---

## 2. Screen Pattern (Apply to ALL tabs)

### Structure

```tsx
import { theme, hairlineWidth, typography } from '@/src/theme/colors';

export default function Screen() {
  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <TechGrid />

      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        <DevModeBanner />

        {/* STICKY GLASS HEADER */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50 }}>
          <BlurView
            intensity={80}
            tint={theme.blur.ultraThin}
            style={{
              borderBottomWidth: hairlineWidth,
              borderBottomColor: theme.border.default,
            }}
          >
            <View style={styles.header}>
              {/* Header content */}
            </View>
          </BlurView>
        </View>

        {/* SCROLLABLE CONTENT */}
        <ScrollView
          contentContainerStyle={{
            paddingTop: theme.layout.headerHeight + 16,
            paddingHorizontal: theme.layout.padding.screen,
            paddingBottom: Platform.OS === 'ios' ? 110 : 80,
          }}
        >
          {/* Content */}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: theme.layout.padding.screen,
    paddingVertical: 16,
    height: theme.layout.headerHeight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
```

---

## 3. Card Pattern (Hairline Borders, No Shadows)

### Glass Card

```tsx
<View style={{
  backgroundColor: theme.surface,           // #121212
  borderRadius: theme.layout.borderRadius.lg, // 24px (squircle)
  borderWidth: hairlineWidth,               // 0.5px
  borderColor: theme.border.default,        // rgba(255,255,255,0.10)
  padding: theme.layout.padding.card,       // 20px
}}>
  {/* Content */}
</View>
```

### Replace ALL instances of:
- `bg-white/[0.03]` → Use `backgroundColor: theme.surface`
- `border-white/10` → Use `borderColor: theme.border.default`
- `rounded-3xl` → Use `borderRadius: theme.layout.borderRadius.lg`
- `bg-black` → Use `backgroundColor: theme.background`

---

## 4. Typography (Tabular Nums for Metrics)

### Numbers, Times, Metrics

```tsx
<Text style={[typography.tabularNums, { color: theme.text.primary, fontSize: 32 }]}>
  {24}°C
</Text>
```

### Mono Uppercase Labels

```tsx
<Text style={[typography.monoUppercase, { color: theme.text.tertiary, fontSize: 10 }]}>
  Temperature
</Text>
```

### Text Hierarchy

```tsx
// Headings
<Text style={{ color: theme.text.primary, fontSize: 20, fontWeight: '600' }}>
  Title
</Text>

// Body
<Text style={{ color: theme.text.secondary, fontSize: 14 }}>
  Description
</Text>

// Meta/Labels
<Text style={{ color: theme.text.tertiary, fontSize: 12 }}>
  Metadata
</Text>
```

---

## 5. Interaction Feel (Haptics + Active States)

### Pressable Pattern

```tsx
<Pressable
  onPress={() => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    handleAction();
  }}
  style={({ pressed }) => ({
    opacity: pressed ? 0.7 : 1,
    transform: [{ scale: pressed ? 0.98 : 1 }],
  })}
>
  {/* Content */}
</Pressable>
```

### For NativeWind (fallback):
```tsx
<Pressable className="active:opacity-70 active:scale-95">
```

---

## 6. DevModeBanner (System Notification Style)

Update `/src/components/ui/DevModeBanner.tsx`:

```tsx
<View style={{
  position: 'absolute',
  top: 8,
  right: 8,
  zIndex: 50,
}}>
  <BlurView
    intensity={60}
    tint={theme.blur.thin}
    style={{
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: hairlineWidth,
      borderColor: theme.border.strong,
    }}
  >
    <Text style={[typography.monoUppercase, { color: theme.colors.primaryLight, fontSize: 10 }]}>
      DEV
    </Text>
  </BlurView>
</View>
```

---

## 7. CodeBlock (Pastel Syntax)

Update `/src/components/ui/CodeBlock.tsx`:

All colors already updated to use `theme.syntax.*`:
- Keywords: `#a5b4fc` (indigo-300)
- Strings: `#6ee7b7` (emerald-300)
- Numbers: `#fcd34d` (amber-300)
- Comments: `#737373` (neutral-500)

---

## 8. Tab Bar (Native Spotlight)

Update `/app/(tabs)/_layout.tsx`:

```tsx
<Tabs
  screenOptions={{
    tabBarStyle: {
      position: 'absolute',
      bottom: 0,
      height: Platform.OS === 'ios' ? 85 : 60,
      backgroundColor: 'transparent',
      borderTopWidth: 0,
    },
    tabBarBackground: () => (
      <BlurView
        intensity={80}
        tint={theme.blur.material}
        style={[StyleSheet.absoluteFill, {
          borderTopWidth: hairlineWidth,
          borderTopColor: theme.border.default,
        }]}
      />
    ),
    tabBarActiveTintColor: theme.colors.primaryLight,  // #818cf8 (indigo-400)
    tabBarInactiveTintColor: theme.text.tertiary,      // #525252
  }}
/>
```

---

## 9. Status Dots with Glow

```tsx
<View style={{
  width: 6,
  height: 6,
  borderRadius: 3,
  backgroundColor: theme.colors.success,
  ...theme.shadow.glow, // ONLY use for status indicators
}} />
```

---

## 10. Checklist for Each Tab

- [ ] Replace `bg-black` with `backgroundColor: theme.background`
- [ ] Replace all glass cards with hairline borders
- [ ] Implement sticky glass header
- [ ] Add `paddingTop: theme.layout.headerHeight + 16` to ScrollView
- [ ] Apply `typography.tabularNums` to all numbers
- [ ] Apply `typography.monoUppercase` to all labels
- [ ] Add haptic feedback to all pressables
- [ ] Use `active:opacity-70` or pressed state
- [ ] Replace rounded corners with theme values
- [ ] Test OLED ghosting (scroll fast on black areas)

---

## Priority Order

1. **Dashboard** ← Start here (reference implementation)
2. **Generate (Console)**
3. **Code**
4. **Terminal**
5. **Tab Bar**
6. **DevModeBanner**

---

## Quick Reference: Color Usage

| Element | Color Variable | Hex |
|---------|---------------|-----|
| Background | `theme.background` | #050505 |
| Cards | `theme.surface` | #121212 |
| Hairline Border | `theme.border.default` | rgba(255,255,255,0.10) |
| Primary Text | `theme.text.primary` | #ffffff |
| Body Text | `theme.text.secondary` | #a3a3a3 |
| Labels | `theme.text.tertiary` | #525252 |
| Primary Button | `theme.colors.primary` | #6366f1 |
| Active State | `theme.colors.primaryLight` | #818cf8 |
| Success Dot | `theme.colors.success` | #10b981 |

---

## Common Patterns

### Metric Display
```tsx
<View>
  <Text style={[typography.monoUppercase, { color: theme.text.tertiary, fontSize: 10 }]}>
    TEMPERATURE
  </Text>
  <Text style={[typography.tabularNums, { color: theme.text.primary, fontSize: 32, fontWeight: '700' }]}>
    24°C
  </Text>
</View>
```

### Action Button
```tsx
<Pressable
  onPress={handlePress}
  style={({ pressed }) => ({
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: theme.layout.borderRadius.md,
    opacity: pressed ? 0.8 : 1,
  })}
>
  <Text style={{ color: '#fff', fontWeight: '600' }}>Action</Text>
</Pressable>
```

---

## Testing

After implementing each screen:

1. **Scroll Test**: Scroll rapidly - no OLED smearing?
2. **Haptic Test**: All buttons give feedback?
3. **Blur Test**: Header blurs content beneath it?
4. **Border Test**: All cards have hairline borders?
5. **Typography Test**: Numbers don't jitter when updating?

---

END OF REFACTOR GUIDE
