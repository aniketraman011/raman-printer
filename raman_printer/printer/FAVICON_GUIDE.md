# Favicon / Site Icons Guide

## Current Setup
Custom SVG icon at `public/icon.svg` (indigo gradient with printer design).
Configured in `app/layout.tsx` metadata.

## Changing Icons

### Option 1: Replace SVG
Replace `public/icon.svg` with your own SVG. Restart the dev server.

### Option 2: Use PNG Icons
1. Create or generate icons at [favicon.io/favicon-converter](https://favicon.io/favicon-converter)
2. Place in `public/`:
   - `favicon.ico` (32x32)
   - `icon.png` (192x192)
   - `apple-icon.png` (180x180)
3. Update `icons` in `app/layout.tsx` metadata

### Option 3: App Directory Icons
Place `icon.png` and `apple-icon.png` directly in the `app/` directory.
Next.js auto-detects these.

## Tips
- Use a simple, high-contrast design
- Keep it square (1:1 aspect ratio)
- Use brand colors (indigo #4f46e5)
- Test on both light and dark browser tabs
