# Landing Compare Lab

## 本地预览
```bash
cd /Users/feng/Desktop/codexLandingPageConstructor
python3 -m http.server 8080
```

打开：
- Canonical: `http://localhost:8080/experiments/landing-compare-lab/variants/index.html`
- Legacy: `http://localhost:8080/compare/output/index.html`

## Canonical 目录
- `experiments/landing-compare-lab/inputs/`：统一输入包（图包 + 配置）
- `experiments/landing-compare-lab/variants/`：多版本页面输出
- `experiments/landing-compare-lab/analysis/`：评分、对比、方法论与历史审计

## 兼容目录（Legacy Alias）
- `compare/input -> experiments/landing-compare-lab/inputs`
- `compare/output -> experiments/landing-compare-lab/variants`
- `compare/report -> experiments/landing-compare-lab/analysis`

## 常用入口
- 版本入口页：`experiments/landing-compare-lab/variants/index.html`
- 统一配置：`experiments/landing-compare-lab/inputs/landing-config.json`
- 评分报告：`experiments/landing-compare-lab/analysis/scorecard.md`

## V2 行业切换参数
- 示例：`http://localhost:8080/experiments/landing-compare-lab/variants/prototype-v2-hybrid/index.html?industry=ecommerce`
- 支持：`ecommerce` / `fintech` / `education` / `travel` / `tools`
