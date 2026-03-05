# H5 高转化落地页学习归档（通用框架版，2026-03-03）

## 1. 归档来源
1. 样本页面：`https://kuaishouldg-o9958yju.manus.space/`
2. 样本报告：`https://kuaishouldg-o9958yju.manus.space/report`
3. 本地归档：
- `compare/report/archive/manus-demo/manus-demo-2026-03-03.html`
- `compare/report/archive/manus-demo/manus-demo-2026-03-03-index.css`
- `compare/report/archive/manus-demo/manus-demo-2026-03-03-index.js`
- `compare/report/archive/manus-demo/manus-demo-2026-03-03-text-snapshot.json`
- `compare/report/archive/manus-demo/manus-demo-report-2026-03-03-text-snapshot.json`
- `compare/report/archive/manus-demo/manus-demo-2026-03-03-key-strings.json`

## 2. Review 结论：哪些是“快手极速版”定制项
以下内容是强业务定制，不应直接复用到其他 App：

1. 业务承诺定制
- “看视频赚钱”“提现秒到账”“新用户现金红包”等强现金化承诺。
- 与该产品盈利模型绑定的利益表达（内容消费换收益）。

2. 品牌语义定制
- “快手极速版”品牌名、品牌色语义、话术风格。
- “官方正版 / 安全认证 / 3亿用户”这类品牌背书组合。

3. 玩法符号定制
- 红包雨、开红包、金币爆炸、老虎机数字翻滚等“现金奖励玩法”符号。
- “领取人数”“提现记录”口径与该产品信任模型强绑定。

4. 文案与数字定制
- 具体金额（例如 `¥38.88`）、具体人数（例如 `328,691`）、具体倒计时起点。
- “下载即同意协议”附近的具体法务文案形式。

5. 转化路径定制
- 按其分发链路设计的单一跳转目标和参数策略。

## 3. 通用框架（跨行业可复用）

### 3.1 目标框架（Goal Framework）
1. 首屏 4 秒内：完成“价值感知 + CTA 可点击”。
2. 2-3 屏内：完成“利益证明 + 风险降低 + 行动触发”。
3. 全程：CTA 不丢失、语义一致、路径唯一。

### 3.2 信息框架（Message Framework）
1. 主价值句（1条）：用户立刻得到什么。
2. 支撑价值句（3-5条）：为什么可信、为什么现在做。
3. 行动句（1条）：点击后发生什么。
4. 风险句（1条）：安全/合规/可撤回等风险缓释信息。

### 3.3 结构框架（Page Structure）
1. 屏1 Hero（转化屏）
- 品牌识别（logo + slogan）
- 主利益锚点（数字或强关键词）
- 主 CTA

2. 屏2 Benefit（证明屏）
- 3-5 个利益卡片
- 社会证明组件（动态流/使用数据/评价片段）
- 次 CTA

3. 屏3 Urgency（收口屏）
- 时间/名额/窗口提示（可选）
- 进度与状态反馈
- 收口 CTA

### 3.4 交互框架（Interaction Framework）
1. 三层动效模型
- 环境层：低频循环，负责氛围，不承载关键信息。
- 组件层：中频切换，负责利益点聚焦。
- 转化层：高频强化，负责 CTA 注意力。

2. 4 秒节拍模型
- `0.0-1.0s`：品牌 + 主利益露出
- ~~`1.0-2.4s`：第1证明点~~
- `1.0-3.4s`：主标题尽量保持稳定，主要切换“利益卡/数字/小组件”承担证明点。（更新于 2026-03-03 15:23:32 CST）
- ~~`2.4-3.4s`：第2证明点~~
- `2.4-3.4s`：避免大标题频繁改写导致视觉跳动；优先做卡片高亮与数字动效。（更新于 2026-03-03 15:23:32 CST）
- `3.4-4.0s`：CTA 冲刺

3. 转化闭环
- ~~顶部轻 CTA + 首屏主 CTA + 底部常驻 CTA~~
- 主路径优先采用“单主 CTA + 底部常驻固定 CTA”；顶部 CTA 仅在不分散注意力时保留。（更新于 2026-03-03 15:23:32 CST）
- ~~所有按钮走同一跳转函数 + 参数透传策略~~
- 所有 CTA 走同一跳转函数 + 参数透传策略，并要求主 CTA 位置固定不位移。（更新于 2026-03-03 15:23:32 CST）

### 3.5 组件框架（Component Kit）
1. `HeroAnchor`：主视觉锚点（图/数字/标题）
2. `BenefitCards`：利益点卡片组
3. `ProofFeed`：社会证明组件（动态可选）
4. `UrgencyBar`：时效/名额/进度组件
5. `StickyCTA`：常驻行动组件
6. ~~`OverlayOffer`：可关闭的首次激励弹层（不阻断滚动）~~
6. `OverlayOffer`：默认关闭；仅在“奖励玩法型场景”按触发条件启用，避免遮挡首屏主 CTA。（更新于 2026-03-03 15:23:32 CST）

### 3.6 可配置框架（Config-Driven）
将行业差异放入配置，不改布局代码：

1. 品牌层
- `brand.name` `brand.logoUrl` `brand.colors`

2. 内容层
- ~~`hero.value` `benefits[]` `proof.items[]` `urgency.copy`~~
- `hero.value` `benefits[]` `proof.items[]` `urgency.copy` `hero.stageMode(image|css)`（更新于 2026-03-03 15:23:32 CST）

3. 节拍层
- `timing.heroBeats[]` `timing.storyBeats[]` `ctaIntensityRules`

4. 链路层
- `cta.url` `cta.params[]` `fallback.url`

5. 合规模块
- `legal.notice` `legal.privacyUrl` `legal.termsUrl`

### 3.7 利益点获取流程（小米应用商店）
App 的利益点可以从 [小米应用商店](https://app.mi.com/) 标准化提取，流程如下：

1. 入口搜索
- 在 `https://app.mi.com/` 搜索目标 App 名称。
- 进入对应详情页，记录详情页 URL（作为来源锚点）。

2. 素材抓取
- 在详情页定位“手机截图”区域。
- 收集全部截图图片 URL，按顺序编号（`shot1..shotN`）。

3. 文字识别
- 对截图执行 OCR/视觉识别，提取画面中的利益点文案。
- 去除 UI 噪音词（导航、按钮、状态词），只保留“用户价值表达”。

4. 利益点归一化
- 合并同义表达，去重后映射到统一字段：
`benefit_title`、`benefit_sub`、`proof_hint`、`scene_type`。
- 保留原意，不改写为超出原文承诺的表达。

5. 配置入库
- 将提取结果写入落地页配置层（如 `benefits[]`、`timing.storyBeats[]`）。
- 每条利益点保留来源映射（`source.pageUrl` + `source.shotId`），用于审计与复核。

6. 最小产出格式（示例）
```json
{
  "source": {
    "market": "xiaomi",
    "pageUrl": "https://app.mi.com/details?id=<package>",
    "shots": ["shot1", "shot2", "shot3"]
  },
  "benefits": [
    {
      "benefit_title": "核心利益点标题",
      "benefit_sub": "利益点说明",
      "proof_hint": "可感知证明",
      "scene_type": "price|cash|efficiency|trust",
      "source_shot": "shot1"
    }
  ]
}
```

## 4. 行业适配映射（示例）
1. 电商
- 主价值：补贴/低价/包邮
- 证明：销量、评价、限时活动

2. 金融
- 主价值：额度/利率/到账速度
- 证明：持牌信息、风控提示、用户覆盖

3. 教育
- 主价值：提分/通关/学习效率
- 证明：课程成果、师资、学员反馈

4. 工具
- 主价值：提效/节省时间/降低成本
- 证明：性能数据、场景案例、稳定性

## 5. 验收标准（通用）
1. 视觉稳定
- ~~360/390/430 宽度无重叠、无越界、无遮挡。~~
- 360/390/430 宽度无重叠、无越界、无遮挡，且底部主 CTA 不抖动不跳位。（更新于 2026-03-03 15:23:32 CST）

2. 可点击性
- 核心 CTA 触控高度 `>= 48px`。

3. 首屏转化
- 4 秒内 CTA 可见可点。

4. 跳转一致性
- 全部 CTA 指向同一目标并透传参数。

5. 降级可用
- ~~资源加载失败时显示占位，不影响 CTA 与文案可读。~~
- 资源加载失败时显示“品牌一致的渐变占位/纯 CSS 舞台”，禁止出现浏览器破图图标。（更新于 2026-03-03 15:23:32 CST）

## 6. 迁移注意事项
1. 保留框架，不复制样本 App 的具体承诺和数字。
2. 强利益文案必须与客户真实能力一致，避免越界承诺。
3. 所有“人数/金额/时效”类数据应可配置且可审计。

## 7. 本次修改原因
1. 原文“可复用方法论”里混入了样本 App 的强定制元素（现金红包、提现语义、具体金额/人数），直接复用会导致跨行业失真，因此先拆出“定制项清单”。
2. 原文偏“观察总结”，缺少工程落地结构。补齐了通用框架：`目标-信息-结构-交互-组件-配置-验收`，让不同团队可直接套用。
3. 原文未区分“框架可迁移”与“文案不可照搬”。新增“迁移注意事项”和“合规模块”，降低越界承诺风险。
4. 你后续要做跨行业版本，所以新增“行业适配映射”，把同一交互骨架映射到电商/金融/教育/工具四类场景。
5. 为了便于复盘和审计，保留原始归档与截图路径，并将分析定位为“样本学习”而非“品牌方案复用”。

## 8. 执行约束（从本次起生效）
1. 本文档作为后续页面迭代的唯一行动依据（Action Baseline）。
2. 后续每次迭代必须在“迭代日志”新增一条记录，不得覆盖历史记录。
3. 每条迭代记录至少包含：`目标`、`改动`、`证据文件`、`结果`、`下一步`。
4. 当策略发生变更时，先更新本文档策略章节，再执行页面改动。
5. 若当次迭代未完成，也必须先追加“进行中”条目，完成后仅补充该条目的结果，不得改写历史结论。
6. 文档维护采用“Append-Only”规则：
- 允许：新增章节、新增日志条目、在“进行中”条目补充结果。
- 禁止：删除历史条目、重写已完成条目结论、覆盖旧版本内容。
7. 所有产出文件需在日志中给出相对路径，确保可追溯与可复核。

### 8.1 迭代记录模板（固定）
```md
### Iteration N（YYYY-MM-DD，状态）
1. 目标
- ...
2. 关键改动
- ...
3. 证据文件
- `path/to/file`
4. 结果
- ...
5. 下一步
- ...
```

## 9. 迭代日志（Append-Only）
> 说明：以下日志按时间顺序追加，历史条目不删除不改写。

### Iteration 0（2026-03-03）
1. 目标
- 将 Manus 样本学习从“快手定制观察”抽象为跨行业通用框架。
2. 关键改动
- 新增定制项识别、通用框架（目标/信息/结构/交互/组件/配置/验收）与行业映射。
3. 证据文件
- `compare/report/manus-demo-learning-2026-03-03.md`
- `compare/report/archive/manus-demo/*`
- `compare/report/screens/manus-demo/*`
4. 结果
- 完成通用框架化，可作为后续页面设计规范输入。
5. 下一步
- 基于该框架对指定 App（快手极速版）制作落地页并进行 A/B 对比评估。

### Iteration 1（2026-03-03）
1. 目标
- 按通用框架制作“快手极速版”自研页面并与 Manus 页面对比。
2. 关键改动
- 产出 `compare/output/kuaishou-v1/` 页面。
- 产出对比评估文档与截图证据。
3. 证据文件
- `compare/output/kuaishou-v1/index.html`
- `compare/input/landing-config-kuaishou-v1.js`
- `compare/report/kuaishou-v1-vs-manus-evaluation-2026-03-03.md`
- `compare/report/screens/kuaishou-vs-manus/*`
- `compare/report/archive/kuaishou-v1/*`
4. 结果
- 自研页稳定性通过（360/390/430），并形成与 Manus 的结构化差异结论。
5. 下一步
- 按反馈增强“首屏爆发力”，并去除影响观感的线条与按钮位移问题。

### Iteration 2（2026-03-03，进行中）
1. 目标
- 完全重做快手页样式，目标对齐 Manus 爆发式风格（不沿用旧框架 UI 结构）。
2. 当前状态
- 已开始重写 `compare/output/kuaishou-v1/` 的页面结构与样式。
- 本条记录由你本轮指令触发，后续将补充“结果/证据/结论”。
3. 下一步
- 完成重写实现后更新本条的结果与证据截图，并继续追加下一条迭代。

### Iteration 3（2026-03-03，已完成）
1. 目标
- 将“本文档为行动依据 + 后续迭代追加记录不覆盖”固化为可执行规范。
2. 关键改动
- 在“执行约束”增加 Append-Only 细则、进行中条目补充规则、可追溯路径要求。
- 新增“8.1 迭代记录模板（固定）”，统一后续记录格式。
3. 证据文件
- `compare/report/manus-demo-learning-2026-03-03.md`
4. 结果
- 已建立统一文档治理规则，后续迭代可按模板持续追加并审计。
5. 下一步
- 按 Iteration 2 的目标继续推进快手页重做，并在完成后补充结果与截图证据。

### Iteration 4（2026-03-03，已完成）
1. 目标
- 落实 Iteration 2：完全重做 `kuaishou-v1` 页面，优先复刻 Manus 的爆发式前端样式与4秒转化压强。
2. 关键改动
- 重写 `compare/output/kuaishou-v1/index.html`，保留 Manus 核心信息骨架：品牌头部、倒计时、动态滚动条、红包主金额卡、四宫格利益点、实时提现动态、三步领钱、固定底部强 CTA。
- 重写 `compare/output/kuaishou-v1/styles.css`，改为红金高对比风格，加入红包雨/金币下落氛围、金额发光、CTA 扫光与强度分级；移除旧版不美观线框感和不稳定排版。
- 重写 `compare/output/kuaishou-v1/app.js`，改为轻量前端逻辑（倒计时、社交弹幕、动态提现、4秒节拍卡片高亮、CTA 强度切换、统一下载跳转与参数透传）。
- 资源侧采用纯前端金币舞台（非旧框架图片依赖）+ logo 动态解析，降低图片失效风险。
3. 证据文件
- `compare/output/kuaishou-v1/index.html`
- `compare/output/kuaishou-v1/styles.css`
- `compare/output/kuaishou-v1/app.js`
- `compare/report/screens/kuaishou-vs-manus/ours-v3-view-360x780.png`
- `compare/report/screens/kuaishou-vs-manus/ours-v3-view-390x844.png`
- `compare/report/screens/kuaishou-vs-manus/ours-v3-view-430x932.png`
- `compare/report/screens/kuaishou-vs-manus/ours-v3-full-390x844.png`
4. 结果
- 已完成“非旧框架”的整页重做，视觉风格和交互节奏显著贴近 Manus。
- 首屏 CTA 固定底部，不再发生位置漂移；页面文案仅保留转化信息，不展示设计说明类文本。
- 360/390/430 视口截图通过基本可用性检查（无明显错位、无遮挡主 CTA、可持续滚动到后续模块）。
5. 下一步
- 进入阶段2（视频化/故事化/高交互）前，先做一轮你主观审美验收；通过后再在当前骨架上做镜头化转场升级。

### Iteration 5（2026-03-03，已完成）
1. 目标
- 安装“Landing Page / Marketing Page Builder”能力，作为后续 Manus 复刻和转化页迭代的技能基础设施。
2. 关键改动
- 使用 `skill-installer` 校验官方 `openai/skills` 清单，确认不存在同名可安装条目。
- 使用 `skill-creator` 在本地创建并安装两个等价技能：
  `landing-page-builder`、`marketing-page-builder`。
- 补全两个技能的 `SKILL.md`，固化移动端落地页结构、4秒转化路径、CTA 与文案约束。
3. 证据文件
- `~/.codex/skills/landing-page-builder/SKILL.md`
- `~/.codex/skills/landing-page-builder/agents/openai.yaml`
- `~/.codex/skills/marketing-page-builder/SKILL.md`
- `~/.codex/skills/marketing-page-builder/agents/openai.yaml`
4. 结果
- 两个技能已落地到本地技能目录，可作为后续页面开发的组合能力使用。
- 官方仓库暂无同名技能，已采用本地可控实现替代。
5. 下一步
- 重启 Codex 使新技能在会话中可触发，然后进入下一轮页面迭代。

### Iteration 6（2026-03-03，已完成）
1. 目标
- 复核“通用方法论”是否与最新 Manus 风格复刻实践一致，并按“删除线 + 追加更新”方式修订。
2. 关键改动
- 更新 `3.4 交互框架`：将“标题频繁切换”改为“标题稳定 + 组件节拍切换”。
- 更新 `3.4 转化闭环`：从“三重 CTA 同时露出”调整为“单主 CTA + 底部固定 CTA 优先”。
- 更新 `3.5 组件框架`：将 `OverlayOffer` 改为默认关闭，仅按场景启用。
- 更新 `3.6 可配置框架`：内容层新增 `hero.stageMode(image|css)`，支持图片与纯 CSS 舞台双模式。
- 更新 `5. 验收标准`：新增“主 CTA 不抖动不跳位”和“禁止破图图标”约束。
3. 证据文件
- `compare/report/manus-demo-learning-2026-03-03.md`
4. 结果
- 方法论已与最新复刻结果对齐，关键条目均按要求保留旧文并在其下追加新版本及更新时间。
5. 下一步
- 基于更新后的方法论继续后续迭代，并保持 append-only 记录。

### Iteration 7（2026-03-03，已完成）
1. 目标
- 按最新版方法论为“千问”制作独立命名 H5 落地页（4 秒转化优先）。
2. 关键改动
- 新建并命名页面目录：`compare/output/qianwen-v1/`（未复用快手目录命名）。
- 新建配置：`compare/input/landing-config-qianwen-v1.js`，写入品牌、利益点、4秒节拍、CTA 与素材映射。
- 实现页面：`index.html + styles.css + app.js`，满足首屏 `Brand + Value + CTA + Proof` 同屏、标题稳定+组件节拍切换、统一 CTA 跳转与参数透传。
- 资源落地：下载小米详情页千问 logo 与 5 张截图到 `compare/input/visuals/qianwen/`。
- 更新输出入口：`compare/output/index.html` 增加 `qianwen-v1` 链接。
3. 证据文件
- `compare/output/qianwen-v1/index.html`
- `compare/output/qianwen-v1/styles.css`
- `compare/output/qianwen-v1/app.js`
- `compare/input/landing-config-qianwen-v1.js`
- `compare/input/visuals/qianwen/logo.png`
- `compare/input/visuals/qianwen/shot1.jpg`
- `compare/input/visuals/qianwen/shot2.jpg`
- `compare/input/visuals/qianwen/shot3.jpg`
- `compare/input/visuals/qianwen/shot4.jpg`
- `compare/input/visuals/qianwen/shot5.jpg`
- `compare/report/screens/qianwen-v1/qianwen-v1-view-360x780.png`
- `compare/report/screens/qianwen-v1/qianwen-v1-view-390x844.png`
- `compare/report/screens/qianwen-v1/qianwen-v1-view-430x932.png`
- `compare/report/screens/qianwen-v1/qianwen-v1-full-390x844.png`
- `compare/report/qianwen-v1-qa-2026-03-03.md`
4. 结果
- 已交付“千问”独立命名版本 `qianwen-v1`，并完成 360/390/430 多视口截图验收。
- 首屏主 CTA 在 4 秒内可见可点，底部 sticky CTA 改为滚动触发显示，避免首屏遮挡。
5. 下一步
- 基于该版本做 A/B：首屏主张文案、CTA 文案、Proof 展示位置三项优先实验。
