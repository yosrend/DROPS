# Changelog

## 2026-06-17 — Initial clone from Figma Make

- Cloned DROPS project from Figma Make (`p7Fw5zN7yoSHttg7pvPoQE`)
- Created React + Vite + Tailwind CSS project structure
- Copied App.tsx with Desktop 3D tunnel view and Mobile stack/scatter view
- Added shadcn/ui utility components (cn, useIsMobile, ImageWithFallback)
- Configured Tailwind CSS v4 with custom theme (dark mode, brand colors)
- Pushed to https://github.com/yosrend/DROPS.git

## 2026-06-19 — E2E screenshot tests for all UI states

- Created `/Users/yoseprendi/Vibe Coding/DROPS/tests/screenshots.spec.ts` — Playwright E2E tests
- 13 tests covering all key UI components and states
- 25 visual checks (dark backgrounds, white text, glass effects, element presence)
- Updated `playwright.config.ts` to point at `./tests` directory
- Screenshots saved to `test-output/screenshots/`
- Visual issues report at `test-output/screenshots/visual-issues-report.json`
- HTML report at `test-output/report/index.html`
