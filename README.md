# qianwen-h5-fragment-to-essence

千问 App H5 落地页（移动端单页），核心叙事为“碎片变精华”。

## Canonical 目录
- `apps/h5-main/index.html`：主页面结构
- `apps/h5-main/assets/css/style.css`：视觉与动画样式
- `apps/h5-main/assets/js/app.js`：状态机、倒计时、播报、下载跳转
- `config/landing-audit.config.json`：审核配置
- `artifacts/landings/`：已产出的落地页快照
- `artifacts/audits/`：审核与迭代报告
- `experiments/landing-compare-lab/`：对比实验工作区
- `tools/`：脚本工具（`scripts/` 为兼容 wrapper）
- `docs/repository-index.md`：代码库索引说明
- `docs/path-rename-map.json`：旧新路径映射

## 兼容路径（Legacy Alias）
以下旧路径已保留为兼容别名，历史链接可继续打开：
- `index.html -> apps/h5-main/index.html`
- `assets -> apps/h5-main/assets`
- `generated_landings -> artifacts/landings`
- `audit_reports -> artifacts/audits`
- `compare -> experiments/landing-compare-lab`
- `landing-audit.config.json -> config/landing-audit.config.json`
- `DESIGN_NOTES.md -> docs/design-notes.md`

## 本地预览
```bash
cd /Users/feng/Desktop/codexLandingPageConstructor
python3 -m http.server 4173
# Canonical: http://127.0.0.1:4173/apps/h5-main/index.html
# Legacy:    http://127.0.0.1:4173/index.html
```

## 配置覆盖
页面支持通过全局对象 `window.__QIANWEN_H5_CONFIG` 覆盖默认配置。

```html
<script>
  window.__QIANWEN_H5_CONFIG = {
    downloadUrl: 'https://app.mi.com/details?id=com.aliyun.tongyi',
    trialSeconds: 119,
    brand: {
      name: '千问 App',
      iconUrl: '/assets/img/generated/qianwen-app-icon-192.png',
      iconAlt: '千问 App 图标'
    }
  };
</script>
```

## 下载参数透传规则
点击下载按钮时会透传：
- `src`
- `campaign`
- `channel`
- `utm_source`
- `utm_medium`
- `utm_campaign`

并追加：
- `lp_source`（如 `hero_ready`、`second_screen`、`sticky_bottom`）

## 审核与生成命令
```bash
npm run audit:lp
npm run audit:lp:strict
npm run landing:generate:audit
npm run links:verify
```

## 审核配置
- 配置文件：`config/landing-audit.config.json`
- 默认模式：`report_only`
- 默认目标：`http://127.0.0.1:4173/apps/h5-main/index.html`
- 审核输出根目录：`artifacts/audits/runs`

## 目录约定
- 新落地页：`artifacts/landings/<landingId>/index.html`
- 汇总迭代报告：`artifacts/audits/<landingId>/`
- 单轮审核报告：`artifacts/audits/runs/<landingId>/<runId>/`

## 说明
- 历史报告中记录的旧 `file://.../generated_landings/...` 与 `http://.../compare/output/...` 链接，依赖兼容别名继续可用。
- 若新增脚本，请优先放在 `tools/`，只有兼容目的才在 `scripts/` 新增 wrapper。
