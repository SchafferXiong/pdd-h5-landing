# V2 Hybrid（frontend-design + ux-designer）

## 框架分工
1. `frontend-design`：主视觉系统（字体、配色、舞台层次、镜头感动效）。
2. `ux-designer`：交互系统（4秒首屏路径、CTA优先级、可读性、触达效率）。

## 版本目标
1. 无视频素材前提下，提供“视频化体验”。
2. 跨行业可复用：同一模板可切换行业配置。
3. 保持短版 2-3 屏高转化结构。

## 文件
- `compare/output/v2-hybrid/index.html`
- `compare/output/v2-hybrid/styles.css`
- `compare/output/v2-hybrid/app.js`
- `compare/input/v2-universal-config.js`

## 行业切换
在 URL 追加参数：
- `?industry=ecommerce`
- `?industry=fintech`
- `?industry=education`
- `?industry=travel`
- `?industry=tools`

可选覆盖参数：
- `app`（应用名）
- `slogan`（副标题）
- `ctaText`（按钮文案）
- `cta`（下载链接）
- `logo`（logo 图片 URL）
