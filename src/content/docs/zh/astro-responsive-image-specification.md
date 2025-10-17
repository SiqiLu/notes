---
title: Astro 响应式图片方案
description: 基于 Device Matrix v2025.1 的 Astro 响应式图片完整规范，涵盖 Desktop 和 Mobile 站点的三种典型场景
lastUpdated: 2025-10-16
tags: [astro, responsive-images, device-matrix, web-performance, specification]
---

> 本文面向前端/设计/产品工程团队，用于在 **Astro** 项目中，基于统一的**设备矩阵（Device Matrix）**，实现稳定、可复用、可验证的**响应式图片**方案。我们采用 **Desktop 站点** 与 **Mobile 站点** 分治，并通过 **三类典型场景**（视口 100% 宽、视口 30% 宽、固定 30–100px）演示完整的实现方法。
>
> **基于**: Device Matrix v2025.1 (2025-10-10)

---

> ⚠️ **重要概念区分**
> 本文档讨论的是**图片资源的响应式优化**（基于物理分辨率），而非 **CSS 布局的响应式设计**（基于 CSS 分辨率）。
>
> - **图片响应式优化**：根据设备的 **Physical Width (物理分辨率)** 选择合适尺寸的图片，避免浪费带宽
> - **CSS 响应式设计**：根据设备的 **CSS Width (逻辑分辨率)** 调整页面布局（Media Queries）
>   **示例**：MacBook Air 13″ (CSS 1280px × DPR 2.0 = **2560px physical**)
> - CSS 响应式：使用 `@media (min-width: 1280px)` 的 Desktop 布局
> - 图片响应式：通过 `srcset` 加载 2560px 宽度的图片资源
>   这两者是**互补**的，不是替代关系。本文档专注于图片资源的物理宽度优化。

---

## 0. 文档信息与术语

- **适用范围**：Desktop 站点（覆盖 Tablet / Laptop / Desktop）与 Mobile 站点（覆盖 Mobile）。
- **站点路由策略**：通过设备类型进行路由分发，Mobile 设备访问 Mobile 站点，其余设备访问 Desktop 站点。
- **关键术语**：
  - **CSS px**：布局逻辑像素，`window.innerWidth` 返回的值。
  - **Physical Width (px)**：物理渲染宽度 = CSS Width × DPR，浏览器实际需要渲染的像素宽度。
  - **DPR**：设备像素比（Device Pixel Ratio），浏览器据此在 `srcset` 中选择资源。
  - **`vw`**：视口宽度单位；`1vw = 视口宽度的 1%`。
  - **`srcset` (`w` 描述符)**：候选资源的**物理像素宽度**列表。
  - **`sizes`**：告知浏览器图片在不同视口下的**CSS 显示宽度**，用于选取最合适的 `srcset` 候选。
  - **离散断点 (Breakpoint Strategy)**：本文档中的"断点"指**图片资源的物理宽度断点**（如 1080, 1206, 1320），区别于 CSS 响应式设计中的 CSS 宽度断点（如 375px, 768px, 1024px）。采用有限数量的、间隔分布的图片宽度，而非为每个可能的像素值生成图片。浏览器会根据 `sizes` 计算出实际所需宽度后，从 `srcset` 中自动选择候选图片，选择规则为：优先选择**最接近且不小于**所需宽度的候选；若所有候选都小于所需宽度，则选择**最大**的候选。这种策略可以大幅减少生成的图片数量（通常 5-8 个断点即可覆盖所有设备），同时保持良好的视觉效果。

---

## 1. 背景与目标（我们要解决什么问题）

- **问题**：不同设备与布局下如何既"清晰不糊"，又"不过度浪费带宽与构建时间"？手写 `<picture>`/`srcset` 容易出错、难以维护，且缺乏统一的断点标准。
- **目标**：
  1. 基于**设备矩阵**统一断点语义；
  2. 使用 Astro `<Picture>` / `<Image>` 规范化输出；
  3. 按**双站点**分治，分别针对 Desktop 与 Mobile 优化；
  4. 通过**工具方法**按设计稿宽度**动态生成断点**，避免"写死常量"；
  5. **设计基准约束**：以 **Physical Width 3840** 作为设计稿基准宽度。图片的最大导出尺寸取决于其在 3840 宽度设计稿中的实际尺寸。例如：某图片在 3840 设计稿中宽度为 100px，则无论目标设备物理宽度多大（如 Desktop 6K 的 6016px），该图片的原始设计稿导出宽度仍为 100px，生成的优化图片最大宽度也不会超过 100px。

---

## 2. 技术环境（Astro 组件与构建）

- **`<Picture />`**（来自 `astro:assets`）：一次输出多格式/多尺寸（`<picture>` + `<source>` + `<img>`）。
- **`<Image />`**（来自 `astro:assets`）：输出单一 `<img>`，可配置单一格式、多尺寸。
- 构建期优化（共同点）：自动生成 `srcset`/`sizes`，填充 `width/height` 以避免 CLS，开启 `loading="lazy"`/`decoding="async"`，资源哈希与缓存友好。

**设计交付建议**：

- **摄影类**：**JPEG（sRGB，质量 90–95）**（体积异常大时可降至 88–90）。
- **透明/插画/Logo**：**PNG**（或无损 WebP）。
- **宽高比**：以设计稿为准（文中以 16:9 举例，高度按实际设计比例替换）。

---

## 3. 设备矩阵（两批）— 基于 Device Matrix v2025.1

> 设计基准：以 **Physical Width 3840** 作为设计稿基准宽度，图片的最大导出尺寸取决于其在 3840 宽度设计稿中的实际尺寸。

### 3.1 Mobile 站点设备（覆盖 Mobile）

| 类别        | Device ID       | Physical Width (px) | CSS Width (px) | DPR | 代表设备                       |
| ----------- | --------------- | ------------------: | -------------: | --: | ------------------------------ |
| 📱 Mobile S | `mobile-small`  |                1080 |            360 |   3 | Galaxy S25, Xiaomi 14          |
| 📱 Mobile M | `mobile-medium` |                1206 |            402 |   3 | iPhone 17, iPhone 17 Pro       |
| 📱 Mobile L | `mobile-large`  |                1320 |            440 |   3 | iPhone 17 Pro Max, Mate 70 Pro |

**说明**：

- Mobile 站点服务于所有 Mobile 设备（物理宽度 1080–1320px）
- 主流移动设备 DPR 范围为 2.625–3.75（iPhone 全系列 3.0，Samsung 基础款 3.0、Plus/Ultra 款 2.8125/3.75，Google Pixel 2.625/3.0，Huawei/Xiaomi 3.0）
- 本方案按物理宽度分类（1080/1206/1320），可覆盖不同 DPR 设备
- 物理宽度即为 `srcset` 中的 `w` 描述符值

### 3.2 Desktop 站点设备（覆盖 Tablet + Laptop + Desktop）

#### 3.2.1 Tablet 设备（3 档）

| 类别        | Device ID       | Physical Width (px) | CSS Width (px) | DPR | 代表设备                   |
| ----------- | --------------- | ------------------: | -------------: | --: | -------------------------- |
| 💻 Tablet S | `tablet-small`  |                1600 |            533 |   3 | Samsung Tab S9             |
| 💻 Tablet M | `tablet-medium` |                1668 |            834 |   2 | iPad Pro 11″, iPad Air 11″ |
| 💻 Tablet L | `tablet-large`  |                2048 |           1024 |   2 | iPad Air 13″               |

#### 3.2.2 Laptop 设备（4 档）

| 类别         | Device ID       | Physical Width (px) | CSS Width (px) |     DPR | 代表设备                            |
| ------------ | --------------- | ------------------: | -------------: | ------: | ----------------------------------- |
| 💻 Laptop S  | `laptop-small`  |                1920 |      1280-1920 | 1.0-1.5 | Dell XPS 13 FHD, Surface Laptop 13″ |
| 💻 Laptop M  | `laptop-medium` |                2560 |      1280-1664 | 1.5-2.0 | MacBook Air 13″, Surface Laptop 15″ |
| 💻 Laptop L  | `laptop-large`  |                2880 |      1440-1512 |     2.0 | MacBook Air 15″, MacBook Pro 14″    |
| 💻 Laptop XL | `laptop-xlarge` |                3456 |           1728 |     2.0 | MacBook Pro 16″, Dell XPS 15 OLED   |

**注**：Laptop 设备的 CSS Width 为范围值，因不同缩放比例（1.0/1.5/2.0）导致同一物理分辨率对应不同 CSS 宽度。

#### 3.2.3 Desktop 设备（5 档）

| 类别                  | Device ID           | Physical Width (px) | CSS Width (px) | DPR / Scale | 代表设备                           |
| --------------------- | ------------------- | ------------------: | -------------: | ----------: | ---------------------------------- |
| 🖥️ Desktop 2K         | `desktop-2k`        |                2560 |           2560 |           1 | 27″ QHD Display (2560×1440)        |
| 🖥️ Desktop 4K         | `desktop-4k`        |                3840 |           3840 |           1 | 4K Display Native (UHD 27–32″)     |
| 🖥️ Desktop 4K @1.5x   | `desktop-4k-1.5x`   |                3840 |           2560 |         1.5 | 4K Display @150% (Windows Default) |
| 🖥️ Desktop 4K @Retina | `desktop-4k-retina` |     5120 → **3840** |           2560 |           2 | iMac 5K, Pro Display XDR @Retina   |
| 🖥️ Desktop 6K         | `desktop-6k`        |     6016 → **3840** |           6016 |           1 | Pro Display XDR (6K Native)        |

**注**：

- Desktop 4K @1.5x 与 Desktop 4K 的物理宽度相同（均为 3840），但 CSS 宽度不同

#### 3.2.4 Desktop 站点物理宽度汇总（Tablet + Laptop + Desktop）

Desktop 站点覆盖**三大类设备**（Tablet、Laptop、Desktop），将所有物理宽度去重排序后得到：

```text
完整设备矩阵：1600, 1668, 1920, 2048, 2560, 2880, 3456, 3840, 5120, 6016
默认断点（designViewportWidth=3840）：1600, 1668, 1920, 2048, 2560, 2880, 3456, 3840
```

**来源说明**：

- **Tablet 设备（3 档）**: 1600, 1668, 2048
- **Laptop 设备（4 档）**: 1920, 2560, 2880, 3456
- **Desktop 设备（5 档）**: 2560, 3840, 5120, 6016
  - Desktop 2K: 2560
  - Desktop 4K / 4K @1.5x: 3840
  - Desktop 4K @Retina (iMac 5K, Pro Display XDR @Retina): 5120
  - Desktop 6K (Pro Display XDR Native): 6016
- **去重后**: 1600, 1668, 1920, 2048, 2560, 2880, 3456, 3840, 5120, 6016

**说明**：

- Desktop 2K (2560) 与 Laptop M (2560) 物理宽度相同，去重后保留一个
- 默认情况下（`designViewportWidth=3840`），断点会被封顶到 3840，得到 **8 个离散断点**
- 通过设置 `designViewportWidth=5120` 或 `6016`，可以包含 5K/6K 显示器的断点，得到 **9 或 10 个断点**
- 这样的设计兼顾了默认行为的高效性和对高分辨率显示器的灵活支持

---

## 4. 设计原则与断点工具方法

### 4.1 设计与选择原则

- **设计基准**：以 **Physical Width 3840** 作为设计稿基准宽度，作为图片的默认最大导出尺寸上限。实际项目中，图片的最大宽度由 `maxWidth` 参数控制，可以根据图片在设计稿中的实际尺寸灵活设置（如全宽图片为 3840，卡片缩略图可能为 1152）。
- **演示场景说明**：本方案通过以下三类典型场景演示如何处理不同布局需求的响应式图片，但**工具函数支持任意比例和尺寸范围**，不限于这三种场景：
  - **场景 1（视口 100% 宽）**：图片占满视口宽度（如 Hero Banner），按 **Physical Width** 为基准生成候选宽度。
  - **场景 2（视口 30% 宽）**：图片占视口宽度的 30%（如卡片缩略图），按 **Physical Width × 0.3** 计算，上限 **3840×0.3 = 1152**。
  - **场景 3（固定 30–100px）**：固定尺寸图片（如头像/图标），直接在区间 [30,100] 生成候选宽度，不受视口影响。
  - **其他场景**：如 50% 宽侧栏图片、固定 200px Logo、最小宽度 800px 的大图等，均可通过调整 `ratio`、`minWidth`、`maxWidth` 参数实现。
- **离散断点策略**：采用有限数量的图片宽度（如 Desktop 站点默认使用 8 个断点，支持 5K/6K 显示器时最多 10 个断点），而非为每个设备精确生成。原因：(1) 滚动条/侧栏/窗口非最大化等会使实际显示宽度波动；(2) 浏览器会自动选择最合适的候选（优先选择最接近且不小于所需宽度的图片，若无则选择最大的图片）；(3) 可显著减少构建时间和存储成本。
- **取整策略**：向上取到工程友好值（建议步进 16；也可配置为 8/4/1）。

### 4.2 断点工具方法（灵活的比例与约束）

> **文件路径**（推荐）：`utils/image_breakpoints.ts`
> 本节代码可直接复制到项目中使用，无需额外依赖。

````ts
// ============================================================
// 类型定义
// ============================================================

/**
 * 断点配置选项
 *
 * @remarks
 * 基础配置选项，包含通用的配置参数（最大/最小宽度、取整步进等）
 *
 * 当不传 ratio 参数时，有两种行为：
 * 1. 只传 maxWidth：自动从 3840 反推 ratio（如 maxWidth=1500 → ratio≈0.39）
 * 2. 都不传：默认 ratio=1.0（100vw），maxWidth=3840
 *
 * @example 默认 100% 宽度
 * ```ts
 * computeDesktopBreakpoints({})
 * // => { widths: [1600, 1680, 1920, ...] }
 * ```
 *
 * @example 自动反推 ratio
 * ```ts
 * computeDesktopBreakpoints({ maxWidth: 1500 })
 * // 内部计算: ratio = 1500 / 3840 ≈ 0.391
 * // => { widths: [640, 656, 752, 816, 1008, 1136, 1360, 1500] }
 * ```
 */
interface BreakpointOptions {
  /**
   * 图片最大宽度（像素）
   *
   * @remarks
   * - 不传时：默认为 3840（Desktop）或 1320（Mobile）
   * - 传递时：作为图片的最大导出尺寸上限
   * - 如果同时传了 minWidth，必须 maxWidth >= minWidth
   * - **重要**：用户明确指定的 maxWidth 会被视为关键断点，必定出现在最终的断点数组中
   *
   * @example
   * ```ts
   * { maxWidth: 1152 }  // 卡片缩略图最大 1152px，断点数组中必包含 1152
   * { maxWidth: 100 }   // 头像最大 100px，断点数组中必包含 100
   * ```
   */
  maxWidth?: number;

  /**
   * 图片最小宽度（像素）
   *
   * @remarks
   * - 用于过滤掉小于此值的断点候选（在取整后应用）
   * - **重要**：用户明确指定的 minWidth 会被视为关键断点，必定出现在最终的断点数组中
   * - 常见用途：固定尺寸图片、过滤过小断点、定义尺寸范围
   *
   * @example
   * ```ts
   * { minWidth: 800 }               // 过滤掉 < 800px 的断点，且断点数组中必包含 800
   * { minWidth: 30, maxWidth: 100 } // 固定尺寸范围 [30, 100]，断点数组中必包含 30 和 100
   * { minWidth: 1000 }              // 只生成大图断点，且从 1000px 开始
   * ```
   */
  minWidth?: number;

  /**
   * 取整步进（像素）
   *
   * @remarks
   * 将计算出的断点宽度向上取整到此值的倍数，使宽度更"工程友好"
   *
   * @default 16
   *
   * @example
   * ```ts
   * { roundStep: 16 }  // 1668 → 1680
   * { roundStep: 8 }   // 1668 → 1672
   * { roundStep: 1 }   // 1668 → 1668（不取整）
   * ```
   */
  roundStep?: number;

  /**
   * 设计稿视口宽度（像素）
   *
   * @remarks
   * **重要说明**：此参数表示设计稿的视口宽度（即设计稿的画布宽度），而不是图片本身的宽度。
   *
   * **使用场景**：
   * - 假设你的设计稿是在 3840px 宽度的画布上设计的
   * - 设计稿中某张图片显示为 1000px 宽
   * - 则应该传递：`maxWidth: 1000, designViewportWidth: 3840`
   *
   * **此参数的关键作用**：
   * 1. **断点宽度上限**：所有生成的断点宽度不会超过此值
   * 2. **反推 ratio**：当仅提供 maxWidth 时，ratio = maxWidth / designViewportWidth
   * 3. **默认最大宽度**：当不提供任何参数时，使用此值作为最大宽度
   *
   * **重要约束**：
   * - 必须满足：`maxWidth <= designViewportWidth`
   * - 如果违反此约束，会抛出错误
   * - 因为图片宽度不应该超过设计稿视口宽度
   *
   * @default
   * - Desktop: 3840 (对应 4K 显示器的物理宽度)
   * - Mobile: 1320 (对应最大 Mobile 设备的物理宽度)
   *
   * @example 基于 1920px 设计稿的 Desktop 站点
   * ```ts
   * // 设计稿视口宽度是 1920px，图片在设计稿上显示 1200px
   * computeDesktopBreakpoints({ maxWidth: 1200, designViewportWidth: 1920 })
   * // => ratio = 1200 / 1920 = 0.625 (62.5vw)
   * // => 断点不会超过 1920px
   * ```
   *
   * @example 使用默认的 3840px 设计稿
   * ```ts
   * // 默认 Desktop 设计稿是 3840px，图片显示 1000px
   * computeDesktopBreakpoints({ maxWidth: 1000 })
   * // => designViewportWidth 默认为 3840
   * // => ratio = 1000 / 3840 ≈ 0.26 (26vw)
   * ```
   *
   * @example 错误示例：maxWidth 超过 designViewportWidth
   * ```ts
   * // ❌ 错误：图片宽度 2400px 超过设计稿视口宽度 1920px
   * computeDesktopBreakpoints({ maxWidth: 2400, designViewportWidth: 1920 })
   * // => 抛出错误：maxWidth must not exceed designViewportWidth
   * ```
   */
  designViewportWidth?: number;
}

/**
 * 比例配置选项（传递 ratio 时使用）
 *
 * @remarks
 * 当传递 ratio 参数时，表示图片占视口宽度的比例（0-1 之间）
 *
 * @example 30% 宽度
 * ```ts
 * computeDesktopBreakpoints({ ratio: 0.3 })
 * // => { widths: [480, 512, 576, ...] }
 * ```
 *
 * @example 50% 宽度 + 最大宽度限制
 * ```ts
 * computeDesktopBreakpoints({ ratio: 0.5, maxWidth: 2000 })
 * // => { widths: [800, 848, 960, ..., 2000] }
 * ```
 */
interface RatioBreakpointOptions extends BreakpointOptions {
  /**
   * 图片占视口宽度的比例
   *
   * @remarks
   * - 取值范围：0 < ratio <= 1
   * - 常见值：0.3 (30%), 0.5 (50%), 1.0 (100%)
   *
   * @example
   * ```ts
   * { ratio: 0.3 }   // 卡片缩略图
   * { ratio: 0.5 }   // 侧栏图片
   * { ratio: 1.0 }   // 全宽 Banner
   * ```
   */
  ratio: number;
}

/**
 * 断点计算结果
 *
 * @remarks
 * 返回值可直接用于 Astro 的 `<Picture>` 或 `<Image>` 组件
 */
interface BreakpointResult {
  /**
   * srcset 候选宽度数组（升序排列）
   *
   * @remarks
   * - 用于 `<Picture widths={widths}>` 或 `<Image widths={widths}>`
   * - 浏览器会根据 DPR 和 sizes 属性从中选择最合适的候选
   *
   * @example
   * ```ts
   * [1600, 1680, 1920, 2048, 2560, 2880, 3456, 3840]
   * ```
   */
  widths: number[];
}

// ============================================================
// 常量定义（基于 Device Matrix v2025.1）
// ============================================================

/**
 * Mobile 站点设备物理宽度（去重排序后）
 *
 * @remarks
 * 覆盖设备：
 * - Mobile S (1080px): Galaxy S25, Xiaomi 14
 * - Mobile M (1206px): iPhone 17, iPhone 17 Pro
 * - Mobile L (1320px): iPhone 17 Pro Max, Mate 70 Pro
 */
const MOBILE_PHYSICAL = [1080, 1206, 1320] as const;

/**
 * Desktop 站点设备物理宽度（去重排序后）
 *
 * @remarks
 * 覆盖设备类别：
 * - Tablet (3 档): 1600, 1668, 2048
 * - Laptop (4 档): 1920, 2560, 2880, 3456
 * - Desktop (5 档): 2560, 3840, 5120, 6016
 *   - Desktop 2K: 2560
 *   - Desktop 4K / 4K @1.5x: 3840
 *   - Desktop 4K @Retina (iMac 5K, Pro Display XDR @Retina): 5120
 *   - Desktop 6K (Pro Display XDR Native): 6016
 *
 * 去重后共 10 个断点：1600, 1668, 1920, 2048, 2560, 2880, 3456, 3840, 5120, 6016
 *
 * **重要说明**：
 * - 默认情况下（designViewportWidth = 3840），断点会被封顶到 3840，实际使用 8 个断点
 * - 当用户指定更大的 designViewportWidth（如 5120 或 6016）时，会包含相应的更大断点
 * - 这样设计可以让用户灵活支持 5K/6K 显示器，同时保持默认行为的向后兼容
 */
const DESKTOP_PHYSICAL = [1600, 1668, 1920, 2048, 2560, 2880, 3456, 3840, 5120, 6016] as const;

/**
 * Desktop 站点默认设计稿视口宽度（内部常量）
 *
 * @remarks
 * 表示 Desktop 站点设计稿的默认视口宽度（画布宽度），对应 4K 显示器的物理宽度。
 *
 * 作用：
 * 1. 断点宽度上限：所有生成的断点不会超过此值
 * 2. 用于反推 ratio：ratio = maxWidth / DESKTOP_DESIGN_VIEWPORT_WIDTH
 * 3. 默认最大宽度：当不提供参数时的 upper 值
 */
const DESKTOP_DESIGN_VIEWPORT_WIDTH = 3840;

/**
 * Mobile 站点默认设计稿视口宽度（内部常量）
 *
 * @remarks
 * 表示 Mobile 站点设计稿的默认视口宽度（画布宽度），对应最大 Mobile 设备的物理宽度。
 *
 * 作用：
 * 1. 断点宽度上限：所有生成的断点不会超过此值
 * 2. 用于反推 ratio：ratio = maxWidth / MOBILE_DESIGN_VIEWPORT_WIDTH
 * 3. 默认最大宽度：当不提供参数时的 upper 值
 */
const MOBILE_DESIGN_VIEWPORT_WIDTH = 1320;

// ============================================================
// 辅助函数
// ============================================================

/**
 * 将数值向上取整到指定步进的倍数
 *
 * @param n - 待取整的数值（必须 >= 0）
 * @param step - 取整步进（必须为正整数，单位：像素）
 * @returns 向上取整后的结果
 *
 * @throws {Error} 当 step <= 0 时（防止除以零或负数步进）
 * @throws {Error} 当 step 不是整数时（像素值必须为整数）
 * @throws {Error} 当 n < 0 时（图片宽度不应为负数）
 *
 * @example
 * ```ts
 * ceilToStep(1668, 16)  // => 1680
 * ceilToStep(1668, 8)   // => 1672
 * ceilToStep(1668, 1)   // => 1668
 * ```
 *
 * @example 错误示例
 * ```ts
 * ceilToStep(1668, 0)    // => 抛出错误：step must be greater than 0
 * ceilToStep(1668, -16)  // => 抛出错误：step must be greater than 0
 * ceilToStep(1668, 16.5) // => 抛出错误：step must be an integer
 * ceilToStep(-100, 16)   // => 抛出错误：n must be non-negative
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
// 核心函数
// ============================================================

/**
 * 计算 Desktop 站点的响应式图片断点
 *
 * @remarks
 * Desktop 站点覆盖 **Tablet + Laptop + Desktop** 设备
 * - 物理宽度范围：1600px - 6016px（完整设备矩阵）
 * - 默认最大宽度：3840px（默认使用 8 个断点）
 * - 支持自定义 designViewportWidth（如 5120/6016）以包含更大断点
 *
 * **函数重载逻辑**：
 * 1. 不传 ratio：默认 100vw，或从 maxWidth 反推 ratio
 * 2. 传递 ratio：按指定比例计算断点
 *
 * @param opts - 断点配置选项
 * @returns 断点计算结果（widths 数组）
 *
 * @throws {Error} 当 maxWidth < minWidth 时
 * @throws {Error} 当约束条件导致无有效断点时
 *
 * @example 全宽图片
 * ```ts
 * const hero = computeDesktopBreakpoints({})
 * // 计算过程：
 * // 1. 原始物理宽度（DESKTOP_PHYSICAL, 取前8个）: [1600, 1668, 1920, 2048, 2560, 2880, 3456, 3840]
 * // 2. 按 ratio=1.0 缩放: [1600, 1668, 1920, 2048, 2560, 2880, 3456, 3840]
 * // 3. roundStep=16 向上取整: [1600, 1680, 1920, 2048, 2560, 2880, 3456, 3840]
 * // 4. 封顶到 maxWidth=3840: [1600, 1680, 1920, 2048, 2560, 2880, 3456, 3840]
 * // => { widths: [1600, 1680, 1920, 2048, 2560, 2880, 3456, 3840] }
 * ```
 *
 * @example 30% 宽卡片缩略图
 * ```ts
 * const card = computeDesktopBreakpoints({ ratio: 0.3 })
 * // 计算过程：
 * // 1. 原始物理宽度: [1600, 1668, 1920, 2048, 2560, 2880, 3456, 3840]
 * // 2. 按 ratio=0.3 缩放: [480, 500.4, 576, 614.4, 768, 864, 1036.8, 1152]
 * // 3. roundStep=16 向上取整: [480, 512, 576, 624, 768, 864, 1040, 1152]
 * // 4. 封顶到 upper=1152: [480, 512, 576, 624, 768, 864, 1040, 1152]
 * // => { widths: [480, 512, 576, 624, 768, 864, 1040, 1152] }
 * ```
 *
 * @example 自动反推 ratio（最大宽度 1500px）
 * ```ts
 * const medium = computeDesktopBreakpoints({ maxWidth: 1500 })
 * // 计算过程：
 * // 1. 反推 ratio = 1500 / 3840 ≈ 0.391
 * // 2. 原始物理宽度: [1600, 1668, 1920, 2048, 2560, 2880, 3456, 3840]
 * // 3. 按 ratio=0.391 缩放: [625.6, 652.4, 750.7, 800.8, 1001.0, 1126.1, 1351.3, 1501.4]
 * // 4. roundStep=16 向上取整: [640, 656, 752, 816, 1008, 1136, 1360, 1504]
 * // 5. 封顶到 maxWidth=1500: [640, 656, 752, 816, 1008, 1136, 1360, 1500]
 * // 6. 强制添加 maxWidth=1500: [640, 656, 752, 816, 1008, 1136, 1360, 1500]
 * // => { widths: [640, 656, 752, 816, 1008, 1136, 1360, 1500] }
 * ```
 *
 * @example 固定尺寸头像（30-100px）
 * ```ts
 * const avatar = computeDesktopBreakpoints({ minWidth: 30, maxWidth: 100, roundStep: 1 })
 * // 计算过程：
 * // 1. 反推 ratio = 100 / 3840 ≈ 0.026
 * // 2. 原始物理宽度: [1600, 1668, 1920, 2048, 2560, 2880, 3456, 3840]
 * // 3. 按 ratio=0.026 缩放: [41.6, 43.4, 50.0, 53.2, 66.6, 74.9, 89.9, 100.0]
 * // 4. roundStep=1 向上取整: [42, 44, 50, 54, 67, 75, 90, 100]
 * // 5. 封顶到 maxWidth=100: [42, 44, 50, 54, 67, 75, 90, 100]
 * // 6. 过滤 minWidth=30: [42, 44, 50, 54, 67, 75, 90, 100]（都 >= 30）
 * // 7. 强制添加 minWidth=30 和 maxWidth=100: [30, 42, 44, 50, 54, 67, 75, 90, 100]
 * // => { widths: [30, 42, 44, 50, 54, 67, 75, 90, 100] }
 * ```
 *
 * @example 50% 宽侧栏图片 + 最大宽度 2000px
 * ```ts
 * const sidebar = computeDesktopBreakpoints({ ratio: 0.5, maxWidth: 2000 })
 * // 计算过程：
 * // 1. 原始物理宽度: [1600, 1668, 1920, 2048, 2560, 2880, 3456, 3840]
 * // 2. 按 ratio=0.5 缩放: [800, 834, 960, 1024, 1280, 1440, 1728, 1920]
 * // 3. roundStep=16 向上取整: [800, 848, 960, 1024, 1280, 1440, 1728, 1920]
 * // 4. 封顶到 maxWidth=2000: [800, 848, 960, 1024, 1280, 1440, 1728, 1920]
 * // 5. 强制添加 maxWidth=2000: [800, 848, 960, 1024, 1280, 1440, 1728, 1920, 2000]
 * // => { widths: [800, 848, 960, 1024, 1280, 1440, 1728, 1920, 2000] }
 * ```
 */
export function computeDesktopBreakpoints(opts: BreakpointOptions = {}): BreakpointResult {
  return computeBreakpointsInternal(opts, DESKTOP_PHYSICAL, DESKTOP_DESIGN_VIEWPORT_WIDTH);
}

/**
 * 计算 Mobile 站点的响应式图片断点
 *
 * @remarks
 * Mobile 站点覆盖 **Mobile** 设备
 * - 物理宽度范围：1080px - 1320px
 * - 共 3 个离散断点（取整后）
 * - 默认最大宽度：1320px
 *
 * **函数重载逻辑**：
 * 1. 不传 ratio：默认 100vw，或从 maxWidth 反推 ratio
 * 2. 传递 ratio：按指定比例计算断点
 *
 * @param opts - 断点配置选项
 * @returns 断点计算结果（widths 数组）
 *
 * @throws {Error} 当 maxWidth < minWidth 时
 * @throws {Error} 当约束条件导致无有效断点时
 *
 * @example 全宽 Mobile Hero
 * ```ts
 * const mobileHero = computeMobileBreakpoints({})
 * // 计算过程：
 * // 1. 原始物理宽度（MOBILE_PHYSICAL）: [1080, 1206, 1320]
 * // 2. 按 ratio=1.0 缩放: [1080, 1206, 1320]
 * // 3. roundStep=16 向上取整: [1088, 1216, 1328]
 * // 4. 封顶到 maxWidth=1320: [1088, 1216, 1320]
 * // => { widths: [1088, 1216, 1320] }
 * ```
 *
 * @example 30% 宽 Mobile 卡片
 * ```ts
 * const mobileCard = computeMobileBreakpoints({ ratio: 0.3 })
 * // 计算过程：
 * // 1. 原始物理宽度: [1080, 1206, 1320]
 * // 2. 按 ratio=0.3 缩放: [324, 361.8, 396]
 * // 3. roundStep=16 向上取整: [336, 368, 400]
 * // 4. 封顶到 upper=396: [336, 368, 396]
 * // => { widths: [336, 368, 396] }
 * ```
 *
 * @example 固定尺寸 Mobile 头像
 * ```ts
 * const mobileAvatar = computeMobileBreakpoints({ minWidth: 30, maxWidth: 100, roundStep: 1 })
 * // 计算过程：
 * // 1. 反推 ratio = 100 / 1320 ≈ 0.076
 * // 2. 原始物理宽度: [1080, 1206, 1320]
 * // 3. 按 ratio=0.076 缩放: [82.1, 91.7, 100.3]
 * // 4. roundStep=1 向上取整: [83, 92, 101]
 * // 5. 封顶到 maxWidth=100: [83, 92, 100]
 * // 6. 过滤 minWidth=30: [83, 92, 100]（都 >= 30）
 * // 7. 强制添加 minWidth=30 和 maxWidth=100: [30, 83, 92, 100]
 * // => { widths: [30, 83, 92, 100] }
 * ```
 */
export function computeMobileBreakpoints(opts: BreakpointOptions = {}): BreakpointResult {
  return computeBreakpointsInternal(opts, MOBILE_PHYSICAL, MOBILE_DESIGN_VIEWPORT_WIDTH);
}

/**
 * 内部实现函数（统一处理 Desktop 和 Mobile 的断点计算逻辑）
 *
 * @param opts - 断点配置选项
 * @param physicalList - 设备物理宽度数组（Desktop 或 Mobile）
 * @param defaultDesignViewportWidth - 默认设计稿视口宽度（Desktop: 3840, Mobile: 1320）
 * @returns 断点计算结果
 *
 * @internal
 */
function computeBreakpointsInternal(
  opts: BreakpointOptions,
  physicalList: readonly number[],
  defaultDesignViewportWidth: number
): BreakpointResult {
  const { minWidth, maxWidth, roundStep = 16, designViewportWidth } = opts;

  // 使用用户提供的 designViewportWidth，否则使用默认值
  const actualDesignViewportWidth = designViewportWidth ?? defaultDesignViewportWidth;

  // ============================================================
  // Step 1: 参数校验
  // ============================================================

  // 校验 1: maxWidth >= minWidth
  if (maxWidth !== undefined && minWidth !== undefined && maxWidth < minWidth) {
    throw new Error(
      `[computeBreakpoints] maxWidth (${maxWidth}) must be greater than or equal to minWidth (${minWidth})`
    );
  }

  // 校验 2: maxWidth <= designViewportWidth
  if (maxWidth !== undefined && maxWidth > actualDesignViewportWidth) {
    throw new Error(
      `[computeBreakpoints] maxWidth (${maxWidth}) must not exceed designViewportWidth (${actualDesignViewportWidth}). ` +
        `The image width cannot be larger than the design viewport width.`
    );
  }

  // ============================================================
  // Step 2: 确定 ratio 和最大宽度上限
  // ============================================================

  let ratio: number;
  let upper: number;

  if ("ratio" in opts && typeof opts.ratio === "number") {
    // 场景 1: 传递了 ratio 参数
    ratio = opts.ratio;

    // 最大宽度：优先使用 maxWidth，否则按比例计算，但不超过 actualDesignViewportWidth
    if (maxWidth !== undefined) {
      upper = maxWidth;
    } else {
      upper = Math.min(actualDesignViewportWidth * ratio, actualDesignViewportWidth);
    }
  } else if (maxWidth !== undefined) {
    // 场景 2: 没传 ratio，但传了 maxWidth → 从 actualDesignViewportWidth 反推 ratio
    // 注意：此时 maxWidth 已经通过 Step 1 的校验，确保 maxWidth <= actualDesignViewportWidth

    ratio = maxWidth / actualDesignViewportWidth;
    upper = maxWidth;
  } else {
    // 场景 3: 都没传 → 默认 100% 宽度
    ratio = 1.0;
    upper = actualDesignViewportWidth;
  }

  // 重要：确保 upper 是整数（向下取整，避免断点数组中出现小数）
  // 例如：ratio=0.01 时，3840 × 0.01 = 38.4，应该向下取整到 38
  // 这是一个关键的 bug 修复，确保所有断点都是整数像素值
  upper = Math.floor(upper);

  // ============================================================
  // Step 3: 计算目标物理宽度（按 ratio 缩放）
  // ============================================================

  const targetPhysical = physicalList.map((w) => w * ratio);

  // ============================================================
  // Step 4: 应用约束、取整、去重
  // ============================================================

  const uniq = new Set<number>();

  for (const w of targetPhysical) {
    // 4.1 向上取整到 roundStep 的倍数
    const rounded = Math.max(1, ceilToStep(w, roundStep));

    // 4.2 封顶到最大宽度
    // 重要：确保断点不超过用户指定的最大宽度（因为取整可能超过 upper）
    const final = Math.min(rounded, upper);

    // 4.3 应用最小宽度约束（在取整后过滤，确保取整后的值 >= minWidth）
    if (minWidth !== undefined && final < minWidth) {
      continue; // 跳过此断点
    }

    // 4.4 去重（使用 Set 自动去重）
    uniq.add(final);
  }

  // ============================================================
  // Step 5: 强制包含用户指定的关键断点
  // ============================================================

  // 如果用户明确指定了 minWidth，将其作为关键断点添加到结果中
  // 原因：用户指定的最小宽度通常是其业务场景中的重要尺寸
  // 注意：Set 会自动去重，即使 minWidth 已存在也不会重复添加
  if (minWidth !== undefined) {
    uniq.add(minWidth);
  }

  // 如果用户明确指定了 maxWidth，将其作为关键断点添加到结果中
  // 原因：用户指定的最大宽度通常是其业务场景中的重要尺寸
  // 注意：Set 会自动去重，即使 maxWidth 已存在也不会重复添加
  if (maxWidth !== undefined) {
    uniq.add(maxWidth);
  }

  // ============================================================
  // Step 6: 排序并转换为数组
  // ============================================================

  const final = Array.from(uniq).sort((a, b) => a - b);

  // ============================================================
  // Step 7: 错误检查（约束后无有效断点）
  // ============================================================

  if (final.length === 0) {
    throw new Error(
      `[computeBreakpoints] No valid breakpoints generated with current constraints. Please check parameters:\n` +
        `  - ratio: ${"ratio" in opts ? opts.ratio : "not provided (default 1.0)"}\n` +
        `  - maxWidth: ${maxWidth ?? defaultMaxWidth} (${maxWidth === undefined ? "default" : "provided"})\n` +
        `  - minWidth: ${minWidth ?? "none"} (${minWidth === undefined ? "default" : "provided"})\n` +
        `  - roundStep: ${roundStep}\n` +
        `Hint: minWidth may be too large, or maxWidth may be too small`
    );
  }

  // ============================================================
  // Step 8: 返回结果
  // ============================================================

  return { widths: final };
}
````

---

**使用示例**：

```ts
// ============================================================
// Desktop 站点示例
// ============================================================

// 示例 1: 全宽 Hero Banner（最大 3840px）
const heroDesktop = computeDesktopBreakpoints({});
// => { widths: [1600, 1680, 1920, 2048, 2560, 2880, 3456, 3840] }

// 示例 2: 30% 宽卡片缩略图
const cardDesktop = computeDesktopBreakpoints({ ratio: 0.3 });
// => { widths: [480, 512, 576, 624, 768, 864, 1040, 1152] }

// 示例 3: 最大宽度 1500px（自动反推 ratio ≈ 0.39）
const mediumDesktop = computeDesktopBreakpoints({ maxWidth: 1500 });
// 内部计算: ratio = 1500 / 3840 ≈ 0.391
// => { widths: [640, 656, 752, 816, 1008, 1136, 1360, 1500] }

// 示例 4: 50% 宽侧栏图片，最大 2000px
const sidebarDesktop = computeDesktopBreakpoints({
  ratio: 0.5,
  maxWidth: 2000,
});
// => { widths: [800, 848, 960, 1024, 1280, 1440, 1728, 1920, 2000] }
// 注意：2000 作为用户指定的 maxWidth，必定出现在结果中

// 示例 5: 响应式产品缩略图（显式 ratio + 尺寸范围）
const productThumb = computeDesktopBreakpoints({
  ratio: 0.25,
  minWidth: 300,
  maxWidth: 800,
});
// => { widths: [300, 400, 432, 480, 512, 640, 720, 800] }
// 注意：300 和 800 作为用户指定的关键断点，必定出现在结果中

// 示例 6: 头像图片（30-100px）
const avatarDesktop = computeDesktopBreakpoints({
  minWidth: 30,
  maxWidth: 100,
  roundStep: 1,
});
// 内部计算: ratio = 100 / 3840 ≈ 0.026
// => { widths: [30, 42, 44, 50, 54, 67, 75, 90, 100] }
// 注意：30 和 100 作为用户指定的关键断点，必定出现在结果中

// 示例 7: 自定义取整步进
const customStep = computeDesktopBreakpoints({
  ratio: 0.3,
  roundStep: 8,
});
// => { widths: [480, 504, 576, 616, 768, 864, 1040, 1152] }
// 注：1668 × 0.3 = 500.4 → 向上取整到 8 的倍数 = 504

// 示例 8: 支持 5K 显示器（iMac 5K, Pro Display XDR @Retina）
const hero5K = computeDesktopBreakpoints({ designViewportWidth: 5120 });
// => { widths: [1600, 1680, 1920, 2048, 2560, 2880, 3456, 3840, 5120] }
// 注：包含 5120px 断点，可为 5K 显示器提供原生分辨率图片

// 示例 9: 支持 6K 显示器（Pro Display XDR Native）
const hero6K = computeDesktopBreakpoints({ designViewportWidth: 6016 });
// => { widths: [1600, 1680, 1920, 2048, 2560, 2880, 3456, 3840, 5120, 6016] }
// 注：包含完整的 10 个断点，覆盖所有设备

// 示例 10: 5K 显示器 + 30% 宽卡片
const card5K = computeDesktopBreakpoints({
  ratio: 0.3,
  designViewportWidth: 5120,
});
// => { widths: [480, 512, 576, 624, 768, 864, 1040, 1152, 1536] }
// 注：5120 × 0.3 = 1536，自动包含更大的断点

// ============================================================
// Mobile 站点示例
// ============================================================

// 示例 11: 全宽 Mobile Hero Banner
const heroMobile = computeMobileBreakpoints({});
// => { widths: [1088, 1216, 1320] }
// 注：1080 → 1088, 1206 → 1216, 1328 封顶到 1320

// 示例 12: 30% 宽 Mobile 卡片缩略图
const cardMobile = computeMobileBreakpoints({ ratio: 0.3 });
// => { widths: [336, 368, 396] }
// 计算过程:
// - 1080 × 0.3 = 324 → 向上取整 = 336
// - 1206 × 0.3 = 361.8 → 向上取整 = 368
// - 1320 × 0.3 = 396 → 向上取整 = 400 → 封顶到 396

// 示例 13: Mobile 头像（30-100px）
const avatarMobile = computeMobileBreakpoints({
  minWidth: 30,
  maxWidth: 100,
  roundStep: 1,
});
// 内部计算: ratio = 100 / 1320 ≈ 0.076
// => { widths: [30, 83, 92, 100] }
// 计算过程:
// - 1080 × 0.076 ≈ 82.1 → 向上取整到1 = 83
// - 1206 × 0.076 ≈ 91.7 → 向上取整到1 = 92
// - 1320 × 0.076 ≈ 100.3 → 向上取整到1 = 101 → 封顶到100
// - 强制添加 minWidth=30（作为关键断点）
// 注意：30 和 100 作为用户指定的关键断点，必定出现在结果中

// 示例 14: 最大宽度 800px（自动反推 ratio）
const mediumMobile = computeMobileBreakpoints({ maxWidth: 800 });
// 内部计算: ratio = 800 / 1320 ≈ 0.606
// => { widths: [656, 736, 800] }

// ============================================================
// 边界情况与错误处理
// ============================================================

// 示例 15: 错误 - maxWidth < minWidth
try {
  computeDesktopBreakpoints({ minWidth: 2000, maxWidth: 1000 });
} catch (error) {
  console.error(error.message);
  // => [computeBreakpoints] maxWidth (1000) 必须大于等于 minWidth (2000)
}

// 示例 16: 错误 - 约束条件导致无有效断点
try {
  computeDesktopBreakpoints({ minWidth: 5000, maxWidth: 6000 });
} catch (error) {
  console.error(error.message);
  // => [computeBreakpoints] 根据当前约束条件无法生成有效断点...
}
```

---

**注释说明**：

1. **设备矩阵与默认行为**：`DESKTOP_PHYSICAL` 包含完整的 10 个物理宽度断点（1600-6016），但默认情况下（`designViewportWidth=3840`），断点会被封顶到 3840，实际使用 8 个断点。这样既保持了默认行为的高效性，又允许通过 `designViewportWidth` 参数灵活支持 5K/6K 显示器。

2. **取整行为**：`DESKTOP_PHYSICAL` 中的 1668 在 `roundStep=16` 时会向上取整到 1680。如果需要保留原值，可设置 `roundStep=1`。

3. **固定尺寸场景**：对于头像、Logo 等固定尺寸图片，建议：
   - 设置 `minWidth` 和 `maxWidth` 相同（如 `{ minWidth: 100, maxWidth: 100 }`）
   - 使用 `roundStep=1` 避免取整偏差
   - 或者直接传递 `maxWidth` 让函数自动反推 `ratio`

4. **sizes 属性说明**：`sizes` 属性描述图片的 **CSS 显示宽度**，应由开发者根据实际的 CSS 布局指定。工具函数只生成物理像素断点（`widths`），不自动生成 `sizes`。开发者需要根据响应式布局需求手动指定，例如：
   - 全宽图片：`sizes="100vw"`
   - 固定比例：`sizes="30vw"`
   - 复杂响应式：`sizes="(min-width: 1024px) 50vw, 100vw"`

5. **推荐参数组合**：
   - **全宽图片**：`{}`（默认）
   - **按比例图片**：`{ ratio: 0.3 }` 或 `{ ratio: 0.5 }`
   - **自动推断**：`{ maxWidth: 1500 }` （让函数反推 ratio）
   - **固定尺寸**：`{ minWidth: 100, maxWidth: 100, roundStep: 1 }`
   - **大图过滤**：`{ minWidth: 800 }`（过滤掉小断点）
   - **5K/6K 显示器**：`{ designViewportWidth: 5120 }` 或 `{ designViewportWidth: 6016 }`

---

## 5. 方案实现（代码与输出）— 双站点 × 三场景

> 下文通过三个典型场景演示完整的实现方法。示例均给出完整 `srcset`，文件名仅示意（实际构建会带 hash）。高度以 **16:9** 举例（2160 for 3840, 648 for 1152, etc.），实际项目请按设计稿比例调整。

### 5.1 Desktop 站点（覆盖 Tablet + Laptop + Desktop）

#### 演示场景 1：视口 100% 宽（如 Hero Banner）

**设计交付**：

- **原图尺寸**：16:9 → **3840×2160 JPEG（sRGB，质量 90–95）**
- **非 16:9**：宽 3840、高按比例

**断点计算**：

```ts
const { widths } = computeDesktopBreakpoints({});
// 计算过程：
// 1. 原始物理宽度: [1600, 1668, 1920, 2048, 2560, 2880, 3456, 3840]
// 2. roundStep=16 取整: [1600, 1680, 1920, 2048, 2560, 2880, 3456, 3840]
// widths: [1600, 1680, 1920, 2048, 2560, 2880, 3456, 3840]
```

**sizes 属性说明**：

- `sizes` 属性描述图片的 **CSS 显示宽度**，应由开发者根据实际布局指定
- 对于全宽图片，使用 `sizes="100vw"`

**Astro 组件 - `<Picture>`**：

```astro
---
import { Picture } from "astro:assets";
import hero from "../assets/hero-desktop.jpg";
const WIDTHS = [1600, 1680, 1920, 2048, 2560, 2880, 3456, 3840];
---

<Picture src={hero} alt="Hero banner" widths={WIDTHS} formats={["avif", "webp", "jpeg"]} sizes="100vw" />
```

**生成的 HTML**：

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

**Astro 组件 - `<Image>`**：

```astro
---
import { Image } from "astro:assets";
import hero from "../assets/hero-desktop.jpg";
const WIDTHS = [1600, 1680, 1920, 2048, 2560, 2880, 3456, 3840];
---

<Image src={hero} alt="Hero banner" format="webp" widths={WIDTHS} sizes="100vw" />
```

**生成的 HTML**：

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

**设备映射表（Desktop 站点 - 100% 宽）**：

| 设备分类           | Device ID           | Physical Width | CSS Width | 浏览器选择（Picture/AVIF） | 浏览器选择（Image/WebP） |
| ------------------ | ------------------- | -------------: | --------: | -------------------------- | ------------------------ |
| Tablet S           | `tablet-small`      |           1600 |       533 | `hero-1600.avif`           | `hero-1600.webp`         |
| Tablet M           | `tablet-medium`     |           1668 |       834 | `hero-1680.avif`           | `hero-1680.webp`         |
| Tablet L           | `tablet-large`      |           2048 |      1024 | `hero-2048.avif`           | `hero-2048.webp`         |
| Laptop S           | `laptop-small`      |           1920 | 1280-1920 | `hero-1920.avif`           | `hero-1920.webp`         |
| Laptop M           | `laptop-medium`     |           2560 | 1280-1664 | `hero-2560.avif`           | `hero-2560.webp`         |
| Laptop L           | `laptop-large`      |           2880 | 1440-1512 | `hero-2880.avif`           | `hero-2880.webp`         |
| Laptop XL          | `laptop-xlarge`     |           3456 |      1728 | `hero-3456.avif`           | `hero-3456.webp`         |
| Desktop 2K         | `desktop-2k`        |           2560 |      2560 | `hero-2560.avif`           | `hero-2560.webp`         |
| Desktop 4K         | `desktop-4k`        |           3840 |      3840 | `hero-3840.avif`           | `hero-3840.webp`         |
| Desktop 4K @1.5x   | `desktop-4k-1.5x`   |           3840 |      2560 | `hero-3840.avif`           | `hero-3840.webp`         |
| Desktop 4K @Retina | `desktop-4k-retina` |      5120→3840 |      2560 | `hero-3840.avif`           | `hero-3840.webp`         |
| Desktop 6K         | `desktop-6k`        |      6016→3840 |      6016 | `hero-3840.avif`           | `hero-3840.webp`         |

**注**：

- 浏览器根据 `sizes="100vw"` 和当前视口宽度，从 `srcset` 中选择最接近且不小于需要宽度的候选
- 本演示场景中，图片在 3840 设计稿中为全宽（3840px），因此最大导出 3840 宽度的图片
- Desktop 4K @Retina 和 Desktop 6K 虽然物理宽度更大（5120/6016），但由于设计稿基准为 3840，所以选择 3840.avif
- Tablet M (1668px) 会选择 1680.avif（向上取整的结果）

---

#### 演示场景 2：视口 30% 宽（如卡片缩略图）

**设计交付**：

- **原图尺寸**：16:9 → **1152×648 JPEG（sRGB，质量 90–95）**
- **非 16:9**：宽 1152、高按比例

**断点计算**：

```ts
const { widths } = computeDesktopBreakpoints({ ratio: 0.3 });
// 计算过程：
// 1. 原始物理宽度: [1600, 1668, 1920, 2048, 2560, 2880, 3456, 3840]
// 2. 按 ratio=0.3 缩放: [480, 500.4, 576, 614.4, 768, 864, 1036.8, 1152]
// 3. roundStep=16 取整: [480, 512, 576, 624, 768, 864, 1040, 1152]
// widths: [480, 512, 576, 624, 768, 864, 1040, 1152]
```

**sizes 属性说明**：

- 对于占视口 30% 宽度的图片，使用 `sizes="30vw"`

**Astro 组件 - `<Picture>`**：

```astro
---
import { Picture } from "astro:assets";
import card from "../assets/card-desktop.jpg";
const WIDTHS = [480, 512, 576, 624, 768, 864, 1040, 1152];
---

<Picture src={card} alt="Card thumbnail" widths={WIDTHS} formats={["avif", "webp", "jpeg"]} sizes="30vw" />
```

**生成的 HTML**：

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

**Astro 组件 - `<Image>`**：

```astro
---
import { Image } from "astro:assets";
import card from "../assets/card-desktop.jpg";
const WIDTHS = [480, 512, 576, 624, 768, 864, 1040, 1152];
---

<Image src={card} alt="Card thumbnail" format="webp" widths={WIDTHS} sizes="30vw" />
```

**生成的 HTML**：

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

**设备映射表（Desktop 站点 - 30% 宽）**：

| 设备分类           | Device ID           | Physical Width | CSS Width | 浏览器选择（Picture/AVIF） | 浏览器选择（Image/WebP） |
| ------------------ | ------------------- | -------------: | --------: | -------------------------- | ------------------------ |
| Tablet S           | `tablet-small`      |           1600 |       533 | `card-480.avif`            | `card-480.webp`          |
| Tablet M           | `tablet-medium`     |           1668 |       834 | `card-512.avif`            | `card-512.webp`          |
| Tablet L           | `tablet-large`      |           2048 |      1024 | `card-624.avif`            | `card-624.webp`          |
| Laptop S           | `laptop-small`      |           1920 | 1280-1920 | `card-576.avif`            | `card-576.webp`          |
| Laptop M           | `laptop-medium`     |           2560 | 1280-1664 | `card-768.avif`            | `card-768.webp`          |
| Laptop L           | `laptop-large`      |           2880 | 1440-1512 | `card-864.avif`            | `card-864.webp`          |
| Laptop XL          | `laptop-xlarge`     |           3456 |      1728 | `card-1040.avif`           | `card-1040.webp`         |
| Desktop 2K         | `desktop-2k`        |           2560 |      2560 | `card-768.avif`            | `card-768.webp`          |
| Desktop 4K         | `desktop-4k`        |           3840 |      3840 | `card-1152.avif`           | `card-1152.webp`         |
| Desktop 4K @1.5x   | `desktop-4k-1.5x`   |           3840 |      2560 | `card-1152.avif`           | `card-1152.webp`         |
| Desktop 4K @Retina | `desktop-4k-retina` |      5120→3840 |      2560 | `card-1152.avif`           | `card-1152.webp`         |
| Desktop 6K         | `desktop-6k`        |      6016→3840 |      6016 | `card-1152.avif`           | `card-1152.webp`         |

**计算说明**：

- 浏览器根据 `sizes="30vw"` 计算实际显示宽度 = 视口宽度 × 0.3
- 如 Tablet M (CSS 834px)：显示宽度 = 834 × 0.3 × 2 (DPR) ≈ 500px → 选择 512.avif
- 如 Desktop 4K (CSS 3840px)：显示宽度 = 3840 × 0.3 × 1 (DPR) = 1152px → 选择 1152.avif

---

#### 演示场景 3：固定尺寸 30–100px（如头像/图标）

**设计交付**：

- **原图尺寸**：**100×100 PNG**（或无损 WebP；摄影头像可用 JPEG 90–95）

**断点计算**：

```ts
const { widths } = computeDesktopBreakpoints({
  minWidth: 30,
  maxWidth: 100,
  roundStep: 1,
});
// 计算过程：
// 1. 反推 ratio = 100 / 3840 ≈ 0.026
// 2. 原始物理宽度: [1600, 1668, 1920, 2048, 2560, 2880, 3456, 3840]
// 3. 按 ratio=0.026 缩放: [41.6, 43.4, 50.0, 53.2, 66.6, 74.9, 89.9, 100.0]
// 4. roundStep=1 取整: [42, 44, 50, 54, 67, 75, 90, 100]
// 5. 强制添加 minWidth=30: [30, 42, 44, 50, 54, 67, 75, 90, 100]
// widths: [30, 42, 44, 50, 54, 67, 75, 90, 100]
```

**sizes 属性说明**：

- 本场景使用**固定 CSS 尺寸** `25px` 来演示响应式优化的核心价值
- 即使开发者只指定了一个固定的 CSS 尺寸，组件也会根据不同设备的 **DPR** 自动选择最优的物理分辨率图片
- 这样无需编写复杂的响应式逻辑，组件会自动为 DPR=1/1.5/2/3 的设备提供 30/42/50/75 等不同物理分辨率的图片

**Astro 组件 - `<Picture>`**：

```astro
---
import { Picture } from "astro:assets";
import avatar from "../assets/avatar.png";
const WIDTHS = [30, 42, 44, 50, 54, 67, 75, 90, 100];
---

<Picture src={avatar} alt="User avatar" widths={WIDTHS} formats={["avif", "webp", "png"]} sizes="25px" />
```

**生成的 HTML**：

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

**Astro 组件 - `<Image>`**：

```astro
---
import { Image } from "astro:assets";
import avatar from "../assets/avatar.png";
const WIDTHS = [30, 42, 44, 50, 54, 67, 75, 90, 100];
---

<Image src={avatar} alt="User avatar" format="webp" widths={WIDTHS} sizes="25px" />
```

**生成的 HTML**：

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

**设备映射表（Desktop 站点 - 方形 30–100）**：

| 设备分类           | Device ID           | Physical Width | CSS Width | DPR | 需要宽度 (25px × DPR) | 浏览器选择（Picture/AVIF） | 浏览器选择（Image/WebP） |
| ------------------ | ------------------- | -------------: | --------: | --: | --------------------- | -------------------------- | ------------------------ |
| Tablet S           | `tablet-small`      |           1600 |       533 |   3 | 25×3 = 75             | `avatar-75.avif`           | `avatar-75.webp`         |
| Tablet M           | `tablet-medium`     |           1668 |       834 |   2 | 25×2 = 50             | `avatar-50.avif`           | `avatar-50.webp`         |
| Tablet L           | `tablet-large`      |           2048 |      1024 |   2 | 25×2 = 50             | `avatar-50.avif`           | `avatar-50.webp`         |
| Laptop S           | `laptop-small`      |           1920 | 1280-1920 | 1.5 | 25×1.5 = 37.5         | `avatar-42.avif`           | `avatar-42.webp`         |
| Laptop M           | `laptop-medium`     |           2560 | 1280-1664 |   2 | 25×2 = 50             | `avatar-50.avif`           | `avatar-50.webp`         |
| Laptop L           | `laptop-large`      |           2880 | 1440-1512 |   2 | 25×2 = 50             | `avatar-50.avif`           | `avatar-50.webp`         |
| Laptop XL          | `laptop-xlarge`     |           3456 |      1728 |   2 | 25×2 = 50             | `avatar-50.avif`           | `avatar-50.webp`         |
| Desktop 2K         | `desktop-2k`        |           2560 |      2560 |   1 | 25×1 = 25             | `avatar-30.avif`           | `avatar-30.webp`         |
| Desktop 4K         | `desktop-4k`        |           3840 |      3840 |   1 | 25×1 = 25             | `avatar-30.avif`           | `avatar-30.webp`         |
| Desktop 4K @1.5x   | `desktop-4k-1.5x`   |           3840 |      2560 | 1.5 | 25×1.5 = 37.5         | `avatar-42.avif`           | `avatar-42.webp`         |
| Desktop 4K @Retina | `desktop-4k-retina` |      5120→3840 |      2560 |   2 | 25×2 = 50             | `avatar-50.avif`           | `avatar-50.webp`         |
| Desktop 6K         | `desktop-6k`        |      6016→3840 |      6016 |   1 | 25×1 = 25             | `avatar-30.avif`           | `avatar-30.webp`         |

**说明**：

- 使用固定尺寸 `sizes="25px"`，所有设备的 CSS 显示尺寸都是 25px
- **响应式优化的价值体现**：组件会根据不同设备的 DPR 自动选择最优图片：
  - **DPR = 3**（如 Tablet S）：需要 75px 物理宽度 → 选择 `avatar-75.avif`
  - **DPR = 2**（如多数笔记本）：需要 50px 物理宽度 → 选择 `avatar-50.avif`
  - **DPR = 1.5**（如部分笔记本）：需要 37.5px 物理宽度 → 选择 `avatar-42.avif`
  - **DPR = 1**（如桌面显示器）：需要 25px 物理宽度 → 选择 `avatar-30.avif`
- 这说明：即使开发者只写了一个简单的固定尺寸，组件也能自动为不同 DPR 的设备提供最优的图片分辨率

---

### 5.2 Mobile 站点（覆盖 Mobile）

#### 演示场景 1：视口 100% 宽（如 Hero Banner）

**设计交付**：

- **原图尺寸**：16:9 → **1320×743 JPEG（sRGB，质量 90–95）**
- **非 16:9**：宽 1320、高按比例

**断点计算**：

```ts
const { widths } = computeMobileBreakpoints({});
// 计算过程：
// 1. 原始物理宽度: [1080, 1206, 1320]
// 2. roundStep=16 取整: [1088, 1216, 1328]
// 3. 封顶到 maxWidth=1320: [1088, 1216, 1320]
// widths: [1088, 1216, 1320]
```

**sizes 属性说明**：

- 对于全宽图片，使用 `sizes="100vw"`

**Astro 组件 - `<Picture>`**：

```astro
---
import { Picture } from "astro:assets";
import hero from "../assets/hero-mobile.jpg";
const WIDTHS = [1088, 1216, 1320];
---

<Picture src={hero} alt="Hero banner" widths={WIDTHS} formats={["avif", "webp", "jpeg"]} sizes="100vw" />
```

**生成的 HTML**：

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

**Astro 组件 - `<Image>`**：

```astro
---
import { Image } from "astro:assets";
import hero from "../assets/hero-mobile.jpg";
const WIDTHS = [1088, 1216, 1320];
---

<Image src={hero} alt="Hero banner" format="webp" widths={WIDTHS} sizes="100vw" />
```

**生成的 HTML**：

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

**设备映射表（Mobile 站点 - 100% 宽）**：

| 设备分类 | Device ID       | Physical Width | CSS Width | DPR | 浏览器选择（Picture/AVIF） | 浏览器选择（Image/WebP） |
| -------- | --------------- | -------------: | --------: | --: | -------------------------- | ------------------------ |
| Mobile S | `mobile-small`  |           1080 |       360 |   3 | `hero-1088.avif`           | `hero-1088.webp`         |
| Mobile M | `mobile-medium` |           1206 |       402 |   3 | `hero-1216.avif`           | `hero-1216.webp`         |
| Mobile L | `mobile-large`  |           1320 |       440 |   3 | `hero-1320.avif`           | `hero-1320.webp`         |

**注**：

- Mobile M (1206px) 的断点在 roundStep=16 时向上取整到 1216
- 浏览器会根据 DPR=3 和 CSS 宽度计算需要的物理宽度，从 srcset 中选择

---

#### 演示场景 2：视口 30% 宽（如卡片缩略图）

**设计交付**：

- **原图尺寸**：16:9 → **400×225 JPEG（sRGB，质量 90–95）**
- **非 16:9**：宽 400、高按比例

**断点计算**：

```ts
const { widths } = computeMobileBreakpoints({ ratio: 0.3 });
// 计算过程：
// 1. 原始物理宽度: [1080, 1206, 1320]
// 2. 按 ratio=0.3 缩放: [324, 361.8, 396]
// 3. roundStep=16 取整: [336, 368, 400]
// 4. 封顶到 upper=396: [336, 368, 396]
// widths: [336, 368, 396]
```

**sizes 属性说明**：

- 对于占视口 30% 宽度的图片，使用 `sizes="30vw"`

**Astro 组件 - `<Picture>`**：

```astro
---
import { Picture } from "astro:assets";
import card from "../assets/card-mobile.jpg";
const WIDTHS = [336, 368, 396];
---

<Picture src={card} alt="Card thumbnail" widths={WIDTHS} formats={["avif", "webp", "jpeg"]} sizes="30vw" />
```

**生成的 HTML**：

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

**Astro 组件 - `<Image>`**：

```astro
---
import { Image } from "astro:assets";
import card from "../assets/card-mobile.jpg";
const WIDTHS = [336, 368, 396];
---

<Image src={card} alt="Card thumbnail" format="webp" widths={WIDTHS} sizes="30vw" />
```

**生成的 HTML**：

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

**设备映射表（Mobile 站点 - 30% 宽）**：

| 设备分类 | Device ID       | Physical Width | CSS Width | DPR | 浏览器选择（Picture/AVIF） | 浏览器选择（Image/WebP） |
| -------- | --------------- | -------------: | --------: | --: | -------------------------- | ------------------------ |
| Mobile S | `mobile-small`  |           1080 |       360 |   3 | `card-336.avif`            | `card-336.webp`          |
| Mobile M | `mobile-medium` |           1206 |       402 |   3 | `card-368.avif`            | `card-368.webp`          |
| Mobile L | `mobile-large`  |           1320 |       440 |   3 | `card-396.avif`            | `card-396.webp`          |

**计算说明**：

- Mobile S (CSS 360px)：显示宽度 = 360 × 0.3 × 3 (DPR) = 324px → 选择 336.avif
- Mobile M (CSS 402px)：显示宽度 = 402 × 0.3 × 3 (DPR) ≈ 362px → 选择 368.avif
- Mobile L (CSS 440px)：显示宽度 = 440 × 0.3 × 3 (DPR) = 396px → 选择 396.avif

---

#### 演示场景 3：固定尺寸 30–100px（如头像/图标）

**设计交付**：

- **原图尺寸**：**100×100 PNG**（或无损 WebP；摄影头像可用 JPEG 90–95）

**断点计算**：

```ts
const { widths } = computeMobileBreakpoints({
  minWidth: 30,
  maxWidth: 100,
  roundStep: 1,
});
// 计算过程：
// 1. 反推 ratio = 100 / 1320 ≈ 0.076
// 2. 原始物理宽度: [1080, 1206, 1320]
// 3. 按 ratio=0.076 缩放: [82.1, 91.7, 100.3]
// 4. roundStep=1 取整: [83, 92, 101]
// 5. 封顶到 maxWidth=100: [83, 92, 100]
// 6. 强制添加 minWidth=30: [30, 83, 92, 100]
// widths: [30, 83, 92, 100]
```

**sizes 属性说明**：

- 本场景使用**固定 CSS 尺寸** `28px` 来演示响应式优化的效果
- 即使开发者只指定了一个固定的 CSS 尺寸，组件也会根据不同设备的 **DPR** 自动选择最优的物理分辨率图片
- 但需注意：由于所有 Mobile 设备的 DPR 都是 3，不同 Mobile 设备间的差异主要体现在**原始物理宽度的差异**上

**Astro 组件 - `<Picture>`**：

```astro
---
import { Picture } from "astro:assets";
import avatar from "../assets/avatar.png";
const WIDTHS = [30, 83, 92, 100];
---

<Picture src={avatar} alt="User avatar" widths={WIDTHS} formats={["avif", "webp", "png"]} sizes="28px" />
```

**生成的 HTML**：

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

**Astro 组件 - `<Image>`**：

```astro
---
import { Image } from "astro:assets";
import avatar from "../assets/avatar.png";
const WIDTHS = [30, 83, 92, 100];
---

<Image src={avatar} alt="User avatar" format="webp" widths={WIDTHS} sizes="28px" />
```

**生成的 HTML**：

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

**设备映射表（Mobile 站点 - 方形 30–100）**：

| 设备分类 | Device ID       | Physical Width | CSS Width | DPR | 需要宽度 (28px × DPR) | 浏览器选择（Picture/AVIF） | 浏览器选择（Image/WebP） |
| -------- | --------------- | -------------: | --------: | --: | --------------------- | -------------------------- | ------------------------ |
| Mobile S | `mobile-small`  |           1080 |       360 |   3 | 28×3 = 84             | `avatar-92.avif`           | `avatar-92.webp`         |
| Mobile M | `mobile-medium` |           1206 |       402 |   3 | 28×3 = 84             | `avatar-92.avif`           | `avatar-92.webp`         |
| Mobile L | `mobile-large`  |           1320 |       440 |   3 | 28×3 = 84             | `avatar-92.avif`           | `avatar-92.webp`         |

**说明**：

- 使用固定尺寸 `sizes="28px"`，所有 Mobile 设备的 CSS 显示尺寸都是 28px
- 浏览器计算需要的物理宽度：28px × DPR(3) = 84px
- 从 srcset `[30, 83, 92, 100]` 中选择：≥84 的最小候选是 **92**
- **关于 Mobile 响应式的局限性**：
  - 由于所有 Mobile 设备的 DPR 都是 3，它们在固定尺寸场景下需要的物理宽度相同（都是 84px）
  - 因此它们都选择了相同的图片（`avatar-92`），无法像 Desktop 设备那样体现明显的响应式差异
  - 这说明：对于 Mobile 设备，响应式图片优化在**全宽或比例布局场景**（场景1和场景2）中更有价值

---

## 6. 验证与排错（How to Verify）

### 6.1 浏览器 DevTools 验证

**Network 面板操作步骤**：

1. 打开 DevTools → Network 面板
2. 筛选图片资源（Filter: `Img` 或 `image`）
3. 刷新页面，观察加载的图片文件名和尺寸
4. 检查：
   - 图片文件名中的宽度是否与预期的 `widths` 数组匹配
   - 图片格式是否按 `<Picture>` 中的 `formats` 顺序 fallback（AVIF → WebP → JPEG/PNG）
   - 文件大小是否合理（过大可能选择了错误的候选）

**Console 验证**：

```js
// 检查视口和 DPR 信息
console.log("Viewport Width (CSS):", window.innerWidth);
console.log("DPR:", window.devicePixelRatio);
console.log("Physical Width:", window.innerWidth * window.devicePixelRatio);

// 检查图片实际加载情况
const img = document.querySelector('img[alt="Hero banner"]');
console.log("sizes:", img.sizes);
console.log("currentSrc:", img.currentSrc);
console.log("naturalWidth:", img.naturalWidth);
console.log("displayWidth:", img.width);
```

### 6.2 常见问题排查

| 问题              | 原因                       | 解决方案                                                |
| ----------------- | -------------------------- | ------------------------------------------------------- |
| 图片模糊          | 选择的候选宽度小于实际需要 | 检查 `sizes` 是否正确；检查 srcset 是否包含足够大的候选 |
| 带宽浪费          | 选择的候选宽度过大         | 检查 `sizes` 是否写大了；检查是否有过多的大尺寸候选     |
| 浏览器不选择 AVIF | 浏览器不支持 AVIF 格式     | 使用 `<Picture>` 提供 fallback 格式（WebP/JPEG）        |
| CLS（布局偏移）   | 缺少 width/height 属性     | Astro 会自动填充，检查生成的 HTML                       |
| `sizes` 不生效    | `sizes` 语法错误           | 检查 media query 语法；检查是否有拼写错误               |

### 6.3 设备测试建议

**优先级测试设备**：

- **Desktop**: Desktop 4K (3840 physical / 3840 CSS, DPR=1)
- **Laptop**: MacBook Pro 16″ (3456 physical / 1728 CSS, DPR=2)
- **Tablet**: iPad Pro 11″ (1668 physical / 834 CSS, DPR=2)
- **Mobile**: iPhone 17 Pro Max (1320 physical / 440 CSS, DPR=3), Galaxy S25 (1080 physical / 360 CSS, DPR=3)

**测试步骤**：

1. 在 DevTools 中切换设备模拟器
2. 刷新页面，观察 Network 面板加载的图片
3. 验证 `currentSrc` 是否匹配预期的候选宽度
4. 检查 `naturalWidth` 是否与 srcset 中的 `w` 描述符一致

---

## 7. Q & A

**Q1: 图片响应式优化与 CSS 响应式设计有何区别？**

A: 这是两个**不同领域**的响应式概念，但经常被混淆：

| 对比项   | 图片响应式优化（本文档）         | CSS 响应式设计                       |
| -------- | -------------------------------- | ------------------------------------ |
| **目标** | 优化图片资源，节省带宽           | 调整页面布局                         |
| **依据** | **Physical Width** (物理分辨率)  | **CSS Width** (逻辑分辨率)           |
| **技术** | `srcset` + `sizes`               | Media Queries (`@media`)             |
| **断点** | 基于物理宽度 (1088, 1216, 1320)  | 基于 CSS 宽度 (375px, 768px, 1024px) |
| **示例** | MacBook Air 13″ 加载 2560px 图片 | MacBook Air 13″ 使用 1280px 布局     |

**关键理解**：MacBook Air 13″ (CSS 1280px × DPR 2.0 = 2560px physical)

- **CSS 响应式**：使用 `@media (min-width: 1280px)` 判断布局，应用 Desktop 样式
- **图片响应式**：浏览器计算需要 2560px 物理宽度，从 `srcset` 中选择 2560w 的图片

这两者是**互补**的，不是替代关系：

- CSS 响应式解决"布局如何适配不同屏幕"
- 图片响应式解决"图片如何清晰且不浪费带宽"

**Q2: 何时用 `<Picture>` vs `<Image>`？**
A: 多格式（AVIF + WebP + JPEG → `<Picture>`；单格式（只要 WebP）→ `<Image>`。`<Picture>` 提供更好的浏览器兼容性，但生成的 HTML 更冗长。

**Q3: 为何采用离散断点，而不为每个设备精确生成图片？**
A: (1) **实际宽度会波动**：滚动条、侧栏、窗口非最大化等因素会使实际显示宽度偏离设备标称值；(2) **浏览器选择算法**：浏览器会自动选择最合适的候选图片（优先选择"最接近且不小于所需宽度"的候选，若所有候选都不够大则选择最大的候选），轻微的宽度差异（如 1668 vs 1680）对视觉效果影响极小；(3) **工程效率**：离散断点可将候选数量从数十个减少到 5-8 个，显著降低构建时间和存储成本。

**Q4: Mobile 站点如何覆盖 1088/1216/1320？**
A: 工具方法 `MOBILE_PHYSICAL` 定义为原始物理宽度 `[1080, 1206, 1320]`，roundStep=16 时会向上取整得到工程断点 `[1088, 1216, 1320]`（1080 → 1088, 1206 → 1216, 1320 保持不变）。

**Q5: 设计稿非 16:9 如何处理？**
A: 交付按设计比例导出，示例中的高度（如 2160, 648, 743）替换为实际值。Astro 会自动读取图片宽高并填充到 HTML。

**Q6: 设备矩阵中 Laptop 设备的 CSS 宽度为何是范围？**
A: 同一物理分辨率（如 1920×1080）在不同缩放比例（100%/150%）下，CSS 宽度不同。我们按物理宽度分类，CSS 宽度仅供参考。

**Q7: 如何处理 art direction（不同设备不同裁剪）？**
A: 使用 `<picture>` 的 media query 功能：

```astro
<picture>
  <source media="(min-width: 1024px)" srcset="hero-desktop.jpg" />
  <source media="(min-width: 640px)" srcset="hero-tablet.jpg" />
  <img src="hero-mobile.jpg" alt="..." />
</picture>
```

但本方案聚焦于同一图片的多尺寸输出，不涉及不同裁剪。

**Q8: 对于 DPR 为非整数（如 2.625）的设备，浏览器如何选择图片？**
A: 浏览器不关心 DPR 是整数还是小数，只关心计算出的**物理宽度**。

**案例：Google Pixel 9**（DPR 2.625, CSS 宽度 412px）

```text
需要的物理宽度 = 412 × 2.625 = 1081.5px
```

**我们的 Mobile 断点**: `[1088, 1216, 1320]`

浏览器选择过程：

1. 计算需要 1081.5px
2. 筛选 ≥ 1081.5px 的候选：`1088w`, `1216w`, `1320w`
3. 选择最小的：**`1088w`** ✅

**如果候选不够大**（假设只有 `[800, 1072]`）：

1. 计算需要 1081.5px
2. 筛选 ≥ 1081.5px 的候选：**无**
3. 降级选择最大的：**`1072w`** ⚠️
4. 图片会被轻微放大（1072 → 1081.5，放大约 0.89%），视觉影响极小

**为何我们的方案能覆盖不同 DPR**：

- DPR 3.0, CSS 360px → 1080px → 选 `1088w` ✅
- DPR 2.625, CSS 412px → 1081.5px → 选 `1088w` ✅
- DPR 3.0, CSS 402px → 1206px → 选 `1216w` ✅

关键：我们按**物理宽度**分类（1088/1216/1320），天然适配各种 DPR 值。

---

## 8. 版本历史

### v1.0 (2025-10-16)

- 📝 初始版本
- ✅ 基于 Device Matrix v2025.1 编写
- ✅ 定义设备矩阵（Mobile 3档 + Desktop 12档）
- ✅ 实现双站点分治（Desktop 站点 + Mobile 站点）
- ✅ 提供三类典型场景示例（全宽、30% 宽、固定尺寸）
- ✅ 提供断点计算工具方法（`computeDesktopBreakpoints` / `computeMobileBreakpoints`）
- ✅ 完整的设备映射表和浏览器选择验证
- ✅ 包含验证方法和 Q&A 章节

---

## 9. 参考资料

- [Astro Assets (Images)](https://docs.astro.build/en/guides/images/)
- [MDN: Responsive images](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)
- [Device Matrix v2025.1](/notes/zh/device-matrix-2025/)
- [Web.dev: Serve responsive images](https://web.dev/serve-responsive-images/)

---

**文档维护**: 本文档应随 Device Matrix 更新而同步更新。如发现设备矩阵与本文档不一致，请以最新版 Device Matrix 为准。
