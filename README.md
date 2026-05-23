# @eq-solutions/tokens

Canonical EQ Solutions design tokens. The single source of truth for colour, type, spacing, radii, shadow, motion, and tier theming across every EQ surface — Field, Service, Quotes, Cards, Shell, Intake, Expenses, Ops, and marketing.

If you're adding a new EQ surface or changing an existing one, import from here. Hardcoded hex values, raw px shadows, and bespoke radii outside this package count as drift and should be migrated as you touch them.

## What v1.0 ships

| Output | Path | For |
|---|---|---|
| CSS | `tokens.css` | Vanilla CSS + Tailwind v4 (`@theme` block) + tier selectors |
| TypeScript | `tokens.ts` | Charts, canvas, PDFs, anywhere CSS doesn't reach |
| Tailwind preset | `tailwind.preset.cjs` | Tailwind v3 apps (or v4 with JS-config preference) |
| Flutter Dart | `tokens.dart` | EQ Cards and any future Flutter consumer |

All four artefacts are generated from one JSON source under [`tokens/`](./tokens/). **Do not edit the generated files directly** — edit JSON, run `npm run build`, commit both.

## Install

Distributed via git URL. Pin to a tag for reproducibility.

```sh
pnpm add github:eq-solutions/eq-design-tokens#v1.0.0
# or
npm install github:eq-solutions/eq-design-tokens#v1.0.0
```

## Tier model — Standard / Advanced / Enterprise

Tokens are split into a **base layer** (the canonical EQ look — applies on `:root`) and **tier deltas** (per-tenant variations under `[data-tier="..."]` selectors).

**Today the deltas are deliberately minimal:**

- **Standard** — base layer only. The workhorse EQ look.
- **Advanced** — base layer only (reserved; tier-attribute wired for the eventual rollout).
- **Enterprise** — overrides `--eq-tier-accent` (deeper teal, tenant-customisable) and `--eq-shadow-elevated` (richer floating-surface shadow). Apps that use these tokens automatically pick up the premium treatment.

**How Shell applies a tier:**

```html
<html data-tier="enterprise"> ... </html>
```

Shell reads the tenant's tier from its JWT claim and sets `data-tier` on the root element. Apps stay tier-unaware; CSS variables cascade. White-label Enterprise tenants can further override individual tokens at runtime by injecting CSS variables on the same element.

**Which tokens to use:**

- `--eq-tier-accent` / `tier.accent` — use for highlights that should vary by tier (call-to-action accent strips, premium badges).
- `--eq-shadow-elevated` / `shadows.elevated` — use for floating surfaces where Enterprise should feel richer.
- `--eq-sky` / `colours.brand.sky` and friends — use for the canonical EQ identity (logo, primary CTA). These never vary by tier.

When in doubt: use the brand token, not the tier token. Tier differentiation should be additive, not pervasive.

## Use — Tailwind v4 (Next.js, modern Vite, etc.)

```css
/* app/globals.css */
@import "@eq-solutions/tokens/tokens.css";
@import "tailwindcss";
```

Host app loads **Plus Jakarta Sans** and exposes it as `--font-jakarta`:

```ts
// app/layout.tsx
import { Plus_Jakarta_Sans } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={jakarta.variable} data-tier="standard">
      <body>{children}</body>
    </html>
  );
}
```

Then use the utility classes the `@theme` block emits:

```tsx
<button className="bg-eq-sky hover:bg-eq-deep text-eq-white rounded-eq-input">
  Save
</button>

<div className="rounded-eq-card border border-eq-gray-200 bg-eq-white p-4">
  Standard card.
</div>

<div className="bg-eq-tier-accent rounded-eq-card shadow-eq-elevated">
  Tier-aware accent surface.
</div>
```

## Use — Tailwind v3 (or v4 with JS config preference)

```js
// tailwind.config.cjs
module.exports = {
  presets: [require('@eq-solutions/tokens/tailwind.preset.cjs')],
  content: ['./src/**/*.{ts,tsx}'],
};
```

You'll still want to `@import "@eq-solutions/tokens/tokens.css"` for the CSS variable definitions.

## Use — vanilla CSS / no Tailwind (legacy EQ Field, static HTML)

```css
@import "@eq-solutions/tokens/tokens.css";

.my-card {
  background: var(--eq-white);
  border: var(--eq-border-width) solid var(--eq-border-color);
  border-radius: var(--eq-radius-card);
  padding: var(--eq-space-4);
}

.my-card:focus-visible {
  outline: var(--eq-focus-ring);
  outline-offset: var(--eq-focus-offset);
}
```

## Use — programmatic (TS / JS)

```ts
import { colours, radii, motion, tier } from '@eq-solutions/tokens';

const chartConfig = {
  primaryColour: colours.brand.sky,
  hoverColour:   colours.brand.deep,
  accentColour:  tier.accent,
  cornerRadius:  radii.card,
  animationMs:   motion.durationDefault,
};
```

## Use — Flutter (EQ Cards)

Add to `pubspec.yaml`:

```yaml
dependencies:
  eq_tokens:
    git:
      url: https://github.com/eq-solutions/eq-design-tokens.git
      ref: v1.0.0
      path: tokens.dart
```

Then:

```dart
import 'package:eq_tokens/tokens.dart';

Container(
  decoration: BoxDecoration(
    color: EqColors.sky,
    borderRadius: BorderRadius.circular(EqRadius.card),
  ),
  padding: EdgeInsets.all(EqSpacing.s4),
  child: Text(
    'EQ Cards',
    style: TextStyle(
      fontFamily: EqTypography.fontFamily,
      fontSize:   EqTypography.lg,
      fontWeight: EqTypography.semi,
      color:      EqColors.white,
    ),
  ),
)
```

> Tier-aware overrides are CSS-only today. Cards is single-tenant from the user's perspective (one wallet per person), so tier theming isn't wired into Flutter yet. If a future Flutter consumer needs tier awareness, the build pipeline can emit tier-specific Dart classes.

## What's in v1.0

| Group | Tokens |
|---|---|
| Brand colours | `--eq-sky` `--eq-deep` `--eq-ice` `--eq-ink` `--eq-grey` `--eq-white` |
| Neutral scale | `--eq-gray-50` through `--eq-gray-600` |
| Status | success / warning / error (bg + text pairs) |
| Tier accent | `--eq-tier-accent` (Standard inherits brand.sky; Enterprise overrides) |
| Type scale | `--eq-text-xs` (11px) through `--eq-text-4xl` (48px), weight scale 400-800 |
| Body / tracking / label | line-height, tracking variants, label size/weight |
| Spacing | `--eq-space-1` (4px) through `--eq-space-16` (64px) on the 8px grid |
| Radii | chip 4 · input 6 · card 8 · shell 12 · pill 9999 |
| Borders | hairline 1px, default + input variants |
| Shadows | `sm` (floating cards) + `lg` (modals) + `elevated` (premium surfaces) |
| Motion | 150ms default · 300ms drawer · 700ms spinner · cubic-bezier ease |
| Focus | `--eq-focus-ring` + offset — required on every focusable input |

See [`tokens.css`](./tokens.css) for the full file with inline documentation.

## What's *not* in v1.0

- No Plus Jakarta Sans font files — host apps load the font themselves and expose it as `--font-jakarta`.
- No React / Vue / Svelte components — those will live in a separate `@eq-solutions/ui` package once primitives stabilise.
- No icons — likewise a separate package (`@eq-solutions/icons`) when extracted.
- No SKS subsidiary palette — SKS lives outside the EQ token system.
- No runtime tier-attribute logic — Shell sets `data-tier`; this package only emits the CSS that responds to it.

## Hard don'ts

- ✗ Don't invent new brand colours. Subsidiary palettes vary only supporting colours.
- ✗ Don't use drop shadows on static cards. Floating UI only.
- ✗ Don't use gradients as page backgrounds. The only canonical gradient is the Service sign-in panel.
- ✗ Don't use coloured left-border accents on cards. (Field's site-card 5px band is data, not decoration.)
- ✗ Don't use pure black anywhere — use `--eq-ink`.
- ✗ Don't reference `--eq-tier-accent` for the canonical EQ identity (logo, primary CTA). Use `--eq-sky` directly so tenants can't accidentally rebrand your logo.

## Authoring — add or change a token

1. Edit the relevant file under [`tokens/base/`](./tokens/base/) or [`tokens/tiers/`](./tokens/tiers/).
2. Run `npm run build`.
3. Commit JSON source AND the regenerated files together (`tokens.css`, `tokens.ts`, `tailwind.preset.cjs`, `tokens.dart`).
4. Update [`CHANGELOG.md`](./CHANGELOG.md) with the why.
5. Tag a release: `git tag v1.x.y && git push --tags` — CI builds and attaches the release artefact.

CI fails the PR if generated files are out of sync with JSON sources.

## Versioning

Semver:

- **Major** — renaming a token, removing a variant, changing tier semantics.
- **Minor** — new tokens, new tier deltas.
- **Patch** — hex tweaks, comment updates, doc fixes.

All changes route through Royce. Document rationale in [`CHANGELOG.md`](./CHANGELOG.md).

## Related

- [`eq-solutions/eq-shell`](https://github.com/eq-solutions/eq-shell) — cross-app auth + navigation chrome. Sets `data-tier` on root.
- [`eq-solutions/eq-field`](https://github.com/eq-solutions/eq-field) — gold-standard Field app.
- [`Milmlow/eq-solves-service`](https://github.com/Milmlow/eq-solves-service) — EQ Service (first consumer of this package; v0.1.0 → v1.0.0 migration pending).
- [`eq-solutions/eq-cards`](https://github.com/eq-solutions/eq-cards) — Flutter consumer (`tokens.dart`).
