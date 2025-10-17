---
title: 2025 Responsive Device Matrix
description: Comprehensive device classification matrix for responsive image optimization, based on physical rendering resolution
lastUpdated: 2025-10-10
tags: [device-matrix, responsive-images, web-performance, specifications]
---

> **Last Updated**: 2025-10-10
> **Classification Basis**: Physical rendering resolution (CSS Width × DPR)

---

## Mobile Devices

| Category        | ID              | Physical Width (px) | CSS Width (px) | DPR | Representative Devices         |
| --------------- | --------------- | ------------------- | -------------- | --- | ------------------------------ |
| **📱 Mobile S** | `mobile-small`  | 1080                | 360            | 3   | Galaxy S25, Xiaomi 14          |
| **📱 Mobile M** | `mobile-medium` | 1206                | 402            | 3   | iPhone 17, iPhone 17 Pro       |
| **📱 Mobile L** | `mobile-large`  | 1320                | 440            | 3   | iPhone 17 Pro Max, Mate 70 Pro |

---

## Tablet Devices

| Category        | ID              | Physical Width (px) | CSS Width (px) | DPR | Representative Devices     |
| --------------- | --------------- | ------------------- | -------------- | --- | -------------------------- |
| **💻 Tablet S** | `tablet-small`  | 1600                | 533            | 3   | Samsung Tab S9             |
| **💻 Tablet M** | `tablet-medium` | 1668                | 834            | 2   | iPad Pro 11″, iPad Air 11″ |
| **💻 Tablet L** | `tablet-large`  | 2048                | 1024           | 2   | iPad Air 13″               |

---

## Laptop Devices

| Category         | ID              | Physical Width (px) | CSS Width (px) | DPR     | Representative Devices              |
| ---------------- | --------------- | ------------------- | -------------- | ------- | ----------------------------------- |
| **💻 Laptop S**  | `laptop-small`  | 1920                | 1280-1920      | 1.0-1.5 | Dell XPS 13 FHD, Surface Laptop 13″ |
| **💻 Laptop M**  | `laptop-medium` | 2560                | 1280-1664      | 1.5-2.0 | MacBook Air 13″, Surface Laptop 15″ |
| **💻 Laptop L**  | `laptop-large`  | 2880                | 1440-1512      | 2.0     | MacBook Air 15″, MacBook Pro 14″    |
| **💻 Laptop XL** | `laptop-xlarge` | 3456                | 1728           | 2.0     | MacBook Pro 16″, Dell XPS 15 OLED   |

---

## Desktop Devices

| Category                  | ID                  | Physical Width (px) | CSS Width (px) | DPR / Scale | Representative Devices             |
| ------------------------- | ------------------- | ------------------- | -------------- | ----------- | ---------------------------------- |
| **🖥️ Desktop 2K**         | `desktop-2k`        | 2560                | 2560           | 1           | 27″ QHD Display (2560×1440)        |
| **🖥️ Desktop 4K**         | `desktop-4k`        | 3840                | 3840           | 1           | 4K Display Native (UHD 27–32″)     |
| **🖥️ Desktop 4K @1.5x**   | `desktop-4k-1.5x`   | 3840                | 2560           | 1.5         | 4K Display @150% (Windows Default) |
| **🖥️ Desktop 4K @Retina** | `desktop-4k-retina` | 5120                | 2560           | 2           | iMac 5K, Pro Display XDR @Retina   |
| **🖥️ Desktop 6K**         | `desktop-6k`        | 6016                | 6016           | 1           | Pro Display XDR (6K Native)        |

---

## Notes

### Classification Methodology

`Physical Width = CSS Width × DPR`

This matrix is designed for **responsive image optimization**. The primary classification criterion is **physical rendering width** (the actual pixel count browsers need to render), not CSS viewport width.

**Why Physical Width Matters:**

- A MacBook Air 13″ (CSS 1280px × DPR 2.0 = **2560px physical**) requires higher resolution images than a Dell XPS 13 FHD (CSS 1920px × DPR 1.0 = **1920px physical**)
- Two devices with the same CSS width but different DPRs need different image resolutions
- Image srcset selection is based on physical pixels, not CSS pixels

### Device Selection Criteria

**Mobile Devices (1080-1320px physical):**

- **Mobile S (1080px)**: Mainstream compact Android devices
- **Mobile M (1206px)**: Standard iPhone models
- **Mobile L (1320px)**: Large flagship phones

**Tablet Devices (1600-2048px physical):**

- **Tablet S (1600px)**: Android tablets with high DPR (3.0)
- **Tablet M (1668px)**: Standard iPad 11″ series (most common tablet breakpoint)
- **Tablet L (2048px)**: Large tablets (iPad 13″)

**Laptop Devices (1920-3456px physical):**

- **Laptop S (1920px)**: FHD laptops and low-DPI Windows devices
- **Laptop M (2560px)**: MacBook Air 13″ and Surface mid-range
- **Laptop L (2880px)**: MacBook Air 15″ and high-end laptops
- **Laptop XL (3456px)**: MacBook Pro 16″ and premium OLED laptops

**Desktop Devices (2560-6016px physical):**

- Most desktop displays at 1.0 DPR (native resolution)
- 4K displays may use 150% or 200% scaling on Windows
- Apple displays (iMac 5K, Pro Display XDR) use 2.0 DPR Retina rendering

### Important Considerations

1. **Physical Width**: The actual pixel count used for rendering (CSS Width × DPR)
2. **CSS Width**: The logical viewport width used in responsive design and CSS media queries
3. **DPR (Device Pixel Ratio)**: Physical pixels per CSS pixel
4. **Representative Devices**: Not exhaustive; shows typical devices in each category (max 3 per row)
5. **3840px Upper Limit**: For responsive image optimization, we cap at 3840px physical width for most use cases

### Device Variance and Additional Details

**Mobile:**

- Pixel 9: 412px CSS × 2.625 DPR = 1082px physical (slightly lower than baseline)
- Huawei Pura 70: ~419px CSS × 3.0 DPR = ~1257px physical

**Tablet:**

- iPad Air 11″: 820px CSS × 2.0 DPR = 1640px physical (very close to baseline 1668px)
- Samsung Tab S9+: ~584px CSS × 3.0 DPR = ~1752px physical
- Samsung Tab S9 Ultra: ~616px CSS × 3.0 DPR = ~1848px physical
- Huawei MatePad Pro 12.2″: ~613px CSS × 3.0 DPR = ~1840px physical
- Huawei MatePad Pro 13.2″: ~640px CSS × 3.0 DPR = ~1920px physical
- Surface Pro 2025: ~976px CSS × 1.5 DPR = ~1464px physical

**Laptop:**

- Surface Laptop 13.5″: 1504px CSS × 1.5 DPR = 2256px physical
- Surface Laptop 13.8″: 1536px CSS × 1.5 DPR = 2304px physical
- ThinkPad X1 Carbon OLED: 1440px CSS × 2.0 DPR = 2880px physical
- MacBook Pro 14″: 1512px CSS × 2.0 DPR = 3024px physical
- Dell XPS 14 OLED: 1600px CSS × 2.0 DPR = 3200px physical

For precise implementation, test on actual devices or use device-specific breakpoints when necessary.

---

## Quick Reference: Physical Width Ranges

| Device Type | Physical Width Range | Primary Use Case                |
| ----------- | -------------------- | ------------------------------- |
| Mobile      | 1080 - 1320px        | Smartphone-optimized images     |
| Tablet      | 1600 - 2048px        | Tablet-optimized images         |
| Laptop      | 1920 - 3456px        | Laptop/desktop-optimized images |
| Desktop     | 2560 - 6016px        | Large display-optimized images  |

---

## Device Lookup Table

This comprehensive table allows you to quickly find specific device specifications and their category classification. Devices are grouped by brand for easy reference.

### Apple - iPhone

| Device Name       | Brand | Physical Resolution | DPR | CSS Width | Device Category ID |
| ----------------- | ----- | ------------------- | --- | --------- | ------------------ |
| iPhone 15         | Apple | 1179 × 2556         | 3.0 | 393       | `mobile-medium`    |
| iPhone 15 Plus    | Apple | 1290 × 2796         | 3.0 | 430       | `mobile-large`     |
| iPhone 15 Pro     | Apple | 1179 × 2556         | 3.0 | 393       | `mobile-medium`    |
| iPhone 15 Pro Max | Apple | 1290 × 2796         | 3.0 | 430       | `mobile-large`     |
| iPhone 16         | Apple | 1179 × 2556         | 3.0 | 393       | `mobile-medium`    |
| iPhone 16 Plus    | Apple | 1290 × 2796         | 3.0 | 430       | `mobile-large`     |
| iPhone 16 Pro     | Apple | 1206 × 2622         | 3.0 | 402       | `mobile-medium`    |
| iPhone 16 Pro Max | Apple | 1320 × 2868         | 3.0 | 440       | `mobile-large`     |
| iPhone 17         | Apple | 1206 × 2622         | 3.0 | 402       | `mobile-medium`    |
| iPhone 17 Pro     | Apple | 1206 × 2622         | 3.0 | 402       | `mobile-medium`    |
| iPhone 17 Pro Max | Apple | 1320 × 2868         | 3.0 | 440       | `mobile-large`     |

### Apple - iPad

| Device Name             | Brand | Physical Resolution | DPR | CSS Width | Device Category ID |
| ----------------------- | ----- | ------------------- | --- | --------- | ------------------ |
| iPad Air 11″ (M2, 2024) | Apple | 1640 × 2360         | 2.0 | 820       | `tablet-medium`    |
| iPad Air 11″ (M3, 2025) | Apple | 1640 × 2360         | 2.0 | 820       | `tablet-medium`    |
| iPad Air 13″ (M2, 2024) | Apple | 2048 × 2732         | 2.0 | 1024      | `tablet-large`     |
| iPad Air 13″ (M3, 2025) | Apple | 2048 × 2732         | 2.0 | 1024      | `tablet-large`     |
| iPad Pro 11″ (M2, 2022) | Apple | 1668 × 2388         | 2.0 | 834       | `tablet-medium`    |
| iPad Pro 11″ (M4, 2024) | Apple | 1668 × 2420         | 2.0 | 834       | `tablet-medium`    |
| iPad Pro 13″ (M4, 2024) | Apple | 2064 × 2752         | 2.0 | 1032      | `tablet-large`     |

### Apple - MacBook

| Device Name                | Brand | Physical Resolution | DPR | CSS Width | Device Category ID |
| -------------------------- | ----- | ------------------- | --- | --------- | ------------------ |
| MacBook Air 13″ (M2, 2022) | Apple | 2560 × 1664         | 2.0 | 1280      | `laptop-medium`    |
| MacBook Air 13″ (M3, 2024) | Apple | 2560 × 1664         | 2.0 | 1280      | `laptop-medium`    |
| MacBook Air 13″ (M4, 2025) | Apple | 2560 × 1664         | 2.0 | 1280      | `laptop-medium`    |
| MacBook Air 15″ (M2, 2023) | Apple | 2880 × 1864         | 2.0 | 1440      | `laptop-large`     |
| MacBook Air 15″ (M3, 2024) | Apple | 2880 × 1864         | 2.0 | 1440      | `laptop-large`     |
| MacBook Air 15″ (M4, 2025) | Apple | 2880 × 1864         | 2.0 | 1440      | `laptop-large`     |
| MacBook Pro 14″ (M2, 2023) | Apple | 3024 × 1964         | 2.0 | 1512      | `laptop-large`     |
| MacBook Pro 14″ (M3, 2023) | Apple | 3024 × 1964         | 2.0 | 1512      | `laptop-large`     |
| MacBook Pro 14″ (M4, 2024) | Apple | 3024 × 1964         | 2.0 | 1512      | `laptop-large`     |
| MacBook Pro 16″ (M2, 2023) | Apple | 3456 × 2234         | 2.0 | 1728      | `laptop-xlarge`    |
| MacBook Pro 16″ (M3, 2023) | Apple | 3456 × 2234         | 2.0 | 1728      | `laptop-xlarge`    |
| MacBook Pro 16″ (M4, 2024) | Apple | 3456 × 2234         | 2.0 | 1728      | `laptop-xlarge`    |

### Apple - Desktop

| Device Name          | Brand | Physical Resolution | DPR | CSS Width | Device Category ID  |
| -------------------- | ----- | ------------------- | --- | --------- | ------------------- |
| iMac 24″ (M4, 2024)  | Apple | 4480 × 2520         | 2.0 | 2240      | `desktop-4k-retina` |
| Pro Display XDR (6K) | Apple | 6016 × 3384         | 1.0 | 6016      | `desktop-6k`        |

### Samsung - Mobile

| Device Name      | Brand   | Physical Resolution | DPR    | CSS Width | Device Category ID |
| ---------------- | ------- | ------------------- | ------ | --------- | ------------------ |
| Galaxy S23       | Samsung | 1080 × 2340         | 3.0    | 360       | `mobile-small`     |
| Galaxy S23+      | Samsung | 1080 × 2340         | 2.8125 | 384       | `mobile-medium`    |
| Galaxy S23 Ultra | Samsung | 1440 × 3088         | 3.75   | 384       | `mobile-medium`    |
| Galaxy S24       | Samsung | 1080 × 2340         | 3.0    | 360       | `mobile-small`     |
| Galaxy S24+      | Samsung | 1440 × 3120         | 3.75   | 384       | `mobile-medium`    |
| Galaxy S24 Ultra | Samsung | 1440 × 3120         | 3.75   | 384       | `mobile-medium`    |
| Galaxy S25       | Samsung | 1080 × 2340         | 3.0    | 360       | `mobile-small`     |
| Galaxy S25+      | Samsung | 1440 × 3120         | 3.75   | 384       | `mobile-medium`    |
| Galaxy S25 Ultra | Samsung | 1440 × 3120         | 3.75   | 384       | `mobile-medium`    |

### Samsung - Tablet

| Device Name         | Brand   | Physical Resolution | DPR | CSS Width | Device Category ID |
| ------------------- | ------- | ------------------- | --- | --------- | ------------------ |
| Galaxy Tab S9       | Samsung | 1600 × 2560         | 3.0 | 533       | `tablet-small`     |
| Galaxy Tab S9+      | Samsung | 1752 × 2800         | 3.0 | 584       | `tablet-small`     |
| Galaxy Tab S9 Ultra | Samsung | 1848 × 2960         | 3.0 | 616       | `tablet-small`     |

### Samsung - Monitor

| Device Name         | Brand   | Physical Resolution | DPR | CSS Width | Device Category ID |
| ------------------- | ------- | ------------------- | --- | --------- | ------------------ |
| Odyssey OLED G8 27″ | Samsung | 3840 × 2160         | 1.0 | 3840      | `desktop-4k`       |
| Odyssey OLED G8 32″ | Samsung | 3840 × 2160         | 1.0 | 3840      | `desktop-4k`       |
| ViewFinity S70A 27″ | Samsung | 3840 × 2160         | 1.0 | 3840      | `desktop-4k`       |

### Google - Pixel

| Device Name    | Brand  | Physical Resolution | DPR   | CSS Width | Device Category ID |
| -------------- | ------ | ------------------- | ----- | --------- | ------------------ |
| Pixel 8        | Google | 1080 × 2400         | 2.625 | 412       | `mobile-medium`    |
| Pixel 8 Pro    | Google | 1344 × 2992         | 3.0   | 448       | `mobile-large`     |
| Pixel 9        | Google | 1080 × 2424         | 2.625 | 412       | `mobile-medium`    |
| Pixel 9 Pro    | Google | 1280 × 2856         | 2.625 | 487       | `mobile-large`     |
| Pixel 9 Pro XL | Google | 1344 × 2992         | 3.0   | 448       | `mobile-large`     |
| Pixel 10       | Google | 1080 × 2424         | 2.625 | 412       | `mobile-medium`    |
| Pixel 10 Pro   | Google | 1280 × 2856         | 2.625 | 487       | `mobile-large`     |

### Huawei - Mobile & Tablet

| Device Name       | Brand  | Physical Resolution | DPR | CSS Width | Device Category ID |
| ----------------- | ------ | ------------------- | --- | --------- | ------------------ |
| Mate 60 Pro       | Huawei | 1260 × 2720         | 3.0 | 420       | `mobile-medium`    |
| Pura 70           | Huawei | 1256 × 2760         | 3.0 | 419       | `mobile-medium`    |
| Pura 70 Pro       | Huawei | 1260 × 2844         | 3.0 | 420       | `mobile-medium`    |
| Pura 70 Ultra     | Huawei | 1260 × 2844         | 3.0 | 420       | `mobile-medium`    |
| Mate 70           | Huawei | 1216 × 2688         | 3.0 | 405       | `mobile-medium`    |
| Mate 70 Pro       | Huawei | 1316 × 2832         | 3.0 | 439       | `mobile-large`     |
| Mate 70 Pro+      | Huawei | 1316 × 2832         | 3.0 | 439       | `mobile-large`     |
| MatePad Pro 12.2″ | Huawei | 1840 × 2800         | 3.0 | 613       | `tablet-small`     |
| MatePad Pro 13.2″ | Huawei | 1920 × 2880         | 3.0 | 640       | `tablet-small`     |

### Xiaomi - Mobile

| Device Name | Brand  | Physical Resolution | DPR | CSS Width | Device Category ID |
| ----------- | ------ | ------------------- | --- | --------- | ------------------ |
| Xiaomi 13   | Xiaomi | 1080 × 2400         | 3.0 | 360       | `mobile-small`     |
| Xiaomi 14   | Xiaomi | 1200 × 2670         | 3.0 | 400       | `mobile-medium`    |
| Xiaomi 15   | Xiaomi | 1200 × 2670         | 3.0 | 400       | `mobile-medium`    |

### Microsoft - Surface

| Device Name                    | Brand     | Physical Resolution | DPR | CSS Width | Device Category ID |
| ------------------------------ | --------- | ------------------- | --- | --------- | ------------------ |
| Surface Pro 9 (2022, 12.3″)    | Microsoft | 2880 × 1920         | 2.0 | 1440      | `tablet-large`     |
| Surface Pro 10 (2024, 13″)     | Microsoft | 2880 × 1920         | 2.0 | 1440      | `tablet-large`     |
| Surface Pro (2025, 12″)        | Microsoft | 2196 × 1464         | 1.5 | 1464      | `tablet-medium`    |
| Surface Laptop 13″ (2025)      | Microsoft | 1920 × 1280         | 1.5 | 1280      | `laptop-small`     |
| Surface Laptop 13.5″ (3, 2021) | Microsoft | 2256 × 1504         | 1.5 | 1504      | `laptop-medium`    |
| Surface Laptop 13.5″ (4, 2021) | Microsoft | 2256 × 1504         | 1.5 | 1504      | `laptop-medium`    |
| Surface Laptop 13.5″ (5, 2022) | Microsoft | 2256 × 1504         | 1.5 | 1504      | `laptop-medium`    |
| Surface Laptop 13.5″ (6, 2024) | Microsoft | 2256 × 1504         | 1.5 | 1504      | `laptop-medium`    |
| Surface Laptop 13.8″ (7, 2024) | Microsoft | 2304 × 1536         | 1.5 | 1536      | `laptop-medium`    |
| Surface Laptop 15″ (3, 2021)   | Microsoft | 2496 × 1664         | 1.5 | 1664      | `laptop-medium`    |
| Surface Laptop 15″ (4, 2021)   | Microsoft | 2496 × 1664         | 1.5 | 1664      | `laptop-medium`    |
| Surface Laptop 15″ (5, 2022)   | Microsoft | 2496 × 1664         | 1.5 | 1664      | `laptop-medium`    |
| Surface Laptop 15″ (7, 2024)   | Microsoft | 2496 × 1664         | 1.5 | 1664      | `laptop-medium`    |
| Surface Studio 2+ (28″)        | Microsoft | 4500 × 3000         | 1.5 | 3000      | `desktop-4k-1.5x`  |

### Dell - XPS

| Device Name | Brand | Physical Resolution | DPR | CSS Width | Device Category ID |
| ----------- | ----- | ------------------- | --- | --------- | ------------------ |
| XPS 13 FHD+ | Dell  | 1920 × 1200         | 1.0 | 1920      | `laptop-small`     |
| XPS 14 FHD+ | Dell  | 1920 × 1200         | 1.0 | 1920      | `laptop-small`     |
| XPS 14 OLED | Dell  | 3200 × 2000         | 2.0 | 1600      | `laptop-xlarge`    |
| XPS 15 FHD+ | Dell  | 1920 × 1200         | 1.0 | 1920      | `laptop-small`     |
| XPS 15 OLED | Dell  | 3456 × 2160         | 2.0 | 1728      | `laptop-xlarge`    |

### Lenovo - ThinkPad

| Device Name                       | Brand  | Physical Resolution | DPR | CSS Width | Device Category ID |
| --------------------------------- | ------ | ------------------- | --- | --------- | ------------------ |
| ThinkPad X1 Carbon Gen 12/13 OLED | Lenovo | 2880 × 1800         | 2.0 | 1440      | `laptop-large`     |
| ThinkPad T14 FHD                  | Lenovo | 1920 × 1080         | 1.0 | 1920      | `laptop-small`     |

---

## Version History

**v2025.1 (2025-10-10)** - Initial Release

**Core Methodology:**

- Classification based on **physical rendering width** (CSS Width × DPR), not CSS viewport width
- Designed specifically for responsive image optimization
- Physical width determines actual pixel requirements for image assets

**Device Categories:**

- **Mobile Devices**: S/M/L (1080-1320px physical width)
- **Tablet Devices**: S/M/L (1600-2048px physical width)
- **Laptop Devices**: S/M/L/XL (1920-3456px physical width)
- **Desktop Devices**: 2K/4K/4K@1.5x/4K@Retina/6K (2560-6016px physical width)

**Device Coverage (80+ devices across 8 brands):**

- Apple iPhone: 15/16/17 series (11 models)
- Apple iPad: M2/M3/M4 generations (7 models)
- Apple MacBook: M2/M3/M4 generations (12 models)
- Apple Desktop: iMac, Pro Display XDR (2 models)
- Samsung: Galaxy S23/S24/S25, Tablets, Monitors (12 models)
- Google Pixel: 8/9/10 series (7 models)
- Huawei: Mate 60/70, Pura 70, MatePad Pro (9 models)
- Xiaomi: 13/14/15 series (3 models)
- Microsoft Surface: Pro 9/10, Laptop 3-7 (14 models)
- Dell XPS: 13/14/15 FHD/OLED (5 models)
- Lenovo ThinkPad: X1 Carbon, T14 (2 models)

**Key Features:**

- Device matrices sorted by physical width (ascending)
- Physical Width column prioritized in all tables
- Comprehensive Device Lookup Table organized by brand
- Detailed device variance documentation
- Quick Reference table for physical width ranges
- All device specifications verified through web research

**Desktop Category Design:**

- `desktop-2k` (2560px): QHD displays
- `desktop-4k` (3840px): Native 4K displays
- `desktop-4k-1.5x` (3840px): 4K @150% scaling (Windows default)
- `desktop-4k-retina` (5120px): 5K Retina displays (iMac 5K)
- `desktop-6k` (6016px): 6K displays (Pro Display XDR)
