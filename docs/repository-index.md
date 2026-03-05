# Repository Index

## 1) 目标与命名原则
- 目标：把仓库整理为分层结构，并保持历史 H5 链接与脚本调用可用。
- 命名：统一使用英文语义化 + kebab-case。
- 路径策略：新路径是 canonical，旧路径通过 symlink / wrapper 兼容。

## 2) 新目录树（Canonical）
```text
apps/
  h5-main/
    index.html
    assets/
artifacts/
  landings/
  audits/
config/
  landing-audit.config.json
docs/
  design-notes.md
  path-rename-map.json
  repository-index.md
experiments/
  landing-compare-lab/
    inputs/
    variants/
    analysis/
tools/
  audit/
  media/
  jimeng/
  shared/
scripts/                # 兼容 wrapper
```

## 3) 旧->新映射
完整映射见：`docs/path-rename-map.json`

关键映射：
- `generated_landings -> artifacts/landings`
- `audit_reports -> artifacts/audits`
- `compare -> experiments/landing-compare-lab`
- `compare/output -> experiments/landing-compare-lab/variants`
- `scripts/* -> tools/*`（旧脚本名由 wrapper 保留）

## 4) 兼容层说明
- 根级兼容：`index.html`、`assets`、`generated_landings`、`audit_reports`、`compare`、`landing-audit.config.json`、`DESIGN_NOTES.md`。
- compare 子目录兼容：`input -> inputs`、`output -> variants`、`report -> analysis`。
- variants 兼容：保留旧版本目录名 symlink（如 `qianwen-v1 -> qianwen-v1-core`）。
- 脚本兼容：`scripts/*.mjs` 为 wrapper，转发到 `tools/`。

## 5) 核心工作流
- 主页面预览：`http://127.0.0.1:4173/apps/h5-main/index.html`
- 审核：`npm run audit:lp`
- 严格审核：`npm run audit:lp:strict`
- 生成并迭代审核：`npm run landing:generate:audit`
- 链接回归检查：`npm run links:verify`

## 6) 维护约定
- 新脚本放 `tools/`；`scripts/` 仅用于兼容 wrapper。
- 新产物放 `artifacts/`；不要写入 `apps/`。
- 新实验放 `experiments/landing-compare-lab/variants/`，目录名使用语义化 kebab-case。
- 若未来确认不再依赖旧链接，可分阶段移除兼容别名层。
