# H5 落地页审核报告

- 运行 ID：`audit-20260304-175102`
- 审核时间：2026-03-04T09:51:17.328Z
- 审核模式：`report_only`
- 目标页面（HTTP）：http://127.0.0.1:4173/generated_landings/landing-20260304-175031/index.html
- 目标路径：`/generated_landings/landing-20260304-175031/index.html`
- 本地文件路径：`/Users/feng/Desktop/codexLandingPageConstructor/generated_landings/landing-20260304-175031/index.html`
- 浏览器直开链接（本地）：file:///Users/feng/Desktop/codexLandingPageConstructor/generated_landings/landing-20260304-175031/index.html
- 结论：**通过（建议继续优化）**
- 报告目录：`audit_reports/runs/landing-20260304-175031/audit-20260304-175102`

## 总分与风险等级

- 总分：**100 / 100**
- 风险等级：**low**
- 评分阈值：85

| 维度 | 得分 | 满分 |
|---|---:|---:|
| 视觉资源完整性 | 22 | 22 |
| 布局完整性与无遮挡 | 22 | 22 |
| 排版与可读性 | 14 | 14 |
| 响应式稳定性 | 14 | 14 |
| 交互与转化链路 | 10 | 10 |
| 可访问性基线 | 8 | 8 |
| 披露合规 | 10 | 10 |

## 关键问题列表

未检测到高优先级问题。

## 证据截图

- 360x780 view: `audit_reports/runs/landing-20260304-175031/audit-20260304-175102/view-360x780.png`
- 360x780 full: `audit_reports/runs/landing-20260304-175031/audit-20260304-175102/full-360x780.png`
- 390x844 view: `audit_reports/runs/landing-20260304-175031/audit-20260304-175102/view-390x844.png`
- 390x844 full: `audit_reports/runs/landing-20260304-175031/audit-20260304-175102/full-390x844.png`
- 430x932 view: `audit_reports/runs/landing-20260304-175031/audit-20260304-175102/view-430x932.png`
- 430x932 full: `audit_reports/runs/landing-20260304-175031/audit-20260304-175102/full-430x932.png`

## 优化建议

| 优先级 | 问题 | 修复动作 | 预期收益 |
|---|---|---|---|
| P1 | 关键图片缺少加载兜底策略 | 为关键图片补充 onerror 占位与本地后备资源，避免出现破图图标。 | 提升首屏稳定性与品牌信任度 |
| P2 | 文案长度与容器约束可能不匹配 | 为标题和正文设置最大行数与自适应字号策略，规避异常换行。 | 提升阅读流畅度与视觉一致性 |
| P2 | 固定层与主内容层级可能冲突 | 梳理 z-index 分层规范并统一底部安全区间距。 | 提升交互稳定性并减少误触 |

## 下一步动作

1. 优先修复 P0/P1 问题并复跑审核。
2. 根据优化建议完成排版与响应式微调。
3. 在连续两次审核总分 >= 85 后再进入投放或提审流程。
