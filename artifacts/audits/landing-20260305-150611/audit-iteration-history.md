# 落地页审核与迭代总报告

- 落地页 ID：`landing-20260305-150611`
- 落地页路径：`artifacts/landings/landing-20260305-150611/index.html`
- 访问地址（HTTP）：http://127.0.0.1:4173/artifacts/landings/landing-20260305-150611/index.html
- 本地文件路径：`/Users/feng/Desktop/codexLandingPageConstructor/artifacts/landings/landing-20260305-150611/index.html`
- 浏览器直开链接（本地）：file:///Users/feng/Desktop/codexLandingPageConstructor/artifacts/landings/landing-20260305-150611/index.html
- 目标分：60
- 最大迭代：1
- 最终得分：**69**
- 最终风险：**critical**
- 是否达标：**是**
- 总迭代轮次：1

## 迭代总览

| 轮次 | 得分 | 风险等级 | 问题数 | 审核报告 | 自动优化动作数 |
|---|---:|---|---:|---|---:|
| 1 | 69 | critical | 10 | `artifacts/audits/runs/landing-20260305-150611/audit-20260305-150612/audit-report.md` | 0 |

## 逐轮详情

### 第 1 轮

- 得分：**69**
- 风险等级：**critical**
- 问题数：10
- 审核报告：`artifacts/audits/runs/landing-20260305-150611/audit-20260305-150612/audit-report.md`
- 审核 JSON：`artifacts/audits/runs/landing-20260305-150611/audit-20260305-150612/audit-result.json`

**本轮关键问题**

1. [P0] 主 CTA 被其他元素遮挡（360x780）
现象：button#transformBtn.btn.btn-primary 存在遮挡风险。
定位：`button#transformBtn.btn.btn-primary`

2. [P0] 主 CTA 被其他元素遮挡（390x844）
现象：button#transformBtn.btn.btn-primary 存在遮挡风险。
定位：`button#transformBtn.btn.btn-primary`

3. [P1] 存在被遮挡的转化按钮（360x780）
现象：检测到 1 个 CTA 遮挡风险。
定位：`button#transformBtn.btn.btn-primary`

4. [P1] 检测到文本裁切或容器溢出（360x780）
现象：检测到 2 处文本存在裁切或溢出。
定位：`h1#heroTitle`

5. [P1] 存在被遮挡的转化按钮（390x844）
现象：检测到 1 个 CTA 遮挡风险。
定位：`button#transformBtn.btn.btn-primary`

6. [P1] 检测到文本裁切或容器溢出（390x844）
现象：检测到 3 处文本存在裁切或溢出。
定位：`h1#heroTitle`

7. [P1] 检测到文本裁切或容器溢出（430x932）
现象：检测到 3 处文本存在裁切或溢出。
定位：`h1#heroTitle`

8. [P2] 发现字号或行高不协调（360x780）
现象：检测到 3 处排版参数异常。
定位：`h1#heroTitle`

**审核建议（原始）**

1. [P0] 主 CTA 被其他元素遮挡 -> 调整固定层 z-index 与底部安全区，确保 CTA 不被覆盖。
2. [P1] 存在被遮挡的转化按钮 -> 重新梳理 fixed/sticky 元素层级，避免遮挡交互控件。
3. [P1] 检测到文本裁切或容器溢出 -> 调整文本容器宽度、行高与换行策略，必要时限制文案长度。

**自动优化执行内容**

本轮未执行自动修改（已达标或无可执行规则）。

