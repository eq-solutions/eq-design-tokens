# Changelog

All notable changes to `@eq-solutions/tokens` are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows [SemVer](https://semver.org/).

## [0.1.0] — 2026-05-22

Initial extraction. Pixel-faithful to the tokens already shipping in `eq-solves-service` plus the supporting scale from the canonical EQ design profile.

### Added

- Brand colour tokens: `--eq-sky` `--eq-deep` `--eq-ice` `--eq-ink` `--eq-grey` `--eq-white`.
- Neutral scale: `--eq-gray-50` through `--eq-gray-600`.
- Status colours: success / warning / error (background + text pairs).
- Type scale `--eq-text-xs` (11px) through `--eq-text-4xl` (48px); body line-height and tracking variants.
- Spacing scale `--eq-space-1` (4px) through `--eq-space-16` (64px) on the 8px grid; max content width 1200px.
- Semantic radii: `chip` (4) · `input` (6) · `card` (8) · `shell` (12) · `pill` (9999).
- Border tokens — single canonical hairline plus input variant.
- Shadow tokens `--eq-shadow-sm` (raised UI) and `--eq-shadow-lg` (modals).
- Motion tokens — 150ms default, 300ms drawer, 700ms spinner, standard cubic-bezier ease.
- Focus ring token `--eq-focus-ring` for accessible input focus states.
- Tailwind v4 `@theme inline` block exposing the above as Tailwind utility classes.
- TypeScript counterpart in `tokens.ts` for programmatic access (charts, PDF generation, email templates).

### Consumer contract

- Host apps must load Plus Jakarta Sans themselves and expose it as `--font-jakarta`. This package never ships font files.
- Apps consume via `@import "@eq-solutions/tokens/tokens.css"` placed before any `@import "tailwindcss"` directive that depends on the theme.
