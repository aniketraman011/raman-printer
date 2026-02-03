# How to Change Site Icons (Favicon)

The site icons are controlled through Next.js 14's built-in icon system.

## Current Icons

We've added a custom SVG icon at `public/icon.svg` with a printer design in Raman Prints branding colors (Indigo gradient).

## Method 1: Use Existing icon.svg

The `icon.svg` file will automatically be used as the favicon. Next.js will generate all required sizes.

**No additional steps needed!** Just restart your dev server:
```bash
npm run dev
```

## Method 2: Generate PNG Icons (Recommended for Better Support)

1. **Use a Favicon Generator**
   - Go to https://favicon.io/favicon-converter/
   - Upload your logo/image (square, minimum 512x512px)
   - Download the generated zip file

2. **Extract Files**
   - Unzip the downloaded file
   - You'll get: favicon.ico, android-chrome-192x192.png, android-chrome-512x512.png, apple-touch-icon.png

3. **Add to Project**
   ```
   public/
   ├── favicon.ico        (for browser tabs)
   ├── icon.png           (192x192 - for PWA)
   ├── apple-icon.png     (180x180 - for iOS)
   ```

4. **Restart Dev Server**
   ```bash
   npm run dev
   ```

## Method 3: Use Next.js app Directory Icons (Automatic)

Next.js 14 supports these special filenames in the `app/` directory:

- `app/icon.png` or `app/icon.svg` - Favicon (32x32)
- `app/apple-icon.png` - Apple touch icon (180x180)

Just place your icon files with these exact names in the `app/` directory, and Next.js will auto-configure them.

## Current Configuration

The site metadata is configured in `app/layout.tsx`:

```typescript
export const metadata: Metadata = {
  title: "Raman Prints - Smart Printing for Students",
  description: "Fast, affordable printing service for students",
  icons: {
    icon: [
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};
```

## Recommended Icon Sizes

| File | Size | Purpose |
|------|------|---------|
| `favicon.ico` | 32x32 | Browser tab icon (legacy) |
| `icon.png` | 192x192 | Android PWA icon |
| `apple-icon.png` | 180x180 | iOS home screen icon |
| `icon.svg` | Any | Scalable favicon (modern browsers) |

## Tips

1. **Keep it Simple**: Icons look best when simple and recognizable at small sizes
2. **Use High Contrast**: Ensure icon is visible on both light and dark browser themes
3. **Square Format**: Always use square images (1:1 aspect ratio)
4. **Clear Background**: Use transparent background for PNG icons
5. **Brand Colors**: Use your brand's primary color (Indigo #4f46e5 for Raman Prints)

## Current Icon Design

The provided `icon.svg` features:
- Indigo gradient background (brand colors)
- White printer icon
- Green LED indicator (active status)
- Paper with print lines
- Professional, modern design

## Customization

To change the icon design, edit `public/icon.svg` or replace with your own SVG/PNG files following the naming conventions above.

For a custom design:
1. Use Figma, Canva, or Adobe Illustrator
2. Export as SVG (for scalability) or PNG (512x512)
3. Run through a favicon generator
4. Replace files in `public/` directory

## Verification

After adding/changing icons:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard reload page (Ctrl+Shift+R)
3. Check browser tab for new favicon
4. Test on mobile devices (add to home screen)

## Production Deployment

Icons will automatically be included in production build. No special configuration needed for Vercel deployment.
