# 千问 v2.1 Iteration 9 QA（2026-03-03）

## 1. 目标
- 首屏流程必须在 4 秒内完成：叙事 -> 参与 -> 演示 -> 下载按钮解锁。
- 交互强度提升，同时保证 CTA 位置稳定不跳动。

## 2. 自动化检查
1. JS 语法检查
- `app.js ok`
- `landing-config-qianwen-v2-1.js ok`

2. 4 秒链路检查（Playwright）
- 检查方式：`DOMContentLoaded` 后轮询 `#heroCta.is-locked`。
- 实测结果：`unlock_ms=2542`。
- 多视口复核：`360x780=2476ms`、`390x844=2475ms`、`430x932=2625ms`。
- 判定：通过（<= 4000ms）。

## 3. 截图证据
- `compare/report/screens/qianwen-v2-1-office10min/view-390x844-iter9-0p9s.png`（参与前后阶段）
- `compare/report/screens/qianwen-v2-1-office10min/view-390x844-iter9-2p8s.png`（下载按钮已解锁）
- `compare/report/screens/qianwen-v2-1-office10min/view-390x844-iter9.png`（4.2s 稳态）

## 4. 结论
- 本轮满足“4秒内完成链路”目标，且 CTA 在首屏固定区域占位显示，未再出现位置漂移。
- 页面保留用户主动点击参与能力，并在用户未点击时自动补偿触发演示，避免链路超时。
