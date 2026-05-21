# @eq-solutions/tokens

Canonical EQ Solutions design tokens. The single source of truth for colour, type, spacing, radii, shadow, and motion across every EQ surface — Field, Service, Quotes, Cards, Shell, Intake, Expenses, Ops, and marketing.

If you're adding a new EQ surface or changing an existing one, import from here. Hardcoded hex values, raw px shadows, and bespoke radii outside this package count as drift and should be migrated as you touch them.

## Install

This package is distributed via git URL, not a registry. Pin to a tag for reproducibility.

```sh
pnpm add github:Milmlow/eq-design-tokens#v0.1.0
# or
npm install github:Milmlow/eq-design-tokens#v0.1.0
```

Bumping versions = bump the tag and reinstall. The package contents are checked-in source (`tokens.css` + `tokens.ts`), so there's no build step — what's in the repo is what consumers get.

## Use — Tailwind v4 (Next.js, modern Vite, etc.)

In your app's global stylesheet, import this file **before** any `@tailwindcss` imports that rely on the theme:

```css
/* app/globals.css (Next 15+ / Tailwind v4) */
@import "@eq-solutions/tokens/tokens.css";
@import "tailwindcss";
```

Host app is responsible for loading **Plus Jakarta Sans** and exposing it as `--font-jakarta`. In Next.js 15+ with `next/font/google`:

```ts
// app/layout.tsx
import { Plus_Jakarta_Sans } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body>{children}</body>
    </html>
  );
}
```

Then use the Tailwind utility classes the `@theme` block emits:

```tsx
<button className="bg-eq-sky hover:bg-eq-deep text-eq-white rounded-eq-input">
  Save
</button>

<div className="rounded-eq-card border border-eq-gray-200 bg-eq-white p-4">
  Standard EQ card.
</div>
```

## Use — Tailwind v3

The `@theme` block is Tailwind v4-specific. On v3, consume the bare CSS variables in your stylesheet and reference them in your Tailwind config:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'eq-sky':  'var(--eq-sky)',
        'eq-deep': 'var(--eq-deep)',
        'eq-ice':  'var(--eq-ice)',
        'eq-ink':  'var(--eq-ink)',
        'eq-grey': 'var(--eq-grey)',
        // ...etc — see tokens.css for the full list
      },
      borderRadius: {
        'eq-chip':  'var(--eq-radius-chip)',
        'eq-input': 'var(--eq-radius-input)',
        'eq-card':  'var(--eq-radius-card)',
        'eq-shell': 'var(--eq-radius-shell)',
      },
    },
  },
};
```

## Use — vanilla CSS / no Tailwind (legacy EQ Field, static HTML)

Just import the file. The `@theme` block is harmless outside Tailwind (it's a no-op).

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
  outline-offset: 2px;
}
```

## Use — programmatic (TS / JS)

For charts, canvas, PDF generation, email templates, anywhere you can't use CSS:

```ts
import { colours, radii, motion } from '@eq-solutions/tokens';

const chartConfig = {
  primaryColour: colours.brand.sky,
  hoverColour:   colours.brand.deep,
  cornerRadius:  radii.card,
  animationMs:   motion.durationDefault,
};
```

## What's in v0.1.0

| Group | Tokens |
|---|---|
| Brand colours | `--eq-sky` `--eq-deep` `--eq-ice` `--eq-ink` `--eq-grey` `--eq-white` |
| Neutral scale | `--eq-gray-50` through `--eq-gray-600` |
| Status | success / warning / error (bg + text pairs) |
| Type scale | `--eq-text-xs` (11px) through `--eq-text-4xl` (48px) |
| Spacing | `--eq-space-1` (4px) through `--eq-space-16` (64px) on the 8px grid |
| Radii | chip 4 · input 6 · card 8 · shell 12 · pill 9999 |
| Borders | hairline 1px, default + input variants |
| Shadows | `sm` (floating cards) + `lg` (modals) — never on static cards |
| Motion | 150ms default · 300ms drawer · 700ms spinner · cubic-bezier ease |
| Focus | `--eq-focus-ring` — required on every focusable input |

See [`tokens.css`](./tokens.css) for the full file with inline documentation.

## What's *not* in v0.1.0

- No Plus Jakarta Sans font files — host apps load the font themselves and expose it as `--font-jakarta`. This keeps the package framework-agnostic and avoids duplicate font payloads.
- No React / Vue / Svelte components — those will live in a separate `@eq-solutions/ui` package once the primitives stabilise.
- No icons — likewise a separate package (`@eq-solutions/icons`) when extracted.
- No SKS subsidiary palette — SKS has its own colour set (`#1F335C`, `#7C77B9`) and lives outside the EQ token system.

## Hard don'ts (mirror of the design profile)

- ✗ Don't invent new brand colours. Subsidiary palettes vary only supporting colours.
- ✗ Don't use drop shadows on static cards. Floating UI only.
- ✗ Don't use gradients as page backgrounds. The only canonical gradient is the Service sign-in panel.
- ✗ Don't use coloured left-border accents on cards. (Field's site-card 5px band is data, not decoration.)
- ✗ Don't use pure black anywhere — use `--eq-ink`.

## Versioning & contribution

Semver. Breaking changes (renaming or removing a token) bump the major. New tokens bump the minor. Hex tweaks to existing tokens bump the patch.

All changes route through Royce. There's no PR process beyond "open one and ping him." Document the rationale in [`CHANGELOG.md`](./CHANGELOG.md).

## Related

- [`eq-solutions/eq-shell`](https://github.com/Milmlow/eq-shell) — cross-app auth + navigation chrome.
- [`eq-solutions/eq-solves-field`](https://github.com/Milmlow/eq-solves-field) — gold-standard Field app.
- [`eq-solutions/eq-solves-service`](https://github.com/Milmlow/eq-solves-service) — Service app (first consumer of this package).
