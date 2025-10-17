---
title: Astro Responsive Image Specification
description: Complete specification for implementing responsive images in Astro based on Device Matrix v2025.1, covering Desktop and Mobile sites with three typical scenarios
lastUpdated: 2025-10-16
tags: [astro, responsive-images, device-matrix, web-performance, specification]
---

> This document is intended for frontend/design/product engineering teams to implement a stable, reusable, and verifiable **responsive image** solution in **Astro** projects based on a unified **Device Matrix**. We adopt a divide-and-conquer approach with **Desktop site** and **Mobile site**, demonstrating the complete implementation method through **three typical scenarios** (100% viewport width, 30% viewport width, and fixed 30–100px).
>
> **Based on**: Device Matrix v2025.1 (2025-10-10)

---

> ⚠️ **Important Concept Distinction**
> This document discusses **responsive image optimization** (based on physical resolution), not **responsive CSS layout design** (based on CSS resolution).
>
> - **Responsive image optimization**: Selecting appropriately sized images based on the device's **Physical Width (physical resolution)** to avoid wasting bandwidth
> - **Responsive CSS design**: Adjusting page layout based on the device's **CSS Width (logical resolution)** (Media Queries)
>   **Example**: MacBook Air 13″ (CSS 1280px × DPR 2.0 = **2560px physical**)
> - CSS responsive: Uses Desktop layout with `@media (min-width: 1280px)`
> - Image responsive: Loads 2560px width image resources through `srcset`
>   These two are **complementary**, not substitutes. This document focuses on optimizing image resources by physical width.

---

## 0. Document Information and Terminology

- **Scope**: Desktop site (covering Tablet / Laptop / Desktop) and Mobile site (covering Mobile).
- **Site routing strategy**: Route distribution by device type, Mobile devices access Mobile site, other devices access Desktop site.
- **Key terminology**:
  - **CSS px**: Layout logical pixels, the value returned by `window.innerWidth`.
  - **Physical Width (px)**: Physical rendering width = CSS Width × DPR, the actual pixel width the browser needs to render.
  - **DPR**: Device Pixel Ratio, used by the browser to select resources in `srcset`.
  - **`vw`**: Viewport width unit; `1vw = 1% of viewport width`.
  - **`srcset` (`w` descriptor)**: List of **physical pixel widths** for candidate resources.
  - **`sizes`**: Tells the browser the **CSS display width** of the image at different viewports, used to select the most appropriate `srcset` candidate.
  - **Discrete breakpoints (Breakpoint Strategy)**: The "breakpoints" in this document refer to **image resource physical width breakpoints** (such as 1080, 1206, 1320), distinct from CSS width breakpoints (such as 375px, 768px, 1024px) in CSS responsive design. Using a finite number of discretely distributed image widths rather than generating images for every possible pixel value. After the browser calculates the actual required width based on `sizes`, it automatically selects a candidate image from `srcset`. The selection rule is: prioritize selecting the candidate **closest to and not smaller than** the required width; if all candidates are smaller than the required width, select the **largest** candidate. This strategy can significantly reduce the number of generated images (typically 5-8 breakpoints can cover all devices) while maintaining good visual quality.

---

## 1. Background and Goals (What Problem Are We Solving)

- **Problem**: How to achieve both "sharp and clear" and "no excessive bandwidth and build time waste" across different devices and layouts? Hand-writing `<picture>`/`srcset` is error-prone, difficult to maintain, and lacks unified breakpoint standards.
- **Goals**:
  1. Unify breakpoint semantics based on the **Device Matrix**;
  2. Use Astro `<Picture>` / `<Image>` for standardized output;
  3. Divide and conquer by **dual sites**, optimizing separately for Desktop and Mobile;
  4. **Dynamically generate breakpoints** based on design draft width through **utility methods**, avoiding "hardcoded constants";
  5. **Design baseline constraint**: Use **Physical Width 3840** as the design draft baseline width. The maximum export size of images depends on their actual size in the 3840 width design draft. For example: If an image is 100px wide in the 3840 design draft, regardless of how large the target device physical width is (such as Desktop 6K's 6016px), the original design draft export width for that image is still 100px, and the generated optimized image maximum width will not exceed 100px.

---

## 2. Technical Environment (Astro Components and Build)

- **`<Picture />`** (from `astro:assets`): Outputs multiple formats/sizes at once (`<picture>` + `<source>` + `<img>`).
- **`<Image />`** (from `astro:assets`): Outputs a single `<img>`, can configure single format, multiple sizes.
- Build-time optimization (common points): Automatically generates `srcset`/`sizes`, fills `width/height` to avoid CLS, enables `loading="lazy"`/`decoding="async"`, resource hashing and cache-friendly.

**Design delivery recommendations**:

- **Photography**: **JPEG (sRGB, quality 90–95)** (can reduce to 88–90 if file size is exceptionally large).
- **Transparency/Illustration/Logo**: **PNG** (or lossless WebP).
- **Aspect ratio**: Based on design draft (this document uses 16:9 as an example, replace height with actual design ratio).

---

## 3. Device Matrix (Two Batches) — Based on Device Matrix v2025.1

> Design baseline: Use **Physical Width 3840** as the design draft baseline width, the maximum export size of images depends on their actual size in the 3840 width design draft.

### 3.1 Mobile Site Devices (Covering Mobile)

| Category    | Device ID       | Physical Width (px) | CSS Width (px) | DPR | Representative Devices         |
| ----------- | --------------- | ------------------: | -------------: | --: | ------------------------------ |
| 📱 Mobile S | `mobile-small`  |                1080 |            360 |   3 | Galaxy S25, Xiaomi 14          |
| 📱 Mobile M | `mobile-medium` |                1206 |            402 |   3 | iPhone 17, iPhone 17 Pro       |
| 📱 Mobile L | `mobile-large`  |                1320 |            440 |   3 | iPhone 17 Pro Max, Mate 70 Pro |

**Explanation**:

- Mobile site serves all Mobile devices (physical width 1080–1320px)
- Mainstream mobile device DPR range is 2.625–3.75 (iPhone all series 3.0, Samsung base models 3.0, Plus/Ultra models 2.8125/3.75, Google Pixel 2.625/3.0, Huawei/Xiaomi 3.0)
- This solution classifies by physical width (1080/1206/1320), covering devices with different DPR
- Physical width is the `w` descriptor value in `srcset`

### 3.2 Desktop Site Devices (Covering Tablet + Laptop + Desktop)

#### 3.2.1 Tablet Devices (3 tiers)

| Category    | Device ID       | Physical Width (px) | CSS Width (px) | DPR | Representative Devices     |
| ----------- | --------------- | ------------------: | -------------: | --: | -------------------------- |
| 💻 Tablet S | `tablet-small`  |                1600 |            533 |   3 | Samsung Tab S9             |
| 💻 Tablet M | `tablet-medium` |                1668 |            834 |   2 | iPad Pro 11″, iPad Air 11″ |
| 💻 Tablet L | `tablet-large`  |                2048 |           1024 |   2 | iPad Air 13″               |

#### 3.2.2 Laptop Devices (4 tiers)

| Category     | Device ID       | Physical Width (px) | CSS Width (px) |     DPR | Representative Devices              |
| ------------ | --------------- | ------------------: | -------------: | ------: | ----------------------------------- |
| 💻 Laptop S  | `laptop-small`  |                1920 |      1280-1920 | 1.0-1.5 | Dell XPS 13 FHD, Surface Laptop 13″ |
| 💻 Laptop M  | `laptop-medium` |                2560 |      1280-1664 | 1.5-2.0 | MacBook Air 13″, Surface Laptop 15″ |
| 💻 Laptop L  | `laptop-large`  |                2880 |      1440-1512 |     2.0 | MacBook Air 15″, MacBook Pro 14″    |
| 💻 Laptop XL | `laptop-xlarge` |                3456 |           1728 |     2.0 | MacBook Pro 16″, Dell XPS 15 OLED   |

**Note**: Laptop devices have CSS Width ranges because different scaling ratios (1.0/1.5/2.0) cause the same physical resolution to correspond to different CSS widths.

#### 3.2.3 Desktop Devices (5 tiers)

| Category              | Device ID           | Physical Width (px) | CSS Width (px) | DPR / Scale | Representative Devices             |
| --------------------- | ------------------- | ------------------: | -------------: | ----------: | ---------------------------------- |
| 🖥️ Desktop 2K         | `desktop-2k`        |                2560 |           2560 |           1 | 27″ QHD Display (2560×1440)        |
| 🖥️ Desktop 4K         | `desktop-4k`        |                3840 |           3840 |           1 | 4K Display Native (UHD 27–32″)     |
| 🖥️ Desktop 4K @1.5x   | `desktop-4k-1.5x`   |                3840 |           2560 |         1.5 | 4K Display @150% (Windows Default) |
| 🖥️ Desktop 4K @Retina | `desktop-4k-retina` |     5120 → **3840** |           2560 |           2 | iMac 5K, Pro Display XDR @Retina   |
| 🖥️ Desktop 6K         | `desktop-6k`        |     6016 → **3840** |           6016 |           1 | Pro Display XDR (6K Native)        |

**Note**:

- Desktop 4K @1.5x and Desktop 4K have the same physical width (both 3840), but different CSS widths

#### 3.2.4 Desktop Site Physical Width Summary (Tablet + Laptop + Desktop)

The Desktop site covers **three major device categories** (Tablet, Laptop, Desktop). After deduplicating and sorting all physical widths, we get:

```text
Complete device matrix: 1600, 1668, 1920, 2048, 2560, 2880, 3456, 3840, 5120, 6016
Default breakpoints (designViewportWidth=3840): 1600, 1668, 1920, 2048, 2560, 2880, 3456, 3840
```

**Source explanation**:

- **Tablet devices (3 tiers)**: 1600, 1668, 2048
- **Laptop devices (4 tiers)**: 1920, 2560, 2880, 3456
- **Desktop devices (5 tiers)**: 2560, 3840, 5120, 6016
  - Desktop 2K: 2560
  - Desktop 4K / 4K @1.5x: 3840
  - Desktop 4K @Retina (iMac 5K, Pro Display XDR @Retina): 5120
  - Desktop 6K (Pro Display XDR Native): 6016
- **After deduplication**: 1600, 1668, 1920, 2048, 2560, 2880, 3456, 3840, 5120, 6016

**Explanation**:

- Desktop 2K (2560) and Laptop M (2560) have the same physical width, one is retained after deduplication
- By default (`designViewportWidth=3840`), breakpoints are capped at 3840, resulting in **8 discrete breakpoints**
- By setting `designViewportWidth=5120` or `6016`, breakpoints for 5K/6K displays can be included, resulting in **9 or 10 breakpoints**
- This design balances default behavior efficiency with flexible support for high-resolution displays

---

## 4. Design Principles and Breakpoint Utility Methods

### 4.1 Design and Selection Principles

- **Design baseline**: Use **Physical Width 3840** as the design draft baseline width, as the default maximum export size limit for images. In actual projects, the maximum width of images is controlled by the `maxWidth` parameter, which can be flexibly set according to the actual size of the image in the design draft (e.g., full-width image is 3840, card thumbnail might be 1152).
- **Demonstration scenario explanation**: This solution demonstrates how to handle responsive images with different layout requirements through the following three typical scenarios, but **utility functions support any ratio and size range**, not limited to these three scenarios:
  - **Scenario 1 (100% viewport width)**: Image fills viewport width (like Hero Banner), generating candidate widths based on **Physical Width**.
  - **Scenario 2 (30% viewport width)**: Image occupies 30% of viewport width (like card thumbnails), calculated as **Physical Width × 0.3**, capped at **3840×0.3 = 1152**.
  - **Scenario 3 (Fixed 30–100px)**: Fixed-size images (like avatars/icons), directly generating candidate widths in the interval [30,100], not affected by viewport.
  - **Other scenarios**: Such as 50% width sidebar images, fixed 200px logos, large images with minimum width 800px, etc., can all be achieved by adjusting `ratio`, `minWidth`, `maxWidth` parameters.
- **Discrete breakpoint strategy**: Uses a finite number of image widths (e.g., Desktop site uses 8 breakpoints by default, up to 10 breakpoints when supporting 5K/6K displays), rather than generating precisely for each device. Reasons: (1) Scrollbars/sidebars/non-maximized windows etc. cause actual display width to fluctuate; (2) Browser automatically selects the most appropriate candidate (prioritizes selecting the image closest to and not smaller than the required width, otherwise selects the largest image); (3) Significantly reduces build time and storage costs.
- **Rounding strategy**: Round up to engineering-friendly values (recommended step 16; can also be configured to 8/4/1).

### 4.2 Breakpoint Utility Methods (Flexible Ratios and Constraints)

> **File path** (recommended): `utils/image_breakpoints.ts`
> The code in this section can be copied directly to your project without additional dependencies.

````ts
// ============================================================
// Type Definitions
// ============================================================

/**
 * Breakpoint configuration options
 *
 * @remarks
 * Basic configuration options, including common configuration parameters (max/min width, rounding step, etc.)
 *
 * When the ratio parameter is not passed, there are two behaviors:
 * 1. Only maxWidth passed: Automatically infer ratio from 3840 (e.g., maxWidth=1500 → ratio≈0.39)
 * 2. Neither passed: Default ratio=1.0 (100vw), maxWidth=3840
 *
 * @example Default 100% width
 * ```ts
 * computeDesktopBreakpoints({})
 * // => { widths: [1600, 1680, 1920, ...] }
 * ```
 *
 * @example Automatically infer ratio
 * ```ts
 * computeDesktopBreakpoints({ maxWidth: 1500 })
 * // Internal calculation: ratio = 1500 / 3840 ≈ 0.391
 * // => { widths: [640, 656, 752, 816, 1008, 1136, 1360, 1500] }
 * ```
 */
interface BreakpointOptions {
  /**
   * Image maximum width (pixels)
   *
   * @remarks
   * - Not passed: Defaults to 3840 (Desktop) or 1320 (Mobile)
   * - Passed: Used as the maximum export size limit for the image
   * - If minWidth is also passed, must have maxWidth >= minWidth
   * - **Important**: User-specified maxWidth is treated as a key breakpoint and will definitely appear in the final breakpoint array
   *
   * @example
   * ```ts
   * { maxWidth: 1152 }  // Card thumbnail max 1152px, breakpoint array must include 1152
   * { maxWidth: 100 }   // Avatar max 100px, breakpoint array must include 100
   * ```
   */
  maxWidth?: number;

  /**
   * Image minimum width (pixels)
   *
   * @remarks
   * - Used to filter out breakpoint candidates smaller than this value (applied after rounding)
   * - **Important**: User-specified minWidth is treated as a key breakpoint and will definitely appear in the final breakpoint array
   * - Common uses: fixed-size images, filtering out too-small breakpoints, defining size ranges
   *
   * @example
   * ```ts
   * { minWidth: 800 }               // Filter out breakpoints < 800px, and breakpoint array must include 800
   * { minWidth: 30, maxWidth: 100 } // Fixed size range [30, 100], breakpoint array must include 30 and 100
   * { minWidth: 1000 }              // Only generate large image breakpoints, starting from 1000px
   * ```
   */
  minWidth?: number;

  /**
   * Rounding step (pixels)
   *
   * @remarks
   * Rounds calculated breakpoint widths up to multiples of this value, making widths more "engineering-friendly"
   *
   * @default 16
   *
   * @example
   * ```ts
   * { roundStep: 16 }  // 1668 → 1680
   * { roundStep: 8 }   // 1668 → 1672
   * { roundStep: 1 }   // 1668 → 1668 (no rounding)
   * ```
   */
  roundStep?: number;

  /**
   * Design draft viewport width (pixels)
   *
   * @remarks
   * **Important note**: This parameter represents the viewport width of the design draft (i.e., the canvas width of the design draft), not the width of the image itself.
   *
   * **Use cases**:
   * - Suppose your design draft is designed on a 3840px width canvas
   * - An image in the design draft displays as 1000px wide
   * - Then you should pass: `maxWidth: 1000, designViewportWidth: 3840`
   *
   * **Key roles of this parameter**:
   * 1. **Breakpoint width upper limit**: All generated breakpoint widths will not exceed this value
   * 2. **Infer ratio**: When only maxWidth is provided, ratio = maxWidth / designViewportWidth
   * 3. **Default maximum width**: When no parameters are provided, this value is used as the maximum width
   *
   * **Important constraint**:
   * - Must satisfy: `maxWidth <= designViewportWidth`
   * - If this constraint is violated, an error will be thrown
   * - Because image width should not exceed design draft viewport width
   *
   * @default
   * - Desktop: 3840 (corresponds to 4K display physical width)
   * - Mobile: 1320 (corresponds to maximum Mobile device physical width)
   *
   * @example Desktop site based on 1920px design draft
   * ```ts
   * // Design draft viewport width is 1920px, image displays 1200px in design draft
   * computeDesktopBreakpoints({ maxWidth: 1200, designViewportWidth: 1920 })
   * // => ratio = 1200 / 1920 = 0.625 (62.5vw)
   * // => breakpoints will not exceed 1920px
   * ```
   *
   * @example Using default 3840px design draft
   * ```ts
   * // Default Desktop design draft is 3840px, image displays 1000px
   * computeDesktopBreakpoints({ maxWidth: 1000 })
   * // => designViewportWidth defaults to 3840
   * // => ratio = 1000 / 3840 ≈ 0.26 (26vw)
   * ```
   *
   * @example Error example: maxWidth exceeds designViewportWidth
   * ```ts
   * // ❌ Error: image width 2400px exceeds design draft viewport width 1920px
   * computeDesktopBreakpoints({ maxWidth: 2400, designViewportWidth: 1920 })
   * // => Throws error: maxWidth must not exceed designViewportWidth
   * ```
   */
  designViewportWidth?: number;
}

/**
 * Ratio configuration options (used when passing ratio)
 *
 * @remarks
 * When passing the ratio parameter, it represents the proportion of the image to viewport width (between 0-1)
 *
 * @example 30% width
 * ```ts
 * computeDesktopBreakpoints({ ratio: 0.3 })
 * // => { widths: [480, 512, 576, ...] }
 * ```
 *
 * @example 50% width + maximum width limit
 * ```ts
 * computeDesktopBreakpoints({ ratio: 0.5, maxWidth: 2000 })
 * // => { widths: [800, 848, 960, ..., 2000] }
 * ```
 */
interface RatioBreakpointOptions extends BreakpointOptions {
  /**
   * Image proportion to viewport width
   *
   * @remarks
   * - Value range: 0 < ratio <= 1
   * - Common values: 0.3 (30%), 0.5 (50%), 1.0 (100%)
   *
   * @example
   * ```ts
   * { ratio: 0.3 }   // Card thumbnail
   * { ratio: 0.5 }   // Sidebar image
   * { ratio: 1.0 }   // Full-width Banner
   * ```
   */
  ratio: number;
}

/**
 * Breakpoint calculation result
 *
 * @remarks
 * Return value can be directly used for Astro's `<Picture>` or `<Image>` component
 */
interface BreakpointResult {
  /**
   * srcset candidate width array (sorted in ascending order)
   *
   * @remarks
   * - Used for `<Picture widths={widths}>` or `<Image widths={widths}>`
   * - Browser will select the most appropriate candidate based on DPR and sizes attribute
   *
   * @example
   * ```ts
   * [1600, 1680, 1920, 2048, 2560, 2880, 3456, 3840]
   * ```
   */
  widths: number[];
}

// ============================================================
// Constant Definitions (Based on Device Matrix v2025.1)
// ============================================================

/**
 * Mobile site device physical widths (deduplicated and sorted)
 *
 * @remarks
 * Covered devices:
 * - Mobile S (1080px): Galaxy S25, Xiaomi 14
 * - Mobile M (1206px): iPhone 17, iPhone 17 Pro
 * - Mobile L (1320px): iPhone 17 Pro Max, Mate 70 Pro
 */
const MOBILE_PHYSICAL = [1080, 1206, 1320] as const;

/**
 * Desktop site device physical widths (deduplicated and sorted)
 *
 * @remarks
 * Covered device categories:
 * - Tablet (3 tiers): 1600, 1668, 2048
 * - Laptop (4 tiers): 1920, 2560, 2880, 3456
 * - Desktop (5 tiers): 2560, 3840, 5120, 6016
 *   - Desktop 2K: 2560
 *   - Desktop 4K / 4K @1.5x: 3840
 *   - Desktop 4K @Retina (iMac 5K, Pro Display XDR @Retina): 5120
 *   - Desktop 6K (Pro Display XDR Native): 6016
 *
 * Total of 10 breakpoints after deduplication: 1600, 1668, 1920, 2048, 2560, 2880, 3456, 3840, 5120, 6016
 *
 * **Important note**:
 * - By default (designViewportWidth = 3840), breakpoints are capped at 3840, actually using 8 breakpoints
 * - When user specifies larger designViewportWidth (like 5120 or 6016), larger breakpoints will be included
 * - This design allows users to flexibly support 5K/6K displays while maintaining backward compatibility of default behavior
 */
const DESKTOP_PHYSICAL = [1600, 1668, 1920, 2048, 2560, 2880, 3456, 3840, 5120, 6016] as const;

/**
 * Desktop site default design draft viewport width (internal constant)
 *
 * @remarks
 * Represents the default viewport width (canvas width) of the Desktop site design draft, corresponding to 4K display physical width.
 *
 * Purpose:
 * 1. Breakpoint width upper limit: All generated breakpoints will not exceed this value
 * 2. Used to infer ratio: ratio = maxWidth / DESKTOP_DESIGN_VIEWPORT_WIDTH
 * 3. Default maximum width: upper value when no parameters are provided
 */
const DESKTOP_DESIGN_VIEWPORT_WIDTH = 3840;

/**
 * Mobile site default design draft viewport width (internal constant)
 *
 * @remarks
 * Represents the default viewport width (canvas width) of the Mobile site design draft, corresponding to maximum Mobile device physical width.
 *
 * Purpose:
 * 1. Breakpoint width upper limit: All generated breakpoints will not exceed this value
 * 2. Used to infer ratio: ratio = maxWidth / MOBILE_DESIGN_VIEWPORT_WIDTH
 * 3. Default maximum width: upper value when no parameters are provided
 */
const MOBILE_DESIGN_VIEWPORT_WIDTH = 1320;

// ============================================================
// Helper Functions
// ============================================================

/**
 * Round a number up to the nearest multiple of the specified step
 *
 * @param n - Number to be rounded (must be >= 0)
 * @param step - Rounding step (must be a positive integer, unit: pixels)
 * @returns Rounded result
 *
 * @throws {Error} When step <= 0 (prevent division by zero or negative step)
 * @throws {Error} When step is not an integer (pixel values must be integers)
 * @throws {Error} When n < 0 (image width should not be negative)
 *
 * @example
 * ```ts
 * ceilToStep(1668, 16)  // => 1680
 * ceilToStep(1668, 8)   // => 1672
 * ceilToStep(1668, 1)   // => 1668
 * ```
 *
 * @example Error examples
 * ```ts
 * ceilToStep(1668, 0)    // => Throws error: step must be greater than 0
 * ceilToStep(1668, -16)  // => Throws error: step must be greater than 0
 * ceilToStep(1668, 16.5) // => Throws error: step must be an integer
 * ceilToStep(-100, 16)   // => Throws error: n must be non-negative
 * ```
 */
function ceilToStep(n: number, step: number): number {
  if (step <= 0) {
    throw new Error(`[ceilToStep] step must be greater than 0, got ${step}`);
  }
  if (!Number.isInteger(step)) {
    throw new Error(`[ceilToStep] step must be an integer (pixel values must be whole numbers), got ${step}`);
  }
  if (n < 0) {
    throw new Error(`[ceilToStep] n must be non-negative, got ${n}`);
  }
  return Math.ceil(n / step) * step;
}

// ============================================================
// Core Functions
// ============================================================

/**
 * Calculate responsive image breakpoints for Desktop site
 *
 * @remarks
 * Desktop site covers **Tablet + Laptop + Desktop** devices
 * - Physical width range: 1600px - 6016px (complete device matrix)
 * - Default maximum width: 3840px (uses 8 breakpoints by default)
 * - Supports custom designViewportWidth (like 5120/6016) to include larger breakpoints
 *
 * **Function overload logic**:
 * 1. Not passing ratio: Default 100vw, or infer ratio from maxWidth
 * 2. Passing ratio: Calculate breakpoints by specified proportion
 *
 * @param opts - Breakpoint configuration options
 * @returns Breakpoint calculation result (widths array)
 *
 * @throws {Error} When maxWidth < minWidth
 * @throws {Error} When constraints result in no valid breakpoints
 *
 * @example Full-width image
 * ```ts
 * const hero = computeDesktopBreakpoints({})
 * // Calculation process:
 * // 1. Original physical widths (DESKTOP_PHYSICAL, first 8): [1600, 1668, 1920, 2048, 2560, 2880, 3456, 3840]
 * // 2. Scale by ratio=1.0: [1600, 1668, 1920, 2048, 2560, 2880, 3456, 3840]
 * // 3. Round up with roundStep=16: [1600, 1680, 1920, 2048, 2560, 2880, 3456, 3840]
 * // 4. Cap to maxWidth=3840: [1600, 1680, 1920, 2048, 2560, 2880, 3456, 3840]
 * // => { widths: [1600, 1680, 1920, 2048, 2560, 2880, 3456, 3840] }
 * ```
 *
 * @example 30% width card thumbnail
 * ```ts
 * const card = computeDesktopBreakpoints({ ratio: 0.3 })
 * // Calculation process:
 * // 1. Original physical widths: [1600, 1668, 1920, 2048, 2560, 2880, 3456, 3840]
 * // 2. Scale by ratio=0.3: [480, 500.4, 576, 614.4, 768, 864, 1036.8, 1152]
 * // 3. Round up with roundStep=16: [480, 512, 576, 624, 768, 864, 1040, 1152]
 * // 4. Cap to upper=1152: [480, 512, 576, 624, 768, 864, 1040, 1152]
 * // => { widths: [480, 512, 576, 624, 768, 864, 1040, 1152] }
 * ```
 *
 * @example Automatically infer ratio (maximum width 1500px)
 * ```ts
 * const medium = computeDesktopBreakpoints({ maxWidth: 1500 })
 * // Calculation process:
 * // 1. Infer ratio = 1500 / 3840 ≈ 0.391
 * // 2. Original physical widths: [1600, 1668, 1920, 2048, 2560, 2880, 3456, 3840]
 * // 3. Scale by ratio=0.391: [625.6, 652.4, 750.7, 800.8, 1001.0, 1126.1, 1351.3, 1501.4]
 * // 4. Round up with roundStep=16: [640, 656, 752, 816, 1008, 1136, 1360, 1504]
 * // 5. Cap to maxWidth=1500: [640, 656, 752, 816, 1008, 1136, 1360, 1500]
 * // 6. Force add maxWidth=1500: [640, 656, 752, 816, 1008, 1136, 1360, 1500]
 * // => { widths: [640, 656, 752, 816, 1008, 1136, 1360, 1500] }
 * ```
 *
 * @example Fixed-size avatar (30-100px)
 * ```ts
 * const avatar = computeDesktopBreakpoints({ minWidth: 30, maxWidth: 100, roundStep: 1 })
 * // Calculation process:
 * // 1. Infer ratio = 100 / 3840 ≈ 0.026
 * // 2. Original physical widths: [1600, 1668, 1920, 2048, 2560, 2880, 3456, 3840]
 * // 3. Scale by ratio=0.026: [41.6, 43.4, 50.0, 53.2, 66.6, 74.9, 89.9, 100.0]
 * // 4. Round up with roundStep=1: [42, 44, 50, 54, 67, 75, 90, 100]
 * // 5. Cap to maxWidth=100: [42, 44, 50, 54, 67, 75, 90, 100]
 * // 6. Filter minWidth=30: [42, 44, 50, 54, 67, 75, 90, 100] (all >= 30)
 * // 7. Force add minWidth=30 and maxWidth=100: [30, 42, 44, 50, 54, 67, 75, 90, 100]
 * // => { widths: [30, 42, 44, 50, 54, 67, 75, 90, 100] }
 * ```
 *
 * @example 50% width sidebar image + maximum width 2000px
 * ```ts
 * const sidebar = computeDesktopBreakpoints({ ratio: 0.5, maxWidth: 2000 })
 * // Calculation process:
 * // 1. Original physical widths: [1600, 1668, 1920, 2048, 2560, 2880, 3456, 3840]
 * // 2. Scale by ratio=0.5: [800, 834, 960, 1024, 1280, 1440, 1728, 1920]
 * // 3. Round up with roundStep=16: [800, 848, 960, 1024, 1280, 1440, 1728, 1920]
 * // 4. Cap to maxWidth=2000: [800, 848, 960, 1024, 1280, 1440, 1728, 1920]
 * // 5. Force add maxWidth=2000: [800, 848, 960, 1024, 1280, 1440, 1728, 1920, 2000]
 * // => { widths: [800, 848, 960, 1024, 1280, 1440, 1728, 1920, 2000] }
 * ```
 */
export function computeDesktopBreakpoints(opts: BreakpointOptions = {}): BreakpointResult {
  return computeBreakpointsInternal(opts, DESKTOP_PHYSICAL, DESKTOP_DESIGN_VIEWPORT_WIDTH);
}

/**
 * Calculate responsive image breakpoints for Mobile site
 *
 * @remarks
 * Mobile site covers **Mobile** devices
 * - Physical width range: 1080px - 1320px
 * - Total of 3 discrete breakpoints (after rounding)
 * - Default maximum width: 1320px
 *
 * **Function overload logic**:
 * 1. Not passing ratio: Default 100vw, or infer ratio from maxWidth
 * 2. Passing ratio: Calculate breakpoints by specified proportion
 *
 * @param opts - Breakpoint configuration options
 * @returns Breakpoint calculation result (widths array)
 *
 * @throws {Error} When maxWidth < minWidth
 * @throws {Error} When constraints result in no valid breakpoints
 *
 * @example Full-width Mobile Hero
 * ```ts
 * const mobileHero = computeMobileBreakpoints({})
 * // Calculation process:
 * // 1. Original physical widths (MOBILE_PHYSICAL): [1080, 1206, 1320]
 * // 2. Scale by ratio=1.0: [1080, 1206, 1320]
 * // 3. Round up with roundStep=16: [1088, 1216, 1328]
 * // 4. Cap to maxWidth=1320: [1088, 1216, 1320]
 * // => { widths: [1088, 1216, 1320] }
 * ```
 *
 * @example 30% width Mobile card
 * ```ts
 * const mobileCard = computeMobileBreakpoints({ ratio: 0.3 })
 * // Calculation process:
 * // 1. Original physical widths: [1080, 1206, 1320]
 * // 2. Scale by ratio=0.3: [324, 361.8, 396]
 * // 3. Round up with roundStep=16: [336, 368, 400]
 * // 4. Cap to upper=396: [336, 368, 396]
 * // => { widths: [336, 368, 396] }
 * ```
 *
 * @example Fixed-size Mobile avatar
 * ```ts
 * const mobileAvatar = computeMobileBreakpoints({ minWidth: 30, maxWidth: 100, roundStep: 1 })
 * // Calculation process:
 * // 1. Infer ratio = 100 / 1320 ≈ 0.076
 * // 2. Original physical widths: [1080, 1206, 1320]
 * // 3. Scale by ratio=0.076: [82.1, 91.7, 100.3]
 * // 4. Round up with roundStep=1: [83, 92, 101]
 * // 5. Cap to maxWidth=100: [83, 92, 100]
 * // 6. Filter minWidth=30: [83, 92, 100] (all >= 30)
 * // 7. Force add minWidth=30 and maxWidth=100: [30, 83, 92, 100]
 * // => { widths: [30, 83, 92, 100] }
 * ```
 */
export function computeMobileBreakpoints(opts: BreakpointOptions = {}): BreakpointResult {
  return computeBreakpointsInternal(opts, MOBILE_PHYSICAL, MOBILE_DESIGN_VIEWPORT_WIDTH);
}

/**
 * Internal implementation function (unified handling of Desktop and Mobile breakpoint calculation logic)
 *
 * @param opts - Breakpoint configuration options
 * @param physicalList - Device physical width array (Desktop or Mobile)
 * @param defaultDesignViewportWidth - Default design draft viewport width (Desktop: 3840, Mobile: 1320)
 * @returns Breakpoint calculation result
 *
 * @internal
 */
function computeBreakpointsInternal(
  opts: BreakpointOptions,
  physicalList: readonly number[],
  defaultDesignViewportWidth: number
): BreakpointResult {
  const { minWidth, maxWidth, roundStep = 16, designViewportWidth } = opts;

  // Use user-provided designViewportWidth, otherwise use default
  const actualDesignViewportWidth = designViewportWidth ?? defaultDesignViewportWidth;

  // ============================================================
  // Step 1: Parameter validation
  // ============================================================

  // Validation 1: maxWidth >= minWidth
  if (maxWidth !== undefined && minWidth !== undefined && maxWidth < minWidth) {
    throw new Error(
      `[computeBreakpoints] maxWidth (${maxWidth}) must be greater than or equal to minWidth (${minWidth})`
    );
  }

  // Validation 2: maxWidth <= designViewportWidth
  if (maxWidth !== undefined && maxWidth > actualDesignViewportWidth) {
    throw new Error(
      `[computeBreakpoints] maxWidth (${maxWidth}) must not exceed designViewportWidth (${actualDesignViewportWidth}). ` +
        `The image width cannot be larger than the design viewport width.`
    );
  }

  // ============================================================
  // Step 2: Determine ratio and maximum width upper limit
  // ============================================================

  let ratio: number;
  let upper: number;

  if ("ratio" in opts && typeof opts.ratio === "number") {
    // Scenario 1: ratio parameter passed
    ratio = opts.ratio;

    // Maximum width: prioritize using maxWidth, otherwise calculate by ratio, but not exceeding actualDesignViewportWidth
    if (maxWidth !== undefined) {
      upper = maxWidth;
    } else {
      upper = Math.min(actualDesignViewportWidth * ratio, actualDesignViewportWidth);
    }
  } else if (maxWidth !== undefined) {
    // Scenario 2: ratio not passed, but maxWidth passed → infer ratio from actualDesignViewportWidth
    // Note: At this point maxWidth has passed Step 1 validation, ensuring maxWidth <= actualDesignViewportWidth

    ratio = maxWidth / actualDesignViewportWidth;
    upper = maxWidth;
  } else {
    // Scenario 3: Neither passed → default 100% width
    ratio = 1.0;
    upper = actualDesignViewportWidth;
  }

  // Important: Ensure upper is an integer (round down, avoid decimals in breakpoint array)
  // For example: when ratio=0.01, 3840 × 0.01 = 38.4, should round down to 38
  // This is a critical bug fix ensuring all breakpoints are integer pixel values
  upper = Math.floor(upper);

  // ============================================================
  // Step 3: Calculate target physical widths (scale by ratio)
  // ============================================================

  const targetPhysical = physicalList.map((w) => w * ratio);

  // ============================================================
  // Step 4: Apply constraints, rounding, deduplication
  // ============================================================

  const uniq = new Set<number>();

  for (const w of targetPhysical) {
    // 4.1 Round up to multiple of roundStep
    const rounded = Math.max(1, ceilToStep(w, roundStep));

    // 4.2 Cap to maximum width
    // Important: Ensure breakpoint doesn't exceed user-specified maximum width (because rounding might exceed upper)
    const final = Math.min(rounded, upper);

    // 4.3 Apply minimum width constraint (filter after rounding, ensuring rounded value >= minWidth)
    if (minWidth !== undefined && final < minWidth) {
      continue; // Skip this breakpoint
    }

    // 4.4 Deduplicate (Set automatically deduplicates)
    uniq.add(final);
  }

  // ============================================================
  // Step 5: Force include user-specified key breakpoints
  // ============================================================

  // If user explicitly specified minWidth, add it to result as a key breakpoint
  // Reason: User-specified minimum width is usually an important size in their business scenario
  // Note: Set automatically deduplicates, won't duplicate even if minWidth already exists
  if (minWidth !== undefined) {
    uniq.add(minWidth);
  }

  // If user explicitly specified maxWidth, add it to result as a key breakpoint
  // Reason: User-specified maximum width is usually an important size in their business scenario
  // Note: Set automatically deduplicates, won't duplicate even if maxWidth already exists
  if (maxWidth !== undefined) {
    uniq.add(maxWidth);
  }

  // ============================================================
  // Step 6: Sort and convert to array
  // ============================================================

  const final = Array.from(uniq).sort((a, b) => a - b);

  // ============================================================
  // Step 7: Error checking (no valid breakpoints after constraints)
  // ============================================================

  if (final.length === 0) {
    throw new Error(
      `[computeBreakpoints] No valid breakpoints generated with current constraints. Please check parameters:\n` +
        `  - ratio: ${"ratio" in opts ? opts.ratio : "not provided (default 1.0)"}\n` +
        `  - maxWidth: ${maxWidth ?? defaultDesignViewportWidth} (${maxWidth === undefined ? "default" : "provided"})\n` +
        `  - minWidth: ${minWidth ?? "none"} (${minWidth === undefined ? "default" : "provided"})\n` +
        `  - roundStep: ${roundStep}\n` +
        `Hint: minWidth may be too large, or maxWidth may be too small`
    );
  }

  // ============================================================
  // Step 8: Return result
  // ============================================================

  return { widths: final };
}
````

---

**Usage examples**:

```ts
// ============================================================
// Desktop site examples
// ============================================================

// Example 1: Full-width Hero Banner (max 3840px)
const heroDesktop = computeDesktopBreakpoints({});
// => { widths: [1600, 1680, 1920, 2048, 2560, 2880, 3456, 3840] }

// Example 2: 30% width card thumbnail
const cardDesktop = computeDesktopBreakpoints({ ratio: 0.3 });
// => { widths: [480, 512, 576, 624, 768, 864, 1040, 1152] }

// Example 3: Maximum width 1500px (automatically infer ratio ≈ 0.39)
const mediumDesktop = computeDesktopBreakpoints({ maxWidth: 1500 });
// Internal calculation: ratio = 1500 / 3840 ≈ 0.391
// => { widths: [640, 656, 752, 816, 1008, 1136, 1360, 1500] }

// Example 4: 50% width sidebar image, max 2000px
const sidebarDesktop = computeDesktopBreakpoints({
  ratio: 0.5,
  maxWidth: 2000,
});
// => { widths: [800, 848, 960, 1024, 1280, 1440, 1728, 1920, 2000] }
// Note: 2000 as user-specified maxWidth, will definitely appear in result

// Example 5: Responsive product thumbnail (explicit ratio + size range)
const productThumb = computeDesktopBreakpoints({
  ratio: 0.25,
  minWidth: 300,
  maxWidth: 800,
});
// => { widths: [300, 400, 432, 480, 512, 640, 720, 800] }
// Note: 300 and 800 as user-specified key breakpoints, will definitely appear in result

// Example 6: Avatar image (30-100px)
const avatarDesktop = computeDesktopBreakpoints({
  minWidth: 30,
  maxWidth: 100,
  roundStep: 1,
});
// Internal calculation: ratio = 100 / 3840 ≈ 0.026
// => { widths: [30, 42, 44, 50, 54, 67, 75, 90, 100] }
// Note: 30 and 100 as user-specified key breakpoints, will definitely appear in result

// Example 7: Custom rounding step
const customStep = computeDesktopBreakpoints({
  ratio: 0.3,
  roundStep: 8,
});
// => { widths: [480, 504, 576, 616, 768, 864, 1040, 1152] }
// Note: 1668 × 0.3 = 500.4 → round up to multiple of 8 = 504

// Example 8: Support 5K displays (iMac 5K, Pro Display XDR @Retina)
const hero5K = computeDesktopBreakpoints({ designViewportWidth: 5120 });
// => { widths: [1600, 1680, 1920, 2048, 2560, 2880, 3456, 3840, 5120] }
// Note: Includes 5120px breakpoint, can provide native resolution images for 5K displays

// Example 9: Support 6K displays (Pro Display XDR Native)
const hero6K = computeDesktopBreakpoints({ designViewportWidth: 6016 });
// => { widths: [1600, 1680, 1920, 2048, 2560, 2880, 3456, 3840, 5120, 6016] }
// Note: Includes complete 10 breakpoints, covering all devices

// Example 10: 5K display + 30% width card
const card5K = computeDesktopBreakpoints({
  ratio: 0.3,
  designViewportWidth: 5120,
});
// => { widths: [480, 512, 576, 624, 768, 864, 1040, 1152, 1536] }
// Note: 5120 × 0.3 = 1536, automatically includes larger breakpoint

// ============================================================
// Mobile site examples
// ============================================================

// Example 11: Full-width Mobile Hero Banner
const heroMobile = computeMobileBreakpoints({});
// => { widths: [1088, 1216, 1320] }
// Note: 1080 → 1088, 1206 → 1216, 1328 capped to 1320

// Example 12: 30% width Mobile card thumbnail
const cardMobile = computeMobileBreakpoints({ ratio: 0.3 });
// => { widths: [336, 368, 396] }
// Calculation process:
// - 1080 × 0.3 = 324 → round up = 336
// - 1206 × 0.3 = 361.8 → round up = 368
// - 1320 × 0.3 = 396 → round up = 400 → cap to 396

// Example 13: Mobile avatar (30-100px)
const avatarMobile = computeMobileBreakpoints({
  minWidth: 30,
  maxWidth: 100,
  roundStep: 1,
});
// Internal calculation: ratio = 100 / 1320 ≈ 0.076
// => { widths: [30, 83, 92, 100] }
// Calculation process:
// - 1080 × 0.076 ≈ 82.1 → round up to 1 = 83
// - 1206 × 0.076 ≈ 91.7 → round up to 1 = 92
// - 1320 × 0.076 ≈ 100.3 → round up to 1 = 101 → cap to 100
// - Force add minWidth=30 (as key breakpoint)
// Note: 30 and 100 as user-specified key breakpoints, will definitely appear in result

// Example 14: Maximum width 800px (automatically infer ratio)
const mediumMobile = computeMobileBreakpoints({ maxWidth: 800 });
// Internal calculation: ratio = 800 / 1320 ≈ 0.606
// => { widths: [656, 736, 800] }

// ============================================================
// Edge cases and error handling
// ============================================================

// Example 15: Error - maxWidth < minWidth
try {
  computeDesktopBreakpoints({ minWidth: 2000, maxWidth: 1000 });
} catch (error) {
  console.error(error.message);
  // => [computeBreakpoints] maxWidth (1000) must be greater than or equal to minWidth (2000)
}

// Example 16: Error - Constraints result in no valid breakpoints
try {
  computeDesktopBreakpoints({ minWidth: 5000, maxWidth: 6000 });
} catch (error) {
  console.error(error.message);
  // => [computeBreakpoints] No valid breakpoints generated with current constraints...
}
```

---

**Comment explanations**:

1. **Device matrix and default behavior**: `DESKTOP_PHYSICAL` contains complete 10 physical width breakpoints (1600-6016), but by default (`designViewportWidth=3840`), breakpoints are capped at 3840, actually using 8 breakpoints. This maintains both default behavior efficiency and allows flexible support for 5K/6K displays through the `designViewportWidth` parameter.

2. **Rounding behavior**: 1668 in `DESKTOP_PHYSICAL` rounds up to 1680 with `roundStep=16`. If you need to preserve the original value, set `roundStep=1`.

3. **Fixed-size scenarios**: For fixed-size images like avatars, logos, it's recommended to:
   - Set `minWidth` and `maxWidth` to the same value (e.g., `{ minWidth: 100, maxWidth: 100 }`)
   - Use `roundStep=1` to avoid rounding deviation
   - Or directly pass `maxWidth` to let the function automatically infer `ratio`

4. **sizes attribute explanation**: The `sizes` attribute describes the **CSS display width** of the image and should be specified by developers based on actual CSS layout. The utility function only generates physical pixel breakpoints (`widths`), not automatically generating `sizes`. Developers need to specify manually based on responsive layout requirements, for example:
   - Full-width image: `sizes="100vw"`
   - Fixed proportion: `sizes="30vw"`
   - Complex responsive: `sizes="(min-width: 1024px) 50vw, 100vw"`

5. **Recommended parameter combinations**:
   - **Full-width image**: `{}` (default)
   - **Proportional image**: `{ ratio: 0.3 }` or `{ ratio: 0.5 }`
   - **Auto-infer**: `{ maxWidth: 1500 }` (let function infer ratio)
   - **Fixed size**: `{ minWidth: 100, maxWidth: 100, roundStep: 1 }`
   - **Large image filter**: `{ minWidth: 800 }` (filter out small breakpoints)
   - **5K/6K displays**: `{ designViewportWidth: 5120 }` or `{ designViewportWidth: 6016 }`

---

## 5. Solution Implementation (Code and Output) — Dual Sites × Three Scenarios

> The following demonstrates the complete implementation method through three typical scenarios. All examples provide complete `srcset`, file names are illustrative only (actual build will have hash). Heights use **16:9** as an example (2160 for 3840, 648 for 1152, etc.), adjust according to actual design draft ratio in your project.

### 5.1 Desktop Site (Covering Tablet + Laptop + Desktop)

#### Demonstration Scenario 1: 100% Viewport Width (like Hero Banner)

**Design delivery**:

- **Original image size**: 16:9 → **3840×2160 JPEG (sRGB, quality 90–95)**
- **Non-16:9**: Width 3840, height by ratio

**Breakpoint calculation**:

```ts
const { widths } = computeDesktopBreakpoints({});
// Calculation process:
// 1. Original physical widths: [1600, 1668, 1920, 2048, 2560, 2880, 3456, 3840]
// 2. Round with roundStep=16: [1600, 1680, 1920, 2048, 2560, 2880, 3456, 3840]
// widths: [1600, 1680, 1920, 2048, 2560, 2880, 3456, 3840]
```

**sizes attribute explanation**:

- The `sizes` attribute describes the **CSS display width** of the image, should be specified by developers based on actual layout
- For full-width images, use `sizes="100vw"`

**Astro Component - `<Picture>`**:

```astro
---
import { Picture } from "astro:assets";
import hero from "../assets/hero-desktop.jpg";
const WIDTHS = [1600, 1680, 1920, 2048, 2560, 2880, 3456, 3840];
---

<Picture src={hero} alt="Hero banner" widths={WIDTHS} formats={["avif", "webp", "jpeg"]} sizes="100vw" />
```

**Generated HTML**:

```html
<picture>
  <source
    type="image/avif"
    srcset="
      /img/hero-1600.avif 1600w,
      /img/hero-1680.avif 1680w,
      /img/hero-1920.avif 1920w,
      /img/hero-2048.avif 2048w,
      /img/hero-2560.avif 2560w,
      /img/hero-2880.avif 2880w,
      /img/hero-3456.avif 3456w,
      /img/hero-3840.avif 3840w
    "
    sizes="100vw"
  />
  <source
    type="image/webp"
    srcset="
      /img/hero-1600.webp 1600w,
      /img/hero-1680.webp 1680w,
      /img/hero-1920.webp 1920w,
      /img/hero-2048.webp 2048w,
      /img/hero-2560.webp 2560w,
      /img/hero-2880.webp 2880w,
      /img/hero-3456.webp 3456w,
      /img/hero-3840.webp 3840w
    "
    sizes="100vw"
  />
  <img
    src="/img/hero-1920.jpeg"
    srcset="
      /img/hero-1600.jpeg 1600w,
      /img/hero-1680.jpeg 1680w,
      /img/hero-1920.jpeg 1920w,
      /img/hero-2048.jpeg 2048w,
      /img/hero-2560.jpeg 2560w,
      /img/hero-2880.jpeg 2880w,
      /img/hero-3456.jpeg 3456w,
      /img/hero-3840.jpeg 3840w
    "
    sizes="100vw"
    width="3840"
    height="2160"
    alt="Hero banner"
    loading="lazy"
    decoding="async"
  />
</picture>
```

**Astro Component - `<Image>`**:

```astro
---
import { Image } from "astro:assets";
import hero from "../assets/hero-desktop.jpg";
const WIDTHS = [1600, 1680, 1920, 2048, 2560, 2880, 3456, 3840];
---

<Image src={hero} alt="Hero banner" format="webp" widths={WIDTHS} sizes="100vw" />
```

**Generated HTML**:

```html
<img
  src="/img/hero-1920.webp"
  srcset="
    /img/hero-1600.webp 1600w,
    /img/hero-1680.webp 1680w,
    /img/hero-1920.webp 1920w,
    /img/hero-2048.webp 2048w,
    /img/hero-2560.webp 2560w,
    /img/hero-2880.webp 2880w,
    /img/hero-3456.webp 3456w,
    /img/hero-3840.webp 3840w
  "
  sizes="100vw"
  width="3840"
  height="2160"
  alt="Hero banner"
  loading="lazy"
  decoding="async"
/>
```

**Device Mapping Table (Desktop Site - 100% Width)**:

| Device Category    | Device ID           | Physical Width | CSS Width | Browser Selection (Picture/AVIF) | Browser Selection (Image/WebP) |
| ------------------ | ------------------- | -------------: | --------: | -------------------------------- | ------------------------------ |
| Tablet S           | `tablet-small`      |           1600 |       533 | `hero-1600.avif`                 | `hero-1600.webp`               |
| Tablet M           | `tablet-medium`     |           1668 |       834 | `hero-1680.avif`                 | `hero-1680.webp`               |
| Tablet L           | `tablet-large`      |           2048 |      1024 | `hero-2048.avif`                 | `hero-2048.webp`               |
| Laptop S           | `laptop-small`      |           1920 | 1280-1920 | `hero-1920.avif`                 | `hero-1920.webp`               |
| Laptop M           | `laptop-medium`     |           2560 | 1280-1664 | `hero-2560.avif`                 | `hero-2560.webp`               |
| Laptop L           | `laptop-large`      |           2880 | 1440-1512 | `hero-2880.avif`                 | `hero-2880.webp`               |
| Laptop XL          | `laptop-xlarge`     |           3456 |      1728 | `hero-3456.avif`                 | `hero-3456.webp`               |
| Desktop 2K         | `desktop-2k`        |           2560 |      2560 | `hero-2560.avif`                 | `hero-2560.webp`               |
| Desktop 4K         | `desktop-4k`        |           3840 |      3840 | `hero-3840.avif`                 | `hero-3840.webp`               |
| Desktop 4K @1.5x   | `desktop-4k-1.5x`   |           3840 |      2560 | `hero-3840.avif`                 | `hero-3840.webp`               |
| Desktop 4K @Retina | `desktop-4k-retina` |      5120→3840 |      2560 | `hero-3840.avif`                 | `hero-3840.webp`               |
| Desktop 6K         | `desktop-6k`        |      6016→3840 |      6016 | `hero-3840.avif`                 | `hero-3840.webp`               |

**Note**:

- Browser selects the candidate closest to and not smaller than required width from `srcset` based on `sizes="100vw"` and current viewport width
- In this demonstration scenario, the image is full-width (3840px) in the 3840 design draft, so maximum export is 3840 width image
- Desktop 4K @Retina and Desktop 6K although have larger physical widths (5120/6016), but since design draft baseline is 3840, they select 3840.avif
- Tablet M (1668px) will select 1680.avif (rounded-up result)

---

#### Demonstration Scenario 2: 30% Viewport Width (like Card Thumbnail)

**Design delivery**:

- **Original image size**: 16:9 → **1152×648 JPEG (sRGB, quality 90–95)**
- **Non-16:9**: Width 1152, height by ratio

**Breakpoint calculation**:

```ts
const { widths } = computeDesktopBreakpoints({ ratio: 0.3 });
// Calculation process:
// 1. Original physical widths: [1600, 1668, 1920, 2048, 2560, 2880, 3456, 3840]
// 2. Scale by ratio=0.3: [480, 500.4, 576, 614.4, 768, 864, 1036.8, 1152]
// 3. Round with roundStep=16: [480, 512, 576, 624, 768, 864, 1040, 1152]
// widths: [480, 512, 576, 624, 768, 864, 1040, 1152]
```

**sizes attribute explanation**:

- For images occupying 30% viewport width, use `sizes="30vw"`

**Astro Component - `<Picture>`**:

```astro
---
import { Picture } from "astro:assets";
import card from "../assets/card-desktop.jpg";
const WIDTHS = [480, 512, 576, 624, 768, 864, 1040, 1152];
---

<Picture src={card} alt="Card thumbnail" widths={WIDTHS} formats={["avif", "webp", "jpeg"]} sizes="30vw" />
```

**Generated HTML**:

```html
<picture>
  <source
    type="image/avif"
    srcset="
      /img/card-480.avif   480w,
      /img/card-512.avif   512w,
      /img/card-576.avif   576w,
      /img/card-624.avif   624w,
      /img/card-768.avif   768w,
      /img/card-864.avif   864w,
      /img/card-1040.avif 1040w,
      /img/card-1152.avif 1152w
    "
    sizes="30vw"
  />
  <source
    type="image/webp"
    srcset="
      /img/card-480.webp   480w,
      /img/card-512.webp   512w,
      /img/card-576.webp   576w,
      /img/card-624.webp   624w,
      /img/card-768.webp   768w,
      /img/card-864.webp   864w,
      /img/card-1040.webp 1040w,
      /img/card-1152.webp 1152w
    "
    sizes="30vw"
  />
  <img
    src="/img/card-576.jpeg"
    srcset="
      /img/card-480.jpeg   480w,
      /img/card-512.jpeg   512w,
      /img/card-576.jpeg   576w,
      /img/card-624.jpeg   624w,
      /img/card-768.jpeg   768w,
      /img/card-864.jpeg   864w,
      /img/card-1040.jpeg 1040w,
      /img/card-1152.jpeg 1152w
    "
    sizes="30vw"
    width="1152"
    height="648"
    alt="Card thumbnail"
    loading="lazy"
    decoding="async"
  />
</picture>
```

**Astro Component - `<Image>`**:

```astro
---
import { Image } from "astro:assets";
import card from "../assets/card-desktop.jpg";
const WIDTHS = [480, 512, 576, 624, 768, 864, 1040, 1152];
---

<Image src={card} alt="Card thumbnail" format="webp" widths={WIDTHS} sizes="30vw" />
```

**Generated HTML**:

```html
<img
  src="/img/card-576.webp"
  srcset="
    /img/card-480.webp   480w,
    /img/card-512.webp   512w,
    /img/card-576.webp   576w,
    /img/card-624.webp   624w,
    /img/card-768.webp   768w,
    /img/card-864.webp   864w,
    /img/card-1040.webp 1040w,
    /img/card-1152.webp 1152w
  "
  sizes="30vw"
  width="1152"
  height="648"
  alt="Card thumbnail"
  loading="lazy"
  decoding="async"
/>
```

**Device Mapping Table (Desktop Site - 30% Width)**:

| Device Category    | Device ID           | Physical Width | CSS Width | Browser Selection (Picture/AVIF) | Browser Selection (Image/WebP) |
| ------------------ | ------------------- | -------------: | --------: | -------------------------------- | ------------------------------ |
| Tablet S           | `tablet-small`      |           1600 |       533 | `card-480.avif`                  | `card-480.webp`                |
| Tablet M           | `tablet-medium`     |           1668 |       834 | `card-512.avif`                  | `card-512.webp`                |
| Tablet L           | `tablet-large`      |           2048 |      1024 | `card-624.avif`                  | `card-624.webp`                |
| Laptop S           | `laptop-small`      |           1920 | 1280-1920 | `card-576.avif`                  | `card-576.webp`                |
| Laptop M           | `laptop-medium`     |           2560 | 1280-1664 | `card-768.avif`                  | `card-768.webp`                |
| Laptop L           | `laptop-large`      |           2880 | 1440-1512 | `card-864.avif`                  | `card-864.webp`                |
| Laptop XL          | `laptop-xlarge`     |           3456 |      1728 | `card-1040.avif`                 | `card-1040.webp`               |
| Desktop 2K         | `desktop-2k`        |           2560 |      2560 | `card-768.avif`                  | `card-768.webp`                |
| Desktop 4K         | `desktop-4k`        |           3840 |      3840 | `card-1152.avif`                 | `card-1152.webp`               |
| Desktop 4K @1.5x   | `desktop-4k-1.5x`   |           3840 |      2560 | `card-1152.avif`                 | `card-1152.webp`               |
| Desktop 4K @Retina | `desktop-4k-retina` |      5120→3840 |      2560 | `card-1152.avif`                 | `card-1152.webp`               |
| Desktop 6K         | `desktop-6k`        |      6016→3840 |      6016 | `card-1152.avif`                 | `card-1152.webp`               |

**Calculation explanation**:

- Browser calculates actual display width = viewport width × 0.3 based on `sizes="30vw"`
- E.g., Tablet M (CSS 834px): display width = 834 × 0.3 × 2 (DPR) ≈ 500px → selects 512.avif
- E.g., Desktop 4K (CSS 3840px): display width = 3840 × 0.3 × 1 (DPR) = 1152px → selects 1152.avif

---

#### Demonstration Scenario 3: Fixed Size 30–100px (like Avatar/Icon)

**Design delivery**:

- **Original image size**: **100×100 PNG** (or lossless WebP; photography avatars can use JPEG 90–95)

**Breakpoint calculation**:

```ts
const { widths } = computeDesktopBreakpoints({
  minWidth: 30,
  maxWidth: 100,
  roundStep: 1,
});
// Calculation process:
// 1. Infer ratio = 100 / 3840 ≈ 0.026
// 2. Original physical widths: [1600, 1668, 1920, 2048, 2560, 2880, 3456, 3840]
// 3. Scale by ratio=0.026: [41.6, 43.4, 50.0, 53.2, 66.6, 74.9, 89.9, 100.0]
// 4. Round with roundStep=1: [42, 44, 50, 54, 67, 75, 90, 100]
// 5. Force add minWidth=30: [30, 42, 44, 50, 54, 67, 75, 90, 100]
// widths: [30, 42, 44, 50, 54, 67, 75, 90, 100]
```

**sizes attribute explanation**:

- This scenario uses **fixed CSS size** `25px` to demonstrate the core value of responsive optimization
- Even if developers only specify a single fixed CSS size, the component will automatically select the optimal physical resolution image based on different device **DPR**
- This way, without writing complex responsive logic, the component will automatically provide images with different physical resolutions (30/42/50/75, etc.) for devices with DPR=1/1.5/2/3

**Astro Component - `<Picture>`**:

```astro
---
import { Picture } from "astro:assets";
import avatar from "../assets/avatar.png";
const WIDTHS = [30, 42, 44, 50, 54, 67, 75, 90, 100];
---

<Picture src={avatar} alt="User avatar" widths={WIDTHS} formats={["avif", "webp", "png"]} sizes="25px" />
```

**Generated HTML**:

```html
<picture>
  <source
    type="image/avif"
    srcset="
      /img/avatar-30.avif   30w,
      /img/avatar-42.avif   42w,
      /img/avatar-44.avif   44w,
      /img/avatar-50.avif   50w,
      /img/avatar-54.avif   54w,
      /img/avatar-67.avif   67w,
      /img/avatar-75.avif   75w,
      /img/avatar-90.avif   90w,
      /img/avatar-100.avif 100w
    "
    sizes="25px"
  />
  <source
    type="image/webp"
    srcset="
      /img/avatar-30.webp   30w,
      /img/avatar-42.webp   42w,
      /img/avatar-44.webp   44w,
      /img/avatar-50.webp   50w,
      /img/avatar-54.webp   54w,
      /img/avatar-67.webp   67w,
      /img/avatar-75.webp   75w,
      /img/avatar-90.webp   90w,
      /img/avatar-100.webp 100w
    "
    sizes="25px"
  />
  <img
    src="/img/avatar-50.png"
    srcset="
      /img/avatar-30.png   30w,
      /img/avatar-42.png   42w,
      /img/avatar-44.png   44w,
      /img/avatar-50.png   50w,
      /img/avatar-54.png   54w,
      /img/avatar-67.png   67w,
      /img/avatar-75.png   75w,
      /img/avatar-90.png   90w,
      /img/avatar-100.png 100w
    "
    sizes="25px"
    width="100"
    height="100"
    alt="User avatar"
    loading="lazy"
    decoding="async"
  />
</picture>
```

**Astro Component - `<Image>`**:

```astro
---
import { Image } from "astro:assets";
import avatar from "../assets/avatar.png";
const WIDTHS = [30, 42, 44, 50, 54, 67, 75, 90, 100];
---

<Image src={avatar} alt="User avatar" format="webp" widths={WIDTHS} sizes="25px" />
```

**Generated HTML**:

```html
<img
  src="/img/avatar-50.webp"
  srcset="
    /img/avatar-30.webp   30w,
    /img/avatar-42.webp   42w,
    /img/avatar-44.webp   44w,
    /img/avatar-50.webp   50w,
    /img/avatar-54.webp   54w,
    /img/avatar-67.webp   67w,
    /img/avatar-75.webp   75w,
    /img/avatar-90.webp   90w,
    /img/avatar-100.webp 100w
  "
  sizes="25px"
  width="100"
  height="100"
  alt="User avatar"
  loading="lazy"
  decoding="async"
/>
```

**Device Mapping Table (Desktop Site - Square 30–100)**:

| Device Category    | Device ID           | Physical Width | CSS Width | DPR | Required Width (25px × DPR) | Browser Selection (Picture/AVIF) | Browser Selection (Image/WebP) |
| ------------------ | ------------------- | -------------: | --------: | --: | --------------------------- | -------------------------------- | ------------------------------ |
| Tablet S           | `tablet-small`      |           1600 |       533 |   3 | 25×3 = 75                   | `avatar-75.avif`                 | `avatar-75.webp`               |
| Tablet M           | `tablet-medium`     |           1668 |       834 |   2 | 25×2 = 50                   | `avatar-50.avif`                 | `avatar-50.webp`               |
| Tablet L           | `tablet-large`      |           2048 |      1024 |   2 | 25×2 = 50                   | `avatar-50.avif`                 | `avatar-50.webp`               |
| Laptop S           | `laptop-small`      |           1920 | 1280-1920 | 1.5 | 25×1.5 = 37.5               | `avatar-42.avif`                 | `avatar-42.webp`               |
| Laptop M           | `laptop-medium`     |           2560 | 1280-1664 |   2 | 25×2 = 50                   | `avatar-50.avif`                 | `avatar-50.webp`               |
| Laptop L           | `laptop-large`      |           2880 | 1440-1512 |   2 | 25×2 = 50                   | `avatar-50.avif`                 | `avatar-50.webp`               |
| Laptop XL          | `laptop-xlarge`     |           3456 |      1728 |   2 | 25×2 = 50                   | `avatar-50.avif`                 | `avatar-50.webp`               |
| Desktop 2K         | `desktop-2k`        |           2560 |      2560 |   1 | 25×1 = 25                   | `avatar-30.avif`                 | `avatar-30.webp`               |
| Desktop 4K         | `desktop-4k`        |           3840 |      3840 |   1 | 25×1 = 25                   | `avatar-30.avif`                 | `avatar-30.webp`               |
| Desktop 4K @1.5x   | `desktop-4k-1.5x`   |           3840 |      2560 | 1.5 | 25×1.5 = 37.5               | `avatar-42.avif`                 | `avatar-42.webp`               |
| Desktop 4K @Retina | `desktop-4k-retina` |      5120→3840 |      2560 |   2 | 25×2 = 50                   | `avatar-50.avif`                 | `avatar-50.webp`               |
| Desktop 6K         | `desktop-6k`        |      6016→3840 |      6016 |   1 | 25×1 = 25                   | `avatar-30.avif`                 | `avatar-30.webp`               |

**Explanation**:

- Using fixed size `sizes="25px"`, all devices have CSS display size of 25px
- **Value of responsive optimization demonstrated**: Component automatically selects optimal image based on different device DPR:
  - **DPR = 3** (like Tablet S): Needs 75px physical width → selects `avatar-75.avif`
  - **DPR = 2** (like most laptops): Needs 50px physical width → selects `avatar-50.avif`
  - **DPR = 1.5** (like some laptops): Needs 37.5px physical width → selects `avatar-42.avif`
  - **DPR = 1** (like desktop displays): Needs 25px physical width → selects `avatar-30.avif`
- This shows: even if developer only writes a simple fixed size, component can automatically provide optimal image resolution for devices with different DPR

---

### 5.2 Mobile Site (Covering Mobile)

#### Demonstration Scenario 1: 100% Viewport Width (like Hero Banner)

**Design delivery**:

- **Original image size**: 16:9 → **1320×743 JPEG (sRGB, quality 90–95)**
- **Non-16:9**: Width 1320, height by ratio

**Breakpoint calculation**:

```ts
const { widths } = computeMobileBreakpoints({});
// Calculation process:
// 1. Original physical widths: [1080, 1206, 1320]
// 2. Round with roundStep=16: [1088, 1216, 1328]
// 3. Cap to maxWidth=1320: [1088, 1216, 1320]
// widths: [1088, 1216, 1320]
```

**sizes attribute explanation**:

- For full-width images, use `sizes="100vw"`

**Astro Component - `<Picture>`**:

```astro
---
import { Picture } from "astro:assets";
import hero from "../assets/hero-mobile.jpg";
const WIDTHS = [1088, 1216, 1320];
---

<Picture src={hero} alt="Hero banner" widths={WIDTHS} formats={["avif", "webp", "jpeg"]} sizes="100vw" />
```

**Generated HTML**:

```html
<picture>
  <source
    type="image/avif"
    srcset="/img/hero-1088.avif 1088w, /img/hero-1216.avif 1216w, /img/hero-1320.avif 1320w"
    sizes="100vw"
  />
  <source
    type="image/webp"
    srcset="/img/hero-1088.webp 1088w, /img/hero-1216.webp 1216w, /img/hero-1320.webp 1320w"
    sizes="100vw"
  />
  <img
    src="/img/hero-1216.jpeg"
    srcset="/img/hero-1088.jpeg 1088w, /img/hero-1216.jpeg 1216w, /img/hero-1320.jpeg 1320w"
    sizes="100vw"
    width="1320"
    height="743"
    alt="Hero banner"
    loading="lazy"
    decoding="async"
  />
</picture>
```

**Astro Component - `<Image>`**:

```astro
---
import { Image } from "astro:assets";
import hero from "../assets/hero-mobile.jpg";
const WIDTHS = [1088, 1216, 1320];
---

<Image src={hero} alt="Hero banner" format="webp" widths={WIDTHS} sizes="100vw" />
```

**Generated HTML**:

```html
<img
  src="/img/hero-1216.webp"
  srcset="/img/hero-1088.webp 1088w, /img/hero-1216.webp 1216w, /img/hero-1320.webp 1320w"
  sizes="100vw"
  width="1320"
  height="743"
  alt="Hero banner"
  loading="lazy"
  decoding="async"
/>
```

**Device Mapping Table (Mobile Site - 100% Width)**:

| Device Category | Device ID       | Physical Width | CSS Width | DPR | Browser Selection (Picture/AVIF) | Browser Selection (Image/WebP) |
| --------------- | --------------- | -------------: | --------: | --: | -------------------------------- | ------------------------------ |
| Mobile S        | `mobile-small`  |           1080 |       360 |   3 | `hero-1088.avif`                 | `hero-1088.webp`               |
| Mobile M        | `mobile-medium` |           1206 |       402 |   3 | `hero-1216.avif`                 | `hero-1216.webp`               |
| Mobile L        | `mobile-large`  |           1320 |       440 |   3 | `hero-1320.avif`                 | `hero-1320.webp`               |

**Note**:

- Mobile M (1206px) breakpoint rounds up to 1216 with roundStep=16
- Browser will select from srcset based on DPR=3 and CSS width to calculate required physical width

---

#### Demonstration Scenario 2: 30% Viewport Width (like Card Thumbnail)

**Design delivery**:

- **Original image size**: 16:9 → **400×225 JPEG (sRGB, quality 90–95)**
- **Non-16:9**: Width 400, height by ratio

**Breakpoint calculation**:

```ts
const { widths } = computeMobileBreakpoints({ ratio: 0.3 });
// Calculation process:
// 1. Original physical widths: [1080, 1206, 1320]
// 2. Scale by ratio=0.3: [324, 361.8, 396]
// 3. Round with roundStep=16: [336, 368, 400]
// 4. Cap to upper=396: [336, 368, 396]
// widths: [336, 368, 396]
```

**sizes attribute explanation**:

- For images occupying 30% viewport width, use `sizes="30vw"`

**Astro Component - `<Picture>`**:

```astro
---
import { Picture } from "astro:assets";
import card from "../assets/card-mobile.jpg";
const WIDTHS = [336, 368, 396];
---

<Picture src={card} alt="Card thumbnail" widths={WIDTHS} formats={["avif", "webp", "jpeg"]} sizes="30vw" />
```

**Generated HTML**:

```html
<picture>
  <source
    type="image/avif"
    srcset="/img/card-336.avif 336w, /img/card-368.avif 368w, /img/card-396.avif 396w"
    sizes="30vw"
  />
  <source
    type="image/webp"
    srcset="/img/card-336.webp 336w, /img/card-368.webp 368w, /img/card-396.webp 396w"
    sizes="30vw"
  />
  <img
    src="/img/card-368.jpeg"
    srcset="/img/card-336.jpeg 336w, /img/card-368.jpeg 368w, /img/card-396.jpeg 396w"
    sizes="30vw"
    width="396"
    height="223"
    alt="Card thumbnail"
    loading="lazy"
    decoding="async"
  />
</picture>
```

**Astro Component - `<Image>`**:

```astro
---
import { Image } from "astro:assets";
import card from "../assets/card-mobile.jpg";
const WIDTHS = [336, 368, 396];
---

<Image src={card} alt="Card thumbnail" format="webp" widths={WIDTHS} sizes="30vw" />
```

**Generated HTML**:

```html
<img
  src="/img/card-368.webp"
  srcset="/img/card-336.webp 336w, /img/card-368.webp 368w, /img/card-396.webp 396w"
  sizes="30vw"
  width="396"
  height="223"
  alt="Card thumbnail"
  loading="lazy"
  decoding="async"
/>
```

**Device Mapping Table (Mobile Site - 30% Width)**:

| Device Category | Device ID       | Physical Width | CSS Width | DPR | Browser Selection (Picture/AVIF) | Browser Selection (Image/WebP) |
| --------------- | --------------- | -------------: | --------: | --: | -------------------------------- | ------------------------------ |
| Mobile S        | `mobile-small`  |           1080 |       360 |   3 | `card-336.avif`                  | `card-336.webp`                |
| Mobile M        | `mobile-medium` |           1206 |       402 |   3 | `card-368.avif`                  | `card-368.webp`                |
| Mobile L        | `mobile-large`  |           1320 |       440 |   3 | `card-396.avif`                  | `card-396.webp`                |

**Calculation explanation**:

- Mobile S (CSS 360px): display width = 360 × 0.3 × 3 (DPR) = 324px → selects 336.avif
- Mobile M (CSS 402px): display width = 402 × 0.3 × 3 (DPR) ≈ 362px → selects 368.avif
- Mobile L (CSS 440px): display width = 440 × 0.3 × 3 (DPR) = 396px → selects 396.avif

---

#### Demonstration Scenario 3: Fixed Size 30–100px (like Avatar/Icon)

**Design delivery**:

- **Original image size**: **100×100 PNG** (or lossless WebP; photography avatars can use JPEG 90–95)

**Breakpoint calculation**:

```ts
const { widths } = computeMobileBreakpoints({
  minWidth: 30,
  maxWidth: 100,
  roundStep: 1,
});
// Calculation process:
// 1. Infer ratio = 100 / 1320 ≈ 0.076
// 2. Original physical widths: [1080, 1206, 1320]
// 3. Scale by ratio=0.076: [82.1, 91.7, 100.3]
// 4. Round with roundStep=1: [83, 92, 101]
// 5. Cap to maxWidth=100: [83, 92, 100]
// 6. Force add minWidth=30: [30, 83, 92, 100]
// widths: [30, 83, 92, 100]
```

**sizes attribute explanation**:

- This scenario uses **fixed CSS size** `28px` to demonstrate responsive optimization effect
- Even if developers only specify a single fixed CSS size, the component will automatically select the optimal physical resolution image based on different device **DPR**
- But note: Since all Mobile devices have DPR of 3, the difference between different Mobile devices mainly manifests in **differences in original physical width**

**Astro Component - `<Picture>`**:

```astro
---
import { Picture } from "astro:assets";
import avatar from "../assets/avatar.png";
const WIDTHS = [30, 83, 92, 100];
---

<Picture src={avatar} alt="User avatar" widths={WIDTHS} formats={["avif", "webp", "png"]} sizes="28px" />
```

**Generated HTML**:

```html
<picture>
  <source
    type="image/avif"
    srcset="/img/avatar-30.avif 30w, /img/avatar-83.avif 83w, /img/avatar-92.avif 92w, /img/avatar-100.avif 100w"
    sizes="28px"
  />
  <source
    type="image/webp"
    srcset="/img/avatar-30.webp 30w, /img/avatar-83.webp 83w, /img/avatar-92.webp 92w, /img/avatar-100.webp 100w"
    sizes="28px"
  />
  <img
    src="/img/avatar-83.png"
    srcset="/img/avatar-30.png 30w, /img/avatar-83.png 83w, /img/avatar-92.png 92w, /img/avatar-100.png 100w"
    sizes="28px"
    width="100"
    height="100"
    alt="User avatar"
    loading="lazy"
    decoding="async"
  />
</picture>
```

**Astro Component - `<Image>`**:

```astro
---
import { Image } from "astro:assets";
import avatar from "../assets/avatar.png";
const WIDTHS = [30, 83, 92, 100];
---

<Image src={avatar} alt="User avatar" format="webp" widths={WIDTHS} sizes="28px" />
```

**Generated HTML**:

```html
<img
  src="/img/avatar-83.webp"
  srcset="/img/avatar-30.webp 30w, /img/avatar-83.webp 83w, /img/avatar-92.webp 92w, /img/avatar-100.webp 100w"
  sizes="28px"
  width="100"
  height="100"
  alt="User avatar"
  loading="lazy"
  decoding="async"
/>
```

**Device Mapping Table (Mobile Site - Square 30–100)**:

| Device Category | Device ID       | Physical Width | CSS Width | DPR | Required Width (28px × DPR) | Browser Selection (Picture/AVIF) | Browser Selection (Image/WebP) |
| --------------- | --------------- | -------------: | --------: | --: | --------------------------- | -------------------------------- | ------------------------------ |
| Mobile S        | `mobile-small`  |           1080 |       360 |   3 | 28×3 = 84                   | `avatar-92.avif`                 | `avatar-92.webp`               |
| Mobile M        | `mobile-medium` |           1206 |       402 |   3 | 28×3 = 84                   | `avatar-92.avif`                 | `avatar-92.webp`               |
| Mobile L        | `mobile-large`  |           1320 |       440 |   3 | 28×3 = 84                   | `avatar-92.avif`                 | `avatar-92.webp`               |

**Explanation**:

- Using fixed size `sizes="28px"`, all Mobile devices have CSS display size of 28px
- Browser calculates required physical width: 28px × DPR(3) = 84px
- Selects from srcset `[30, 83, 92, 100]`: smallest candidate ≥84 is **92**
- **About Mobile responsive limitations**:
  - Since all Mobile devices have DPR of 3, they need the same physical width in fixed-size scenarios (all 84px)
  - Therefore they all select the same image (`avatar-92`), cannot demonstrate obvious responsive differences like Desktop devices
  - This shows: For Mobile devices, responsive image optimization has more value in **full-width or proportional layout scenarios** (Scenario 1 and 2)

---

## 6. Verification and Troubleshooting (How to Verify)

### 6.1 Browser DevTools Verification

**Network Panel Operation Steps**:

1. Open DevTools → Network panel
2. Filter image resources (Filter: `Img` or `image`)
3. Refresh page, observe loaded image filenames and sizes
4. Check:
   - Whether the width in image filename matches expected `widths` array
   - Whether image format follows `<Picture>` `formats` order fallback (AVIF → WebP → JPEG/PNG)
   - Whether file size is reasonable (too large might have selected wrong candidate)

**Console Verification**:

```js
// Check viewport and DPR information
console.log("Viewport Width (CSS):", window.innerWidth);
console.log("DPR:", window.devicePixelRatio);
console.log("Physical Width:", window.innerWidth * window.devicePixelRatio);

// Check actual image loading
const img = document.querySelector('img[alt="Hero banner"]');
console.log("sizes:", img.sizes);
console.log("currentSrc:", img.currentSrc);
console.log("naturalWidth:", img.naturalWidth);
console.log("displayWidth:", img.width);
```

### 6.2 Common Issue Troubleshooting

| Issue                       | Cause                                                 | Solution                                                                                 |
| --------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Blurry image                | Selected candidate width smaller than actually needed | Check if `sizes` is correct; check if srcset includes large enough candidates            |
| Bandwidth waste             | Selected candidate width too large                    | Check if `sizes` is written too large; check if there are too many large-size candidates |
| Browser doesn't select AVIF | Browser doesn't support AVIF format                   | Use `<Picture>` to provide fallback formats (WebP/JPEG)                                  |
| CLS (layout shift)          | Missing width/height attributes                       | Astro automatically fills, check generated HTML                                          |
| `sizes` not effective       | `sizes` syntax error                                  | Check media query syntax; check for typos                                                |

### 6.3 Device Testing Recommendations

**Priority Test Devices**:

- **Desktop**: Desktop 4K (3840 physical / 3840 CSS, DPR=1)
- **Laptop**: MacBook Pro 16″ (3456 physical / 1728 CSS, DPR=2)
- **Tablet**: iPad Pro 11″ (1668 physical / 834 CSS, DPR=2)
- **Mobile**: iPhone 17 Pro Max (1320 physical / 440 CSS, DPR=3), Galaxy S25 (1080 physical / 360 CSS, DPR=3)

**Testing Steps**:

1. Switch device emulator in DevTools
2. Refresh page, observe images loaded in Network panel
3. Verify if `currentSrc` matches expected candidate width
4. Check if `naturalWidth` matches `w` descriptor in srcset

---

## 7. Q & A

**Q1: What's the difference between responsive image optimization and responsive CSS design?**

A: These are **two different domains** of responsive concepts, but often confused:

| Comparison      | Responsive Image Optimization (This Document) | Responsive CSS Design                     |
| --------------- | --------------------------------------------- | ----------------------------------------- |
| **Goal**        | Optimize image resources, save bandwidth      | Adjust page layout                        |
| **Basis**       | **Physical Width** (physical resolution)      | **CSS Width** (logical resolution)        |
| **Technology**  | `srcset` + `sizes`                            | Media Queries (`@media`)                  |
| **Breakpoints** | Based on physical width (1088, 1216, 1320)    | Based on CSS width (375px, 768px, 1024px) |
| **Example**     | MacBook Air 13″ loads 2560px image            | MacBook Air 13″ uses 1280px layout        |

**Key Understanding**: MacBook Air 13″ (CSS 1280px × DPR 2.0 = 2560px physical)

- **CSS responsive**: Uses `@media (min-width: 1280px)` to determine layout, applies Desktop styles
- **Image responsive**: Browser calculates need for 2560px physical width, selects 2560w image from `srcset`

These two are **complementary**, not substitutes:

- CSS responsive solves "how layout adapts to different screens"
- Image responsive solves "how images are sharp without wasting bandwidth"

**Q2: When to use `<Picture>` vs `<Image>`?**
A: Multiple formats (AVIF + WebP + JPEG → `<Picture>`; single format (only want WebP) → `<Image>`. `<Picture>` provides better browser compatibility but generates more verbose HTML.

**Q3: Why use discrete breakpoints instead of generating images precisely for each device?**
A: (1) **Actual width fluctuates**: Factors like scrollbars, sidebars, non-maximized windows cause actual display width to deviate from device nominal values; (2) **Browser selection algorithm**: Browser automatically selects the most appropriate candidate image (prioritizes selecting candidate "closest to and not smaller than required width", selects largest candidate if all candidates are too small), slight width differences (like 1668 vs 1680) have minimal visual impact; (3) **Engineering efficiency**: Discrete breakpoints can reduce candidate count from dozens to 5-8, significantly reducing build time and storage costs.

**Q4: How does Mobile site cover 1088/1216/1320?**
A: The utility method `MOBILE_PHYSICAL` is defined as original physical widths `[1080, 1206, 1320]`, with roundStep=16 rounds up to engineering breakpoints `[1088, 1216, 1320]` (1080 → 1088, 1206 → 1216, 1320 stays unchanged).

**Q5: How to handle non-16:9 design drafts?**
A: Export deliverables by design ratio, replace heights in examples (like 2160, 648, 743) with actual values. Astro automatically reads image width/height and fills into HTML.

**Q6: Why are Laptop device CSS widths ranges in the device matrix?**
A: Same physical resolution (like 1920×1080) has different CSS widths at different scaling ratios (100%/150%). We classify by physical width, CSS width is for reference only.

**Q7: How to handle art direction (different cropping for different devices)?**
A: Use `<picture>` media query feature:

```astro
<picture>
  <source media="(min-width: 1024px)" srcset="hero-desktop.jpg" />
  <source media="(min-width: 640px)" srcset="hero-tablet.jpg" />
  <img src="hero-mobile.jpg" alt="..." />
</picture>
```

But this solution focuses on multi-size output of the same image, not involving different cropping.

**Q8: For devices with non-integer DPR (like 2.625), how does the browser select images?**
A: The browser doesn't care if DPR is an integer or decimal, only cares about the calculated **physical width**.

**Case: Google Pixel 9** (DPR 2.625, CSS width 412px)

```text
Required physical width = 412 × 2.625 = 1081.5px
```

**Our Mobile breakpoints**: `[1088, 1216, 1320]`

Browser selection process:

1. Calculate need for 1081.5px
2. Filter candidates ≥ 1081.5px: `1088w`, `1216w`, `1320w`
3. Select smallest: **`1088w`** ✅

**If candidates not large enough** (suppose only `[800, 1072]`):

1. Calculate need for 1081.5px
2. Filter candidates ≥ 1081.5px: **none**
3. Fallback to largest: **`1072w`** ⚠️
4. Image will be slightly enlarged (1072 → 1081.5, enlarge about 0.89%), minimal visual impact

**Why our solution covers different DPR**:

- DPR 3.0, CSS 360px → 1080px → selects `1088w` ✅
- DPR 2.625, CSS 412px → 1081.5px → selects `1088w` ✅
- DPR 3.0, CSS 402px → 1206px → selects `1216w` ✅

Key: We classify by **physical width** (1088/1216/1320), naturally adapting to various DPR values.

---

## 8. Version History

### v1.0 (2025-10-16)

- 📝 Initial version
- ✅ Written based on Device Matrix v2025.1
- ✅ Define device matrix (Mobile 3 tiers + Desktop 12 tiers)
- ✅ Implement dual-site divide-and-conquer (Desktop site + Mobile site)
- ✅ Provide three typical scenario examples (full-width, 30% width, fixed size)
- ✅ Provide breakpoint calculation utility methods (`computeDesktopBreakpoints` / `computeMobileBreakpoints`)
- ✅ Complete device mapping tables and browser selection verification
- ✅ Include verification methods and Q&A sections

---

## 9. References

- [Astro Assets (Images)](https://docs.astro.build/en/guides/images/)
- [MDN: Responsive images](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)
- [Device Matrix v2025.1](/notes/device-matrix-2025/)
- [Web.dev: Serve responsive images](https://web.dev/serve-responsive-images/)

---

**Document Maintenance**: This document should be updated synchronously with Device Matrix updates. If discrepancies are found between the device matrix and this document, please refer to the latest Device Matrix version.
