import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import { normalizePath, paths, repoRoot } from '../shared/paths.mjs';

async function main() {
  const cli = parseArgs(process.argv.slice(2));
  const minScore = Number.parseInt(cli['min-score'] || '80', 10);
  const maxIterations = Number.parseInt(cli['max-iterations'] || '6', 10);
  const baseUrl = String(cli['base-url'] || 'http://127.0.0.1:4173');

  if (!Number.isFinite(minScore) || minScore < 1 || minScore > 100) {
    throw new Error(`Invalid --min-score: ${cli['min-score']}`);
  }

  if (!Number.isFinite(maxIterations) || maxIterations < 1 || maxIterations > 12) {
    throw new Error(`Invalid --max-iterations: ${cli['max-iterations']}`);
  }

  const landingId = buildId('landing');
  const landingDir = path.resolve(paths.artifactsLandingsDir, landingId);
  const landingIndex = path.resolve(landingDir, 'index.html');

  await createLandingSnapshot(repoRoot, landingDir);

  const landingRelativePath = normalizePath(path.relative(repoRoot, landingIndex));
  const targetUrl = `${baseUrl.replace(/\/$/, '')}/${landingRelativePath}`;

  const reportRoot = paths.artifactsAuditsDir;
  const reportLandingDir = path.resolve(reportRoot, landingId);
  const reportRunsRoot = normalizePath(path.relative(repoRoot, path.resolve(paths.artifactsAuditRunsDir, landingId)));

  await fs.mkdir(reportLandingDir, { recursive: true });

  const iterations = [];
  let finalScore = 0;
  let finalRisk = 'critical';
  let reached = false;

  for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    const audit = await runAudit({
      targetUrl,
      outputRoot: reportRunsRoot
    });

    const result = audit.result;
    finalScore = result.totalScore;
    finalRisk = result.riskLevel;

    const iterationRecord = {
      iteration,
      score: result.totalScore,
      riskLevel: result.riskLevel,
      findingsCount: result.findings.length,
      pass: result.pass,
      blocked: result.blocked,
      reportPath: audit.summary.markdownReport,
      jsonPath: audit.summary.jsonReport,
      topFindings: result.findings.slice(0, 8).map((f) => ({
        severity: f.severity,
        title: f.title,
        detail: f.detail,
        selector: f.selector,
        viewport: f.viewport
      })),
      suggestions: result.optimizationSuggestions
    };

    if (result.totalScore >= minScore) {
      iterationRecord.actionsApplied = [];
      iterations.push(iterationRecord);
      reached = true;
      break;
    }

    const actions = await applyAutoOptimization({
      landingDir,
      findings: result.findings,
      suggestions: result.optimizationSuggestions,
      iteration
    });

    iterationRecord.actionsApplied = actions;
    iterations.push(iterationRecord);

    if (actions.length === 0) {
      break;
    }
  }

  const final = {
    landingId,
    landingPath: landingRelativePath,
    landingDir: normalizePath(path.relative(repoRoot, landingDir)),
    targetUrl,
    targetLocalFilePath: landingIndex,
    targetLocalFileUrl: pathToFileURL(landingIndex).href,
    minScore,
    maxIterations,
    reachedTarget: reached,
    finalScore,
    finalRisk,
    totalIterations: iterations.length,
    reportRoot: normalizePath(path.relative(repoRoot, reportLandingDir)),
    iterations
  };

  const historyJsonPath = path.resolve(reportLandingDir, 'audit-iteration-history.json');
  const historyMdPath = path.resolve(reportLandingDir, 'audit-iteration-history.md');

  await fs.writeFile(historyJsonPath, `${JSON.stringify(final, null, 2)}\n`, 'utf8');
  await fs.writeFile(historyMdPath, renderIterationHistory(final), 'utf8');

  const summary = {
    landingId,
    landingPath: final.landingPath,
    targetUrl: final.targetUrl,
    targetLocalFileUrl: final.targetLocalFileUrl,
    reachedTarget: final.reachedTarget,
    finalScore: final.finalScore,
    finalRisk: final.finalRisk,
    totalIterations: final.totalIterations,
    historyMarkdown: normalizePath(path.relative(repoRoot, historyMdPath)),
    historyJson: normalizePath(path.relative(repoRoot, historyJsonPath))
  };

  console.log(JSON.stringify(summary, null, 2));
}

async function createLandingSnapshot(root, landingDir) {
  const filesToCopy = [
    ['apps/h5-main/index.html', 'index.html'],
    ['apps/h5-main/assets/css/style.css', 'assets/css/style.css'],
    ['apps/h5-main/assets/js/app.js', 'assets/js/app.js'],
    ['apps/h5-main/assets/img/generated/qianwen-app-icon-96.png', 'assets/img/generated/qianwen-app-icon-96.png'],
    ['apps/h5-main/assets/img/generated/qianwen-app-icon-96.webp', 'assets/img/generated/qianwen-app-icon-96.webp'],
    ['apps/h5-main/assets/img/generated/qianwen-app-icon-192.png', 'assets/img/generated/qianwen-app-icon-192.png'],
    ['apps/h5-main/assets/img/generated/qianwen-app-icon-192.webp', 'assets/img/generated/qianwen-app-icon-192.webp']
  ];

  for (const [srcRel, destRel] of filesToCopy) {
    const src = path.resolve(root, srcRel);
    const dest = path.resolve(landingDir, destRel);

    if (!existsSync(src)) {
      throw new Error(`Source file missing: ${srcRel}`);
    }

    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(src, dest);
  }

  const indexPath = path.resolve(landingDir, 'index.html');
  const appPath = path.resolve(landingDir, 'assets/js/app.js');

  const indexRaw = await fs.readFile(indexPath, 'utf8');
  const indexPatched = indexRaw.replaceAll('/assets/img/generated/', './assets/img/generated/');
  await fs.writeFile(indexPath, indexPatched, 'utf8');

  const appRaw = await fs.readFile(appPath, 'utf8');
  const appPatched = appRaw.replace("iconUrl: '/assets/img/generated/", "iconUrl: './assets/img/generated/");
  await fs.writeFile(appPath, appPatched, 'utf8');
}

async function runAudit({ targetUrl, outputRoot }) {
  const args = [
    './tools/audit/landing-audit.mjs',
    '--config',
    'config/landing-audit.config.json',
    '--url',
    targetUrl,
    '--mode',
    'report_only',
    '--output-root',
    outputRoot
  ];

  const { code, stdout, stderr } = await runProcess('node', args, { cwd: repoRoot });

  if (code !== 0) {
    throw new Error(`Audit failed (code=${code}): ${stderr || stdout}`);
  }

  const summary = parseJsonObject(stdout);
  if (!summary) {
    throw new Error(`Cannot parse audit summary JSON: ${stdout}`);
  }

  const jsonPath = path.resolve(repoRoot, summary.jsonReport);
  const raw = await fs.readFile(jsonPath, 'utf8');
  const result = JSON.parse(raw);

  return { summary, result };
}

async function applyAutoOptimization({ landingDir, findings, suggestions, iteration }) {
  const actions = [];

  const stylePath = path.resolve(landingDir, 'assets/css/style.css');
  const appPath = path.resolve(landingDir, 'assets/js/app.js');

  let styleRaw = await fs.readFile(stylePath, 'utf8');
  let appRaw = await fs.readFile(appPath, 'utf8');

  const allText = [
    ...findings.map((f) => `${f.title} ${f.detail}`),
    ...suggestions.map((s) => `${s.issue} ${s.action}`)
  ].join('\n');

  const needCtaFix = /遮挡|转化按钮|主 CTA/.test(allText);
  const needTypographyFix = /文本裁切|容器溢出|字号|行高|换行/.test(allText);
  const needImageFix = /破图|图片加载失败|关键图片/.test(allText);
  const aggressive = iteration >= 2;

  if (needCtaFix) {
    const stickyThreshold = aggressive ? 'Math.max(220, window.innerHeight * 0.72)' : 'Math.max(140, window.innerHeight * 0.4)';
    const stageHeightMobile = aggressive ? 332 : 364;
    const stageHeightDesktop = aggressive ? 362 : 394;
    const hiddenMode = aggressive ? 'display: none;' : 'opacity: 0;\\n  pointer-events: none;';
    const visibleMode = aggressive ? 'display: block;' : 'opacity: 1;\\n  pointer-events: auto;';

    const cssPatch = `
.sticky-cta-wrap {
  ${hiddenMode}
  transition: opacity 220ms ease;
}

.sticky-cta-wrap.is-audit-visible {
  ${visibleMode}
}

.transform-stage {
  min-height: ${stageHeightMobile}px;
}

@media (min-width: 760px) {
  .transform-stage {
    min-height: ${stageHeightDesktop}px;
  }
}
`;

    const updatedCss = upsertBlock({
      source: styleRaw,
      marker: 'AUTO_AUDIT_LAYOUT_FIX',
      language: 'css',
      content: cssPatch
    });

    if (updatedCss.changed) {
      styleRaw = updatedCss.next;
      actions.push({
        type: 'layout',
        description: aggressive
          ? '进一步提升首屏安全区并延后 sticky CTA 出现时机，减少遮挡误判。'
          : '降低首屏舞台高度并改为滚动后显示 sticky CTA，避免主 CTA 遮挡。',
        files: ['assets/css/style.css']
      });
    }

    const stickyJs = `
(function setupAuditStickyVisibility() {
  const sticky = document.getElementById('stickyCta');
  if (!sticky) return;

  const toggle = () => {
    const show = window.scrollY > ${stickyThreshold};
    sticky.classList.toggle('is-audit-visible', show);
  };

  toggle();
  window.addEventListener('scroll', toggle, { passive: true });
  window.addEventListener('resize', toggle);
})();
`;

    const updatedJs = upsertJsBeforeAnchor({
      source: appRaw,
      marker: 'AUTO_AUDIT_STICKY_VISIBILITY',
      content: stickyJs,
      anchor: "window.addEventListener('pagehide', clearAllTimers);"
    });

    if (updatedJs.changed) {
      appRaw = updatedJs.next;
      actions.push({
        type: 'interaction',
        description: aggressive
          ? '提高 sticky CTA 触发阈值，优先保障首屏主 CTA 可见可点。'
          : '新增 sticky CTA 显示时机控制，降低首屏遮挡概率。',
        files: ['assets/js/app.js']
      });
    }
  }

  if (needTypographyFix) {
    const heroLineHeight = aggressive ? '1.24' : '1.2';
    const heroPaddingBottom = aggressive ? '0.08em' : '0';
    const secondTitleLineHeight = aggressive ? '1.3' : '1.24';
    const capDescSize = aggressive ? '14px' : '13px';

    const cssPatch = `
#heroTitle {
  line-height: ${heroLineHeight};
  padding-bottom: ${heroPaddingBottom};
}

.brand-name {
  line-height: 1.22;
}

.capability h2 {
  line-height: ${secondTitleLineHeight};
  padding-bottom: ${heroPaddingBottom};
}

.stage-phase {
  font-size: 14px;
  line-height: 1.4;
}

.cap-desc {
  font-size: ${capDescSize};
  line-height: 1.5;
}

#heroTitle,
#heroSub,
#secondTitle,
.brand-name,
.brand-sub,
.cap-title,
.cap-desc,
.btn {
  overflow-wrap: anywhere;
  word-break: break-word;
}
`;

    const updatedCss = upsertBlock({
      source: styleRaw,
      marker: 'AUTO_AUDIT_TYPO_FIX',
      language: 'css',
      content: cssPatch
    });

    if (updatedCss.changed) {
      styleRaw = updatedCss.next;
      actions.push({
        type: 'typography',
        description: aggressive
          ? '执行加强版排版修复：提升行高、补偿标题裁切并提高正文可读性。'
          : '统一标题与正文行高，并增强小屏换行策略。',
        files: ['assets/css/style.css']
      });
    }
  }

  if (needImageFix) {
    const jsPatch = `
(function setupAuditImageFallback() {
  const fallback = './assets/img/generated/qianwen-app-icon-96.png';
  document.querySelectorAll('img[data-brand-icon]').forEach((img) => {
    if (!(img instanceof HTMLImageElement)) return;
    img.addEventListener('error', () => {
      img.src = fallback;
    }, { once: true });
  });
})();
`;

    const updatedJs = upsertJsBeforeAnchor({
      source: appRaw,
      marker: 'AUTO_AUDIT_IMAGE_FIX',
      content: jsPatch,
      anchor: "window.addEventListener('pagehide', clearAllTimers);"
    });

    if (updatedJs.changed) {
      appRaw = updatedJs.next;
      actions.push({
        type: 'asset',
        description: '为品牌图片添加加载失败回退资源。',
        files: ['assets/js/app.js']
      });
    }
  }

  if (actions.length === 0) {
    return actions;
  }

  await fs.writeFile(stylePath, styleRaw, 'utf8');
  await fs.writeFile(appPath, appRaw, 'utf8');

  actions.unshift({
    type: 'meta',
    description: `第 ${iteration} 轮根据审核建议自动优化完成。`,
    files: []
  });

  return actions;
}

function upsertBlock({ source, marker, language, content }) {
  const start = language === 'css' ? `/* ${marker}_START */` : `// ${marker}_START`;
  const end = language === 'css' ? `/* ${marker}_END */` : `// ${marker}_END`;
  const block = `${start}\n${content.trim()}\n${end}`;

  if (source.includes(start) && source.includes(end)) {
    const reg = new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`, 'm');
    const next = source.replace(reg, block);
    return { changed: next !== source, next };
  }

  const next = `${source.trimEnd()}\n\n${block}\n`;
  return { changed: true, next };
}

function upsertJsBeforeAnchor({ source, marker, content, anchor }) {
  const start = `// ${marker}_START`;
  const end = `// ${marker}_END`;
  const block = `${start}\n${content.trim()}\n${end}\n`;

  if (source.includes(start) && source.includes(end)) {
    const reg = new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}\\n?`, 'm');
    const next = source.replace(reg, block);
    return { changed: next !== source, next };
  }

  if (!source.includes(anchor)) {
    const next = `${source.trimEnd()}\n\n${block}`;
    return { changed: true, next };
  }

  const next = source.replace(anchor, `${block}${anchor}`);
  return { changed: true, next };
}

function renderIterationHistory(final) {
  const iterationRows = final.iterations
    .map((it) => {
      return `| ${it.iteration} | ${it.score} | ${it.riskLevel} | ${it.findingsCount} | \`${it.reportPath}\` | ${it.actionsApplied.length} |`;
    })
    .join('\n');

  const iterationDetails = final.iterations
    .map((it) => {
      const findingLines = it.topFindings.length
        ? it.topFindings
            .map((f, idx) => `${idx + 1}. [${f.severity}] ${f.title}（${f.viewport}）\n现象：${f.detail}\n定位：\`${f.selector}\``)
            .join('\n\n')
        : '无高优先级问题。';

      const actionLines = it.actionsApplied.length
        ? it.actionsApplied.map((a, idx) => `${idx + 1}. ${a.description}${a.files.length ? `（文件：${a.files.join(', ')}）` : ''}`).join('\n')
        : '本轮未执行自动修改（已达标或无可执行规则）。';

      const suggestLines = it.suggestions
        .map((s, idx) => `${idx + 1}. [${s.priority}] ${s.issue} -> ${s.action}`)
        .join('\n');

      return `### 第 ${it.iteration} 轮\n\n- 得分：**${it.score}**\n- 风险等级：**${it.riskLevel}**\n- 问题数：${it.findingsCount}\n- 审核报告：\`${it.reportPath}\`\n- 审核 JSON：\`${it.jsonPath}\`\n\n**本轮关键问题**\n\n${findingLines}\n\n**审核建议（原始）**\n\n${suggestLines || '无'}\n\n**自动优化执行内容**\n\n${actionLines}\n`;
    })
    .join('\n\n');

  return `# 落地页审核与迭代总报告\n\n- 落地页 ID：\`${final.landingId}\`\n- 落地页路径：\`${final.landingPath}\`\n- 访问地址（HTTP）：${final.targetUrl}\n- 本地文件路径：\`${final.targetLocalFilePath}\`\n- 浏览器直开链接（本地）：${final.targetLocalFileUrl}\n- 目标分：${final.minScore}\n- 最大迭代：${final.maxIterations}\n- 最终得分：**${final.finalScore}**\n- 最终风险：**${final.finalRisk}**\n- 是否达标：**${final.reachedTarget ? '是' : '否'}**\n- 总迭代轮次：${final.totalIterations}\n\n## 迭代总览\n\n| 轮次 | 得分 | 风险等级 | 问题数 | 审核报告 | 自动优化动作数 |\n|---|---:|---|---:|---|---:|\n${iterationRows}\n\n## 逐轮详情\n\n${iterationDetails}\n`;
}

function parseJsonObject(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch (_err) {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch (_err2) {
      return null;
    }
  }
}

function runProcess(cmd, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd: options.cwd || process.cwd(),
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('close', (code) => {
      resolve({ code: code ?? 0, stdout, stderr });
    });
  });
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;

    const [key, inlineValue] = token.slice(2).split('=');
    if (inlineValue !== undefined) {
      out[key] = inlineValue;
      continue;
    }

    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      out[key] = next;
      i += 1;
    } else {
      out[key] = true;
    }
  }
  return out;
}

function buildId(prefix) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${prefix}-${y}${m}${d}-${hh}${mm}${ss}`;
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

main().catch((err) => {
  console.error('[generate-audited-landing] failed:', err?.message || err);
  process.exitCode = 1;
});
