# V3 Replica 验收记录（阶段1）

## 验收范围
- 页面版本：`compare/output/v3-replica/`
- 机型矩阵：`360x780`、`390x844`、`430x932`
- 验收日期：2026-03-03

## 自动化检查结论
1. 首屏重叠检查：通过
- `#heroTitle` 与 `#heroCta` 无重叠
- `#heroWidgets` 与 `#heroCta` 无重叠
2. 悬浮按钮边界：通过
- `#stickyCta` 未越界
3. 4 秒内 CTA 可见：通过
- 三档机型首屏 CTA 均可见
4. CTA 触控高度：通过
- `#topbarCta`、`#heroCta`、`#benefitCta`、`#urgencyCta`、`#stickyCta`、`#overlayCta` 全部 `>=48px`
5. 下载跳转与参数透传：通过
- 点击 CTA 后跳转到小米详情页（实际重定向到 `app.xiaomi.com`）
- 参数保留：`src=qa`、`campaign=v3`、`lp_source=hero`

## 跳转结果样例
- `https://app.xiaomi.com/details?id=com.xunmeng.pinduoduo&src=qa&campaign=v3&lp_source=hero`

## 截图归档
- `compare/report/screens/v3-replica/v3-360x780-view.png`
- `compare/report/screens/v3-replica/v3-360x780-full.png`
- `compare/report/screens/v3-replica/v3-390x844-view.png`
- `compare/report/screens/v3-replica/v3-390x844-full.png`
- `compare/report/screens/v3-replica/v3-430x932-view.png`
- `compare/report/screens/v3-replica/v3-430x932-full.png`

## 备注
- 首次进入展示红包弹层；关闭后不阻断页面滚动。
- 页面内未展示来源说明，未使用商店截图素材。
