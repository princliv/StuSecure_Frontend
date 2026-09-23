# StuSecure Design Principles — "Secure Modernity"

This documents the design system already implemented in this repo (`src/theme`,
`src/components/ui`, `src/features/auth/LoginScreen.tsx`,
`src/features/student/StudentHomeScreen.tsx`). It is a description of what's
built, not a new proposal — use it as the reference when building the
remaining screens so they stay consistent with what already exists.

Source of truth for tokens: `src/theme/colors.ts`, `typography.ts`,
`spacing.ts`, `radius.ts`, exported through `src/theme/index.ts` and consumed
via `useTheme()` (`src/hooks/useTheme.ts`).

---

## 1. Principles

1. **Every screen supports light and dark mode from day one.** There is no
   "light-only" screen. Colors never come from a hardcoded hex in a component
   — they come from `useTheme().palette` (theme-dependent) or `useTheme().brand`
   (theme-independent brand colors), except for a few intentionally
   theme-fixed surfaces (see §6, Pass card).
2. **Calm, institutional trust, not playful.** Navy + royal blue, generous
   whitespace, restrained motion. This is safety/security software for a
   campus — it should read as dependable, not flashy.
3. **One accent color carries all primary actions.** `brand.blue` (`#155EEF`,
   `#6B9BFF` in dark) is the only color used for primary buttons, links,
   focus/selection state, and active tab state. Don't introduce a second
   "primary" color.
4. **Status color, not status copy, does the work first.** Entry vs. exit,
   success vs. error, active vs. resolved are shown with color + icon before
   they're shown with a label — see the green pulse dot for "Currently
   Inside," red containers for errors/emergency, blue for neutral/info.
5. **Cards, not screens, are the unit of content.** Nearly every piece of
   information lives inside a bordered, radius-xl, softly-shadowed surface
   card rather than laid directly on the background. This is what gives the
   UI its layered depth on an otherwise flat `background` color.
6. **Mock data is real-shaped data.** Placeholder screens (`MOCK_MOVEMENT`,
   `MOCK_ACTIVITY`, etc.) are written with the exact shape the real API will
   return (see `StuSecure_SaaS_Plan.md` §6 phase wiring) so swapping mock →
   live data later is a data-source change only, never a layout change.
7. **Touch targets and feedback are never an afterthought.** Every
   pressable — even a 16px icon button — gets `hitSlop`, an explicit
   `activeOpacity`, and (on tab bar buttons) a light haptic on iOS via
   `HapticTab`.

---

## 2. Color tokens

Defined in `src/theme/colors.ts`.

### Brand (theme-independent — same value in light and dark)

| Token | Value | Use |
|---|---|---|
| `brand.navy` | `#071A33` | Logo, heaviest headings |
| `brand.blue` | `#155EEF` | Primary actions, links, focus, active states |
| `brand.blueBright` | `#2A69FA` | Dark-mode accent variant |

### Palette (theme-dependent — read via `useTheme().palette`)

| Token | Light | Dark | Use |
|---|---|---|---|
| `background` | `#F5F7FA` | `#0B1220` | Screen background |
| `surface` | `#FFFFFF` | `#151C2C` | Cards, inputs, sheets |
| `surfaceVariant` / `surfaceContainer` | `#EEF1F7` | `#1E2738` / `#151C2C` | Secondary surfaces, icon chips |
| `border` / `borderVariant` | `#D0D7E5` / `#E5EAF3` | `#2A3447` / `#1E2738` | 1px card/input borders |
| `textPrimary` | `#071A33` | `#F2F4F7` | Headings, primary copy |
| `textMuted` | `#6B7A99` | `#9AA3B2` | Secondary copy, captions, icons |
| `textMutedDark` | `#4A5568` | `#C5CAD3` | Field labels (slightly stronger than `textMuted`) |
| `error` / `errorContainer` | `#ba1a1a` / `#ffdad6` | `#FF8A80` / `#4A1515` | Errors, emergency, exit events |
| `success` / `successContainer` | `#10B981` / `#E6F4EA` | `#34D399` / `#064E3B` | Success states, "inside/checked-in" |
| `secondaryFixed` / `onSecondaryFixed` | `#dbe1ff` / `#00174b` | `#1E3A5F` / `#dbe1ff` | Icon chip background pairs (e.g. QR icon) |

**Rule:** never write a raw hex in a screen unless it's a genuinely
theme-fixed brand surface (see §6). Everything else comes from `palette.*` or
`brand.*` so dark mode "just works."

---

## 3. Typography

Font: **Inter**, loaded with explicit weight-suffixed family names — always
set `fontFamily`, never rely on `fontWeight` alone to pick the right static
font file.

| Family string | Weight | Typical use |
|---|---|---|
| `Inter_400Regular` | 400 | Body copy, placeholders, captions |
| `Inter_500Medium` | 500 | Field labels, secondary labels, pill text |
| `Inter_600SemiBold` | 600 | Section titles, header titles, button labels, links |
| `Inter_700Bold` | 700 | Hero titles, greetings, large numerals |

Sizes (`FontSizes` in `src/theme/typography.ts`) are a small fixed scale —
prefer these over arbitrary numbers:

| Token | px | Typical use |
|---|---|---|
| `xs` | 12 | Captions, timestamps, error text |
| `sm` | 14 | Body copy, button-adjacent text |
| `md` | 16 | Section titles, input text |
| `lg` | 20 | Sub-headings |
| `xl` | 24 | — |
| `xxl` | 32 | — |

In practice screens also use a few one-off larger sizes for hero moments
(26–28px greeting/heading text) — that's fine for a single hero element per
screen, but body/label text should stay on the scale above.

Line height: `LineHeights.tight` (1.2) for large numerals/headings,
`normal` (1.5) for body copy.

---

## 4. Spacing & radius

`src/theme/spacing.ts` — an 8px-rooted scale, always reference by name:

```
xxs 2   xs 4   sm 8   md 16   lg 24   xl 32   xxl 48   xxxl 64
```

Screen horizontal padding is consistently **20px** (a `SIDE`/`SIDE_MARGIN`
constant local to each screen — between `sm` and `md`, treat 20 as the fixed
screen gutter).

`src/theme/radius.ts`:

```
none 0   xs 2   sm 4   md 8   lg 12   xl 16   xxl 24   full 9999
```

| Radius | Use |
|---|---|
| `sm` (4) | Checkboxes |
| `md` (8) | Small chips, error banners |
| `lg` (12) | Text input fields |
| `xl` (16) | Buttons, standard cards, quick-action icon tiles |
| `xxl` (24) | Hero/feature cards (e.g. the Digital Pass card) |
| `full` | Pills, circular avatars |

---

## 5. Iconography

**MaterialIcons only** (`@expo/vector-icons/MaterialIcons`) — don't mix in
other icon sets for one-off icons; it breaks visual weight consistency.
Standard sizes: 16 (inline/small), 18–20 (buttons, field icons), 24 (tab
bar), 26 (quick-action tiles).

Icon "chips" (a colored rounded square/circle behind an icon) always pair a
light container color with a readable foreground:

- Neutral: `palette.surfaceVariant` bg + `palette.textPrimary` fg
- Brand: `palette.secondaryFixed` bg + `palette.onSecondaryFixed` (dark) /
  `#0050d7` (light) fg
- Destructive/emergency: `palette.errorContainer` bg + `palette.error` fg

---

## 6. Core components (`src/components/ui`)

- **`Button`** — `primary` (filled `brand.blue`, white label) and `outline`
  (`surface` bg + `border`) variants only. Fixed height `52`, `radius.xl`,
  `activeOpacity 0.82`, disabled/loading → `opacity 0.55` + spinner replacing
  the label. Optional `rightElement` for a trailing icon.
- **`TextField`** — labeled input, fixed height `52`, `radius.lg`, 1px
  `border` (bumps to 1.5px `error` red when invalid), optional left icon
  (absolute-positioned) and right icon button (e.g. show/hide password).
  Label sits above in `Inter_500Medium` 13px `textMutedDark`.
- **`BrandLogo`** — the wordmark. On dark backgrounds it's wrapped in a small
  white chip (`radius.md`) so the navy mark stays legible — apply the same
  "chip behind a light-only asset" trick to any other light-only image placed
  on a colored/dark surface.
- **`StudentAvatar`** — circular, hairline `border` ring, photo or
  brand-blue-filled initials fallback. Reused pattern: any avatar = photo or
  colored-initials fallback, never a broken image state.

Build new shared UI in `src/components/ui` following these same rules
(fixed height for form controls, `radius.xl` default, theme read via
`useTheme()`) rather than one-off styling per screen.

---

## 7. Card pattern

The dominant content container across the app:

```
backgroundColor: palette.surface
borderWidth: 1, borderColor: palette.border
borderRadius: radius.xl (or xxl for hero cards)
shadow: color #000, offset {0,2}, opacity 0.04, radius 8, elevation 2
        (hero/brand cards use a stronger, color-matched shadow — see below)
```

Optional embellishments, used sparingly and only for emphasis:

- **Top accent stripe** — a 3px `brand.blue` bar across the top of a card
  (e.g. the login form card) to mark it as the primary focal element on the
  screen.
- **Colored hero card** — a card that breaks from `palette.surface` and uses
  a fixed brand color background (e.g. `PASS_BG = '#0050d7'` for the Digital
  Pass) *is intentionally theme-independent*: it's a "physical object" (a
  pass/badge) rather than a themed UI surface, so it keeps the same blue in
  light and dark mode. Its shadow color matches the card background
  (`shadowColor: PASS_BG`) with higher opacity (0.35) for a stronger lift.
  Use this exception only for genuinely object-like cards, not for ordinary
  content cards.
- **Decorative glow blob** — a large, soft, semi-transparent white circle
  absolute-positioned in a corner, used once per hero card max, never on
  standard cards.

---

## 8. Screen structure

Every full screen follows the same skeleton:

```
<SafeAreaView edges={[...]} style={{ flex:1, backgroundColor: palette.background }}>
  <StatusBar barStyle={statusBarStyle} backgroundColor={palette.background|surface} />
  [<KeyboardAvoidingView> for forms]
  <ScrollView contentContainerStyle={{ paddingHorizontal: 20, ... }}>
    ...sections...
  </ScrollView>
</SafeAreaView>
```

- Screens with a persistent header (dashboards) use a **64px sticky header**
  outside the ScrollView: `surface` background, bottom `border`, brand
  logo + screen title on the left, avatar (navigates to profile) on the
  right.
- Auth/form screens instead use a centered **hero section** (logo + title +
  subtitle) above the form card, no persistent header.
- Section titles are `16px / 600 / textPrimary`, with an optional
  right-aligned "View All" link (`13px / 600 / brand.blue`) when a section
  previews a longer list.
- Styles are built with a **`makeStyles(palette, ...)` factory function**
  called at the top of the component (not a static `StyleSheet.create` at
  module scope), so every style can read the current theme's palette.

---

## 9. Navigation & tab bars

- Per-role tab bar (`app/(student)/_layout.tsx` is the reference): active
  tint `brand.blue`, inactive tint `palette.textMuted`, `surface` background,
  1px top `border`, label `11px Inter_500Medium`.
- Tab bar buttons use `HapticTab` (light `impactAsync` on iOS `onPressIn`) —
  reuse this for any new tab bar rather than the RN Navigation default.
- Not every screen needs a tab. Quick-action-only destinations (e.g.
  attendance, help, emergency from the student home quick actions) are
  registered as hidden routes (`options={{ href: null }}`) so they're
  reachable by navigation but don't clutter the tab bar.

---

## 10. Motion

Motion is minimal and purposeful, not decorative:

- **Pulse dot** — a looping scale+fade ring behind a solid dot, used only to
  mean "live/active right now" (e.g. "Currently Inside"). `Animated` API,
  `useNativeDriver: true`.
- Button press feedback is opacity-only (`activeOpacity`), no scale/spring.
- No screen-transition or mount-in animations yet — don't add them without a
  reason; the system currently reads as instant and calm on purpose.

---

## 11. Accessibility

- Interactive icon-only buttons get `hitSlop={{ top:8, bottom:8, left:8, right:8 }}` (or similar) — never rely on a bare 20px icon as the tap target.
- Meaningful images set `accessibilityLabel` (`BrandLogo`, `StudentAvatar`).
- Pressable avatars set `accessibilityRole="button"`.
- Color is never the only signal — entry/exit, error, and status pills always
  pair color with an icon and/or text label.

---

## 12. What not to do

- Don't hardcode a hex color in a screen/component — use `palette.*` /
  `brand.*`, even for one-off colors (add a new palette token if you need a
  color that isn't there yet, in both light and dark variants).
- Don't introduce a second icon library.
- Don't invent a new border radius or spacing value outside the two scales.
- Don't ship a screen that only looks right in light mode.
- Don't add a full-screen loading spinner where a skeleton/placeholder in the
  existing card shapes would preserve layout — none of the current screens
  do full-screen spinners for content loads, only inline (e.g. inside a
  `Button`).
