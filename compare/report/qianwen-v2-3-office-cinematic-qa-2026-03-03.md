# 千问 v2.3（office-cinematic）QA（2026-03-03）

## 1. 目标
- 按 V2.3 行动依据重做落地页：场景叙事、激进交互、无“设计者思考”类页面文案。

## 2. 检查结果
1. 交互链路
- 自动演示可触发，参与按钮可手动触发演示。
- 下载 CTA 在演示完成后解锁，390x844 实测：`3729ms`。

2. 文案禁令检查
- 页面可见文本命中：`[]`（无命中）。
- 说明：禁词仅存在于配置的 `copyGuard.bannedPhrases` 词典，不在页面展示文本中。

3. 多视口可用性
- 已截图检查：`360x780`、`390x844`、`430x932`。
- 首屏核心区未出现明显遮挡与按钮越界。

## 3. 截图证据
- `compare/report/screens/qianwen-v2-3-office-cinematic/view-360x780-0p9s.png`
- `compare/report/screens/qianwen-v2-3-office-cinematic/view-360x780-3p2s.png`
- `compare/report/screens/qianwen-v2-3-office-cinematic/view-390x844-0p9s.png`
- `compare/report/screens/qianwen-v2-3-office-cinematic/view-390x844-3p2s.png`
- `compare/report/screens/qianwen-v2-3-office-cinematic/view-430x932-0p9s.png`
- `compare/report/screens/qianwen-v2-3-office-cinematic/view-430x932-3p2s.png`

## 4. 结论
- V2.3 版本已完成生成，视觉和交互强度高于 v2.1。
- 页面未出现“设计思路/流程说明”类对用户暴露文案。
