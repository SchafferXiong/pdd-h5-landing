# pdd-h5-landing

拼多多手机版 H5 落地页，目标是 4 秒内促成下载点击。页面已实现视频与利益点联动状态机，并内置 Android 跳转到小米商店拼多多详情页。

## 本地结构
- `index.html`：主页面
- `assets/css/style.css`：视觉样式与动效
- `assets/js/app.js`：状态机、视频同步、下载逻辑
- `assets/manifest.json`：统一配置清单（`window.__LP_CONFIG`）
- `assets/video/*.mp4`：4s 主片 + 8s 补片
- `assets/prompts/*`：即梦/小云雀 AI 生成提示词包
- `scripts/generate_videos.sh`：本地视频生成脚本（可快速替换占位视频）
- `DESIGN_NOTES.md`：利益点来源与设计映射说明

## 下载跳转
默认跳转：
- `https://app.mi.com/details?id=com.xunmeng.pinduoduo`

并透传 URL 参数：
- `src`
- `campaign`
- `lp_source`（按钮来源自动注入）

## 开发预览
```bash
cd /Users/feng/Desktop/codexLandingPageConstructor
python3 -m http.server 4173
# 打开 http://127.0.0.1:4173/index.html
```

## 重新生成视频（本地）
```bash
cd /Users/feng/Desktop/codexLandingPageConstructor
./scripts/generate_videos.sh
```

生成文件：
- `assets/video/hero-main-4s.mp4` (1080x1920, 4s)
- `assets/video/benefit-8s.mp4` (1080x1920, 8s)
- `assets/video/hero-poster.jpg`
- `assets/video/benefit-poster.jpg`

## 接入即梦 / 小云雀成片
1. 在双平台分别按 `assets/prompts/seedance2-jimeng.md` 和 `assets/prompts/xiaoyunque.md` 生成视频。
2. 选片标准见 `assets/prompts/selection-rubric.md`。
3. 用最终成片覆盖：
- `assets/video/hero-main-4s.mp4`
- `assets/video/benefit-8s.mp4`

## GitHub Pages 发布（长期）
```bash
cd /Users/feng/Desktop/codexLandingPageConstructor
git init
git add .
git commit -m "feat: launch pdd video-integrated mobile landing page"

# 替换为你的 GitHub 用户名
GITHUB_USER="<your-github-username>"

# 创建远端仓库 pdd-h5-landing（需已登录 gh）
gh repo create pdd-h5-landing --public --source=. --remote=origin --push

# 启用 Pages（main 分支根目录）
gh api repos/${GITHUB_USER}/pdd-h5-landing/pages -X POST -f source[branch]=main -f source[path]=/
```

最终链接：
- `https://<your-github-username>.github.io/pdd-h5-landing/`
