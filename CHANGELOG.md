# Changelog

All notable changes to `@eq-solutions/tokens` are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows [SemVer](https://semver.org/).

## [1.0.0] — 2026-05-23

Major restructure. Moves from hand-authored `tokens.ts` + `tokens.css` to a generated-from-JSON pipeline with tier scaffolding and Flutter Dart support.

### Added

- **JSON source of truth** under `tokens/base/` and `tokens/tiers/`. All future edits happen here.
- **Build pipeline** — `node build.mjs` generates four artefacts from JSON: `tokens.css`, `tokens.ts`, `tailwind.preset.cjs`, `tokens.dart`. Zero npm dependencies.
- **Tier scaffolding** — Standard / Advanced / Enterprise as `[data-tier="..."]` CSS selectors. Standard and Advanced inherit the base layer; Enterprise overrides `--eq-tier-accent` (deeper teal) and `--eq-shadow-elevated` (richer floating shadow). Shell applies the tier from the tenant's JWT claim.
- **`tokens.dart`** — Flutter constants for EQ Cards (`EqColors`, `EqSpacing`, `EqRadius`, `EqTypography`).
- **`tailwind.preset.cjs`** — Tailwind v3 / v4 preset for apps that prefer JS config.
- **Tier tokens** — `--eq-tier-accent` (tenant-customisable highlight) and `--eq-shadow-elevated` (premium floating-surface shadow).
- **CI workflow** — `.github/workflows/release.yml` verifies generated files are in sync with JSON source on every PR and publishes a GitHub release on tag push.
- **Delta-audit script** — `scripts/audit-tokens.mjs` scans EQ apps for raw hex/px values and classifies them against canonical (matched / drift / unknown). Reports written to `audit-reports/<app>.json`.

### Changed

- **Public exports** — `@eq-solutions/tokens/tailwind` and `@eq-solutions/tokens/dart` now exposed via `exports` map.
- **CSS structure** — base layer on `:root`, tier deltas under `[data-tier="..."]` selectors, Tailwind v4 `@theme` block at the end.
- **Reference resolution** — JSON refs like `{color.gray.200.value}` emit as `var(--eq-gray-200)` in CSS (preserving cascade) and as literal hex values in TS / Dart.
- **Package type** — set to `module` (ESM); `.cjs` extension preserved on the Tailwind preset so it loads as CommonJS.

### Consumer impact

- **Service** (currently pinned to `v0.1.0`) — bumping to `v1.0.0` is non-breaking. All `tokens.css` and `tokens.ts` paths and exports preserved; new `shadows.elevated` and `tier` exports added.
- **New consumers** — wire via the new tailwind preset or Dart consumer paths.

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
