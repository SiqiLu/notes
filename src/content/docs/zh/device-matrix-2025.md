---
title: 2025 响应式设备矩阵
description: 基于物理渲染分辨率的响应式图片优化设备分类矩阵
lastUpdated: 2025-10-10
tags: [device-matrix, responsive-images, web-performance, specifications]
---

> **最后更新**: 2025-10-10
> **分类依据**: 物理渲染分辨率 (CSS Width × DPR)

---

## 移动设备

| 类别            | ID              | Physical Width (px) | CSS Width (px) | DPR | 代表设备                       |
| --------------- | --------------- | ------------------- | -------------- | --- | ------------------------------ |
| **📱 Mobile S** | `mobile-small`  | 1080                | 360            | 3   | Galaxy S25, Xiaomi 14          |
| **📱 Mobile M** | `mobile-medium` | 1206                | 402            | 3   | iPhone 17, iPhone 17 Pro       |
| **📱 Mobile L** | `mobile-large`  | 1320                | 440            | 3   | iPhone 17 Pro Max, Mate 70 Pro |

---

## 平板设备

| 类别            | ID              | Physical Width (px) | CSS Width (px) | DPR | 代表设备                   |
| --------------- | --------------- | ------------------- | -------------- | --- | -------------------------- |
| **💻 Tablet S** | `tablet-small`  | 1600                | 533            | 3   | Samsung Tab S9             |
| **💻 Tablet M** | `tablet-medium` | 1668                | 834            | 2   | iPad Pro 11″, iPad Air 11″ |
| **💻 Tablet L** | `tablet-large`  | 2048                | 1024           | 2   | iPad Air 13″               |

---

## 笔记本设备

| 类别             | ID              | Physical Width (px) | CSS Width (px) | DPR     | 代表设备                            |
| ---------------- | --------------- | ------------------- | -------------- | ------- | ----------------------------------- |
| **💻 Laptop S**  | `laptop-small`  | 1920                | 1280-1920      | 1.0-1.5 | Dell XPS 13 FHD, Surface Laptop 13″ |
| **💻 Laptop M**  | `laptop-medium` | 2560                | 1280-1664      | 1.5-2.0 | MacBook Air 13″, Surface Laptop 15″ |
| **💻 Laptop L**  | `laptop-large`  | 2880                | 1440-1512      | 2.0     | MacBook Air 15″, MacBook Pro 14″    |
| **💻 Laptop XL** | `laptop-xlarge` | 3456                | 1728           | 2.0     | MacBook Pro 16″, Dell XPS 15 OLED   |

---

## 桌面设备

| 类别                      | ID                  | Physical Width (px) | CSS Width (px) | DPR / Scale | 代表设备                           |
| ------------------------- | ------------------- | ------------------- | -------------- | ----------- | ---------------------------------- |
| **🖥️ Desktop 2K**         | `desktop-2k`        | 2560                | 2560           | 1           | 27″ QHD Display (2560×1440)        |
| **🖥️ Desktop 4K**         | `desktop-4k`        | 3840                | 3840           | 1           | 4K Display Native (UHD 27–32″)     |
| **🖥️ Desktop 4K @1.5x**   | `desktop-4k-1.5x`   | 3840                | 2560           | 1.5         | 4K Display @150% (Windows Default) |
| **🖥️ Desktop 4K @Retina** | `desktop-4k-retina` | 5120                | 2560           | 2           | iMac 5K, Pro Display XDR @Retina   |
| **🖥️ Desktop 6K**         | `desktop-6k`        | 6016                | 6016           | 1           | Pro Display XDR (6K Native)        |

---

## 说明

### 分类方法

`Physical Width = CSS Width × DPR`

本矩阵专为**响应式图片优化**设计。主要分类标准是**物理渲染宽度**(浏览器需要渲染的实际像素数量),而非 CSS 视口宽度。

**为什么物理宽度很重要:**

- MacBook Air 13″ (CSS 1280px × DPR 2.0 = **2560px 物理像素**) 需要比 Dell XPS 13 FHD (CSS 1920px × DPR 1.0 = **1920px 物理像素**) 更高分辨率的图片
- 两个具有相同 CSS 宽度但不同 DPR 的设备需要不同分辨率的图片
- 图片 srcset 的选择基于物理像素,而非 CSS px

### 设备选择标准

**移动设备 (1080-1320px 物理像素):**

- **Mobile S (1080px)**: 主流小尺寸 Android 设备
- **Mobile M (1206px)**: 标准 iPhone 机型
- **Mobile L (1320px)**: 大屏旗舰手机

**平板设备 (1600-2048px 物理像素):**

- **Tablet S (1600px)**: 高 DPR (3.0) 的 Android 平板
- **Tablet M (1668px)**: 标准 iPad 11″ 系列 (最常见的平板断点)
- **Tablet L (2048px)**: 大尺寸平板 (iPad 13″)

**笔记本设备 (1920-3456px 物理像素):**

- **Laptop S (1920px)**: FHD 笔记本和低 DPI Windows 设备
- **Laptop M (2560px)**: MacBook Air 13″ 和 Surface 中端机型
- **Laptop L (2880px)**: MacBook Air 15″ 和高端笔记本
- **Laptop XL (3456px)**: MacBook Pro 16″ 和高端 OLED 笔记本

**桌面设备 (2560-6016px 物理像素):**

- 大多数桌面显示器为 1.0 DPR (原生分辨率)
- 4K 显示器在 Windows 上可能使用 150% 或 200% 缩放
- Apple 显示器 (iMac 5K, Pro Display XDR) 使用 2.0 DPR Retina 渲染

### 重要注意事项

1. **Physical Width**: 用于渲染的实际像素数量 (CSS Width × DPR)
2. **CSS Width**: 响应式设计和 CSS 媒体查询中使用的逻辑视口宽度
3. **DPR (Device Pixel Ratio)**: 每个 CSS 像素对应的物理像素数
4. **代表设备**: 非详尽列表;展示每个类别的典型设备 (每行最多 3 个)
5. **3840px 上限**: 对于响应式图片优化,在大多数使用场景中我们将物理宽度上限设为 3840px

### 设备差异和额外细节

**移动设备:**

- Pixel 9: 412px CSS × 2.625 DPR = 1082px 物理像素 (略低于基准值)
- Huawei Pura 70: ~419px CSS × 3.0 DPR = ~1257px 物理像素

**平板设备:**

- iPad Air 11″: 820px CSS × 2.0 DPR = 1640px 物理像素 (非常接近基准值 1668px)
- Samsung Tab S9+: ~584px CSS × 3.0 DPR = ~1752px 物理像素
- Samsung Tab S9 Ultra: ~616px CSS × 3.0 DPR = ~1848px 物理像素
- Huawei MatePad Pro 12.2″: ~613px CSS × 3.0 DPR = ~1840px 物理像素
- Huawei MatePad Pro 13.2″: ~640px CSS × 3.0 DPR = ~1920px 物理像素
- Surface Pro 2025: ~976px CSS × 1.5 DPR = ~1464px 物理像素

**笔记本设备:**

- Surface Laptop 13.5″: 1504px CSS × 1.5 DPR = 2256px 物理像素
- Surface Laptop 13.8″: 1536px CSS × 1.5 DPR = 2304px 物理像素
- ThinkPad X1 Carbon OLED: 1440px CSS × 2.0 DPR = 2880px 物理像素
- MacBook Pro 14″: 1512px CSS × 2.0 DPR = 3024px 物理像素
- Dell XPS 14 OLED: 1600px CSS × 2.0 DPR = 3200px 物理像素

对于精确实现,请在实际设备上测试或在必要时使用特定设备的断点。

---

## 快速参考:物理宽度范围

| 设备类型 | Physical Width 范围 | 主要用途            |
| -------- | ------------------- | ------------------- |
| Mobile   | 1080 - 1320px       | 智能手机优化图片    |
| Tablet   | 1600 - 2048px       | 平板优化图片        |
| Laptop   | 1920 - 3456px       | 笔记本/桌面优化图片 |
| Desktop  | 2560 - 6016px       | 大显示器优化图片    |

---

## 设备查询表

本综合表格可帮助您快速查找特定设备规格及其类别分类。设备按品牌分组以便参考。

### Apple - iPhone

| 设备名称          | 品牌  | Physical Resolution | DPR | CSS Width | Device Category ID |
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

| 设备名称                | 品牌  | Physical Resolution | DPR | CSS Width | Device Category ID |
| ----------------------- | ----- | ------------------- | --- | --------- | ------------------ |
| iPad Air 11″ (M2, 2024) | Apple | 1640 × 2360         | 2.0 | 820       | `tablet-medium`    |
| iPad Air 11″ (M3, 2025) | Apple | 1640 × 2360         | 2.0 | 820       | `tablet-medium`    |
| iPad Air 13″ (M2, 2024) | Apple | 2048 × 2732         | 2.0 | 1024      | `tablet-large`     |
| iPad Air 13″ (M3, 2025) | Apple | 2048 × 2732         | 2.0 | 1024      | `tablet-large`     |
| iPad Pro 11″ (M2, 2022) | Apple | 1668 × 2388         | 2.0 | 834       | `tablet-medium`    |
| iPad Pro 11″ (M4, 2024) | Apple | 1668 × 2420         | 2.0 | 834       | `tablet-medium`    |
| iPad Pro 13″ (M4, 2024) | Apple | 2064 × 2752         | 2.0 | 1032      | `tablet-large`     |

### Apple - MacBook

| 设备名称                   | 品牌  | Physical Resolution | DPR | CSS Width | Device Category ID |
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

| 设备名称             | 品牌  | Physical Resolution | DPR | CSS Width | Device Category ID  |
| -------------------- | ----- | ------------------- | --- | --------- | ------------------- |
| iMac 24″ (M4, 2024)  | Apple | 4480 × 2520         | 2.0 | 2240      | `desktop-4k-retina` |
| Pro Display XDR (6K) | Apple | 6016 × 3384         | 1.0 | 6016      | `desktop-6k`        |

### Samsung - Mobile

| 设备名称         | 品牌    | Physical Resolution | DPR    | CSS Width | Device Category ID |
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

| 设备名称            | 品牌    | Physical Resolution | DPR | CSS Width | Device Category ID |
| ------------------- | ------- | ------------------- | --- | --------- | ------------------ |
| Galaxy Tab S9       | Samsung | 1600 × 2560         | 3.0 | 533       | `tablet-small`     |
| Galaxy Tab S9+      | Samsung | 1752 × 2800         | 3.0 | 584       | `tablet-small`     |
| Galaxy Tab S9 Ultra | Samsung | 1848 × 2960         | 3.0 | 616       | `tablet-small`     |

### Samsung - Monitor

| 设备名称            | 品牌    | Physical Resolution | DPR | CSS Width | Device Category ID |
| ------------------- | ------- | ------------------- | --- | --------- | ------------------ |
| Odyssey OLED G8 27″ | Samsung | 3840 × 2160         | 1.0 | 3840      | `desktop-4k`       |
| Odyssey OLED G8 32″ | Samsung | 3840 × 2160         | 1.0 | 3840      | `desktop-4k`       |
| ViewFinity S70A 27″ | Samsung | 3840 × 2160         | 1.0 | 3840      | `desktop-4k`       |

### Google - Pixel

| 设备名称       | 品牌   | Physical Resolution | DPR   | CSS Width | Device Category ID |
| -------------- | ------ | ------------------- | ----- | --------- | ------------------ |
| Pixel 8        | Google | 1080 × 2400         | 2.625 | 412       | `mobile-medium`    |
| Pixel 8 Pro    | Google | 1344 × 2992         | 3.0   | 448       | `mobile-large`     |
| Pixel 9        | Google | 1080 × 2424         | 2.625 | 412       | `mobile-medium`    |
| Pixel 9 Pro    | Google | 1280 × 2856         | 2.625 | 487       | `mobile-large`     |
| Pixel 9 Pro XL | Google | 1344 × 2992         | 3.0   | 448       | `mobile-large`     |
| Pixel 10       | Google | 1080 × 2424         | 2.625 | 412       | `mobile-medium`    |
| Pixel 10 Pro   | Google | 1280 × 2856         | 2.625 | 487       | `mobile-large`     |

### Huawei - Mobile & Tablet

| 设备名称          | 品牌   | Physical Resolution | DPR | CSS Width | Device Category ID |
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

| 设备名称  | 品牌   | Physical Resolution | DPR | CSS Width | Device Category ID |
| --------- | ------ | ------------------- | --- | --------- | ------------------ |
| Xiaomi 13 | Xiaomi | 1080 × 2400         | 3.0 | 360       | `mobile-small`     |
| Xiaomi 14 | Xiaomi | 1200 × 2670         | 3.0 | 400       | `mobile-medium`    |
| Xiaomi 15 | Xiaomi | 1200 × 2670         | 3.0 | 400       | `mobile-medium`    |

### Microsoft - Surface

| 设备名称                       | 品牌      | Physical Resolution | DPR | CSS Width | Device Category ID |
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

| 设备名称    | 品牌 | Physical Resolution | DPR | CSS Width | Device Category ID |
| ----------- | ---- | ------------------- | --- | --------- | ------------------ |
| XPS 13 FHD+ | Dell | 1920 × 1200         | 1.0 | 1920      | `laptop-small`     |
| XPS 14 FHD+ | Dell | 1920 × 1200         | 1.0 | 1920      | `laptop-small`     |
| XPS 14 OLED | Dell | 3200 × 2000         | 2.0 | 1600      | `laptop-xlarge`    |
| XPS 15 FHD+ | Dell | 1920 × 1200         | 1.0 | 1920      | `laptop-small`     |
| XPS 15 OLED | Dell | 3456 × 2160         | 2.0 | 1728      | `laptop-xlarge`    |

### Lenovo - ThinkPad

| 设备名称                          | 品牌   | Physical Resolution | DPR | CSS Width | Device Category ID |
| --------------------------------- | ------ | ------------------- | --- | --------- | ------------------ |
| ThinkPad X1 Carbon Gen 12/13 OLED | Lenovo | 2880 × 1800         | 2.0 | 1440      | `laptop-large`     |
| ThinkPad T14 FHD                  | Lenovo | 1920 × 1080         | 1.0 | 1920      | `laptop-small`     |

---

## 版本历史

**v2025.1 (2025-10-10)** - 初始版本发布

**核心方法论:**

- 基于**物理渲染宽度** (CSS Width × DPR) 进行分类,而非 CSS 视口宽度
- 专门为响应式图片优化设计
- 物理宽度决定图片资源的实际像素要求

**设备类别:**

- **移动设备**: S/M/L (1080-1320px 物理宽度)
- **平板设备**: S/M/L (1600-2048px 物理宽度)
- **笔记本设备**: S/M/L/XL (1920-3456px 物理宽度)
- **桌面设备**: 2K/4K/4K@1.5x/4K@Retina/6K (2560-6016px 物理宽度)

**设备覆盖 (8 个品牌 80+ 款设备):**

- Apple iPhone: 15/16/17 系列 (11 款机型)
- Apple iPad: M2/M3/M4 代 (7 款机型)
- Apple MacBook: M2/M3/M4 代 (12 款机型)
- Apple Desktop: iMac, Pro Display XDR (2 款机型)
- Samsung: Galaxy S23/S24/S25, 平板, 显示器 (12 款机型)
- Google Pixel: 8/9/10 系列 (7 款机型)
- Huawei: Mate 60/70, Pura 70, MatePad Pro (9 款机型)
- Xiaomi: 13/14/15 系列 (3 款机型)
- Microsoft Surface: Pro 9/10, Laptop 3-7 (14 款机型)
- Dell XPS: 13/14/15 FHD/OLED (5 款机型)
- Lenovo ThinkPad: X1 Carbon, T14 (2 款机型)

**主要特性:**

- 设备矩阵按物理宽度排序 (升序)
- 所有表格中 Physical Width 列优先显示
- 按品牌组织的综合设备查询表
- 详细的设备差异文档
- 物理宽度范围快速参考表
- 所有设备规格均通过网络研究验证

**桌面类别设计:**

- `desktop-2k` (2560px): QHD 显示器
- `desktop-4k` (3840px): 原生 4K 显示器
- `desktop-4k-1.5x` (3840px): 4K @150% 缩放 (Windows 默认)
- `desktop-4k-retina` (5120px): 5K Retina 显示器 (iMac 5K)
- `desktop-6k` (6016px): 6K 显示器 (Pro Display XDR)
