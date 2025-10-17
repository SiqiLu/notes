---
title: Astro Responsive Image Quick Reference
description: A quick reference guide for designers and frontend developers on handling responsive images in Astro, based on Device Matrix v2025.1
lastUpdated: 2025-10-16
tags: [astro, responsive-images, web-performance, frontend, design]
---

> **Target Audience**: Designers + Frontend Developers
> **Goal**: Quickly and correctly handle image assets in website development
> **Based on**: Device Matrix v2025.1 (2025-10-10)

---

## 1. Designer's Guide

### 1.1 Design Reference Dimensions (Best Practices)

| Site Type        | Design Width | Notes                                                                  |
| ---------------- | ------------ | ---------------------------------------------------------------------- |
| **Desktop Site** | **3840px**   | Corresponds to 4K display physical width, covers Tablet/Laptop/Desktop |
| **Mobile Site**  | **1320px**   | Corresponds to maximum Mobile device physical width (iPhone Pro Max)   |

**Important Principles**:

- Maximum export size of an image = Actual size of the image in the design file
- Example: In a Desktop design file (3840px), if an image width is 1200px, then the maximum export width is 1200px

---

### 1.2 Image Export Standards

#### Format and Quality

| Image Type             | Recommended Format | Quality Settings                | Notes                                                          |
| ---------------------- | ------------------ | ------------------------------- | -------------------------------------------------------------- |
| **Photography**        | JPEG               | Quality 90-95, sRGB color space | Can reduce to 88-90 if file size is abnormally large           |
| **Transparent Images** | PNG                | Lossless                        | Logos, illustrations, images requiring transparent backgrounds |
| **Logo/Icons**         | PNG or SVG         | Lossless                        | Prefer SVG (vector format)                                     |

#### Export Checklist

- [ ] Confirm the actual width (px) of the image in the design file
- [ ] Export at actual width (do not upscale)
- [ ] Select the correct format (Photography→JPEG, Transparent→PNG)
- [ ] Check quality settings (JPEG: 90-95)
- [ ] Confirm color space is sRGB
- [ ] Clear file naming (e.g., `hero-desktop.jpg`, `card-thumbnail.jpg`)

---

## 2. Frontend Developer's Guide

### 2.1 Component Selection

| Component   | Use Case                  | Advantages                                      | Disadvantages                        |
| ----------- | ------------------------- | ----------------------------------------------- | ------------------------------------ |
| `<Picture>` | **Default Recommended**   | Supports multi-format fallback (AVIF→WebP→JPEG) | More verbose HTML                    |
| `<Image>`   | Single format requirement | More concise HTML                               | Requires manual format specification |

**Recommended Strategy**:

- **Photography**: Use `<Picture>`, format order `['avif', 'webp', 'jpeg']`
- **Transparent Images**: Use `<Picture>`, format order `['avif', 'webp', 'png']`
- **WebP Only**: Use `<Image>`, format `'webp'`

---

### 2.2 Quick Implementation Process

#### Step 1: Install Utility Function

Copy the `utils/image_breakpoints.ts` file to your project (complete code in [Astro Responsive Image Specification](/notes/astro-responsive-image-specification/#42-utility-method-code))

#### Step 2: Determine Parameters Based on Design File

**Based on the image dimensions exported by the designer, determine utility function parameters**:

| Design Scenario                         | Utility Function Parameters                      | Notes                                     |
| --------------------------------------- | ------------------------------------------------ | ----------------------------------------- |
| Image fills design width (3840/1320)    | `{}`                                             | Default full width, no parameters needed  |
| Image width in design is 1200px         | `{ maxWidth: 1200 }`                             | Specify maximum export width of the image |
| Image occupies 30% of design width      | `{ ratio: 0.3 }`                                 | Specify ratio of image to viewport width  |
| Fixed size image (e.g., 100×100 avatar) | `{ minWidth: 100, maxWidth: 100, roundStep: 1 }` | Fixed size range                          |

**Key Principle**: `maxWidth` should equal the actual width of the image in the design file

#### Step 3: Write Component Code

**Using `<Picture>` Component (Recommended)**:

```astro
---
import { Picture } from "astro:assets";
import hero from "@/assets/hero.jpg";
import { computeDesktopBreakpoints } from "@/utils/image_breakpoints";

// Set parameters based on the actual image width in the design file
// Example: Image width in design is 1200px
const { widths } = computeDesktopBreakpoints({ maxWidth: 1200 });
// Or: Image occupies 30% of design width
// const { widths } = computeDesktopBreakpoints({ ratio: 0.3 });
// Or: Full width image (fills 3840px)
// const { widths } = computeDesktopBreakpoints({});
---

<Picture
  src={hero}
  alt="Description text"
  widths={widths}
  formats={["avif", "webp", "jpeg"]}
  {/* Use jpeg for photography, png for transparent images */}
  sizes="100vw"
  {/* Adjust based on actual layout: 100vw for full width, 30vw for fixed ratio, 25px for fixed pixels */}
/>
```

**Using `<Image>` Component (Single Format)**:

```astro
---
import { Image } from "astro:assets";
import hero from "@/assets/hero.jpg";
import { computeDesktopBreakpoints } from "@/utils/image_breakpoints";

const { widths } = computeDesktopBreakpoints({ maxWidth: 1200 });
---

<Image
  src={hero}
  alt="Description text"
  format="webp"
  {/* Single format: webp/jpeg/png */}
  widths={widths}
  sizes="100vw"
/>
```

**Utility Function Parameter Description**:

```ts
// ratio: Ratio of image to viewport width (0-1), e.g., 0.3 means 30%
// maxWidth: Maximum image width (px), typically equals image width in design file
// minWidth: Minimum image width (px), used for fixed sizes or filtering small breakpoints
// roundStep: Rounding step (px), default 16, recommended 1 for fixed size scenarios
// designViewportWidth: Design viewport width (px), default Desktop 3840, Mobile 1320
```

---

### 2.3 sizes Attribute Quick Reference

| Layout Type            | sizes Attribute                      | Notes                                |
| ---------------------- | ------------------------------------ | ------------------------------------ |
| **Full Width**         | `"100vw"`                            | Image fills viewport width           |
| **Fixed Ratio**        | `"30vw"`                             | Image occupies 30% of viewport width |
| **Fixed Pixels**       | `"25px"`                             | Image fixed at 25px CSS width        |
| **Responsive Mixed**   | `"(min-width: 1024px) 50vw, 100vw"`  | Desktop 50%, Mobile 100%             |
| **Complex Responsive** | `"(min-width: 1024px) 800px, 100vw"` | Desktop fixed 800px, Mobile 100%     |

**Writing Rules**:

- Write media queries from large screen to small screen
- Last value is the default (no media query)
- Units: `vw` (viewport percentage) or `px` (fixed pixels)

---

### 2.4 Validation Checklist

**Before Build**:

- [ ] Confirm original image dimensions meet design delivery standards
- [ ] Confirm `widths` array matches the scenario
- [ ] Confirm `sizes` attribute matches actual layout
- [ ] Confirm `formats` order is correct (AVIF → WebP → JPEG/PNG)

**After Build** (Browser DevTools):

- [ ] Network panel: Check loaded image filenames and dimensions
- [ ] Console: Verify `window.devicePixelRatio` and `img.currentSrc`
- [ ] Check if images are sharp (not blurry)
- [ ] Check if file sizes are reasonable (not too large)

---

## 3. Common Errors and Solutions

| Issue                | Cause                                             | Solution                                                                          |
| -------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Blurry Images**    | `sizes` is too small, or `widths` is insufficient | Check if `sizes` matches actual layout; increase `maxWidth`                       |
| **Bandwidth Waste**  | `sizes` is too large, or too many `widths`        | Check if `sizes` is correct; reduce unnecessary breakpoints                       |
| **Long Build Time**  | Too many `widths` array entries (>10)             | Use default parameters (8 breakpoints), avoid manually specifying too many widths |
| **AVIF Not Working** | Browser does not support                          | Normal, will automatically fallback to WebP/JPEG                                  |
| **Image Distortion** | Width-height ratio error during export            | Check design file, re-export with correct aspect ratio                            |

---

**Document Version**: v1.0 (2025-10-16)
**Based on**: Device Matrix v2025.1, Astro Responsive Image Spec ZH
**Maintenance**: Updated in sync with original specification documents
