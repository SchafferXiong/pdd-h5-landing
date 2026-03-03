# 四 Skill 对比版 H5（短版 2-3 屏）

## 本地预览
在仓库根目录启动静态服务：

```bash
python3 -m http.server 8080
```

打开：

- `http://localhost:8080/compare/output/index.html`

## 目录
- `compare/input/`：统一输入包（图包 + 配置）
- `compare/input/landing-config.js`：本地直开兜底配置（避免 `file://` 场景 fetch 失败）
- `compare/output/frontend-designer/`
- `compare/output/ui-designer/`
- `compare/output/ux-designer/`
- `compare/output/frontend-design-masterclass/`
- `compare/output/v2-hybrid/`：V2 融合版（`frontend-design` 视觉 + `ux-designer` 交互）
- `compare/output/v3-replica/`：V3 复刻稳态版（Manus 主线，3 屏短链路）
- `compare/output/kuaishou-v1/`：快手极速版（基于通用框架的定制落地页）
- `compare/output/qianwen-v1/`：千问（按最新版方法论产出的独立命名落地页）
- `compare/output/qianwen-v2-1-office10min/`：千问 V2.1（单利益点故事化：AI办公助手，10分钟交付）
- `compare/report/scorecard.md`
- `compare/report/recommendation.md`
- `compare/report/v3-methodology.md`
- `compare/report/v3-replica-qa.md`
- `compare/report/qianwen-v1-qa-2026-03-03.md`
- `compare/report/qianwen-v2-1-office10min-qa-2026-03-03.md`
- `compare/report/manus-demo-learning-2026-03-03.md`
- `compare/report/kuaishou-v1-vs-manus-evaluation-2026-03-03.md`

## 约束落实
1. 页面内未展示利益点来源说明。
2. 页面内未使用商店截图。
3. 四版本共用同一图包与同一利益点配置。
4. CTA 统一跳转：`https://app.mi.com/details?id=com.xunmeng.pinduoduo`。

## V2 行业切换参数
- 示例（电商）：`http://localhost:8080/compare/output/v2-hybrid/index.html?industry=ecommerce`
- 支持：`ecommerce` / `fintech` / `education` / `travel` / `tools`
