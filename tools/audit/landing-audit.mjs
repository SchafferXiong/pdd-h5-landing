import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import { repoRoot } from '../shared/paths.mjs';

const defaultConfig = {
  targetUrl: 'http://127.0.0.1:4173/apps/h5-main/index.html',
  mode: 'report_only',
  score: {
    threshold: 85,
    weights: {
      assetIntegrity: 22,
      layoutVisibility: 22,
      typographyReadability: 14,
      responsiveStability: 14,
      interactionConversion: 10,
      accessibilityBaseline: 8,
      disclosureCompliance: 10
    }
  },
  viewports: [
    { name: '360x780', width: 360, height: 780 },
    { name: '390x844', width: 390, height: 844 },
    { name: '430x932', width: 430, height: 932 }
  ],
  timing: {
    pageWaitMs: 1400,
    navigationTimeoutMs: 15000
  },
  selectors: {
    keyImages: ['#brandIconPrimary', 'img[data-brand-icon]'],
    logo: ['#brandIconPrimary', 'img[data-brand-icon]'],
    primaryCta: '#transformBtn',
    cta: '[data-cta], #transformBtn',
    text: ['#heroTitle', '#heroSub', '.brand-name', '.stage-phase', '#secondTitle', '.cap-title', '.cap-desc', '.btn'],
    fixed: ['.top-strip', '.sticky-cta-wrap', '.live-feed']
  },
  rules: {
    minLogoSize: { width: 32, height: 32 },
    minTapTarget: { width: 44, height: 44 },
    minBodyFontPx: 14,
    minButtonFontPx: 16,
    maxTitleLines: 3,
    overflowTolerancePx: 1
  },
  paramProbe: {
    scriptPath: 'apps/h5-main/assets/js/app.js',
    requiredPassthrough: ['src', 'campaign', 'channel', 'utm_source', 'utm_medium', 'utm_campaign'],
    requiredCustom: ['lp_source']
  },
  report: {
    visibility: 'public_only',
    hide_reasoning: true,
    language: 'zh-CN',
    require_optimization_suggestions: true,
    min_suggestions: 3,
    forbiddenTerms: [
      'internal_thoughts',
      'reasoning_chain',
      'step_by_step_thinking',
      '思考过程',
      '推理过程',
      'chain of thought',
      'cot'
    ]
  },
  output: {
    root: 'experiments/landing-compare-lab/analysis/audits'
  }
};

const severityRank = { P0: 0, P1: 1, P2: 2, P3: 3 };
const severityPenalty = { P0: 12, P1: 6, P2: 3, P3: 1.5 };

async function main() {
  const cli = parseArgs(process.argv.slice(2));
  const configPath = path.resolve(repoRoot, cli.config || 'config/landing-audit.config.json');

  const userConfig = await loadJsonIfExists(configPath);
  const config = deepMerge(defaultConfig, userConfig || {});

  if (cli.url) config.targetUrl = cli.url;
  if (cli.mode) config.mode = cli.mode;
  if (cli['output-root']) config.output.root = cli['output-root'];

  if (!['report_only', 'strict_block'].includes(config.mode)) {
    throw new Error(`Unsupported mode: ${config.mode}`);
  }

  const runId = buildRunId();
  const outputRoot = path.resolve(repoRoot, config.output.root);
  const runDir = path.resolve(outputRoot, runId);
  await fs.mkdir(runDir, { recursive: true });

  const serverHandle = await ensureLocalPreviewServer(config.targetUrl, repoRoot);

  const findings = [];
  const viewportResults = [];
  const evidenceScreens = [];

  const browser = await chromium.launch({ headless: true });

  try {
    for (const viewport of config.viewports) {
      const result = await auditViewport({ browser, viewport, config, runDir });
      viewportResults.push(result);
      evidenceScreens.push(...result.evidenceScreens);

      collectViewportFindings(result, findings, config);
    }

    const linkProbe = await probeLinkLogic(config, repoRoot);
    if (!linkProbe.ok) {
      findings.push({
        id: `param-probe-${runId}`,
        severity: 'P1',
        category: 'interactionConversion',
        title: '下载参数透传规则缺失或不完整',
        detail: `脚本检查未找到完整透传规则：${linkProbe.message}`,
        impact: '可能导致投放链路无法归因或渠道统计丢失。',
        action: '统一在下载 URL 构造逻辑中保留 UTM 透传并追加 lp_source。',
        selector: path.relative(repoRoot, linkProbe.scriptPath || config.paramProbe.scriptPath),
        viewport: 'all',
        evidence: path.relative(repoRoot, linkProbe.scriptPath || config.paramProbe.scriptPath)
      });
    }

    const dedupedFindings = dedupeFindings(findings);
    const categoryScores = computeCategoryScores(dedupedFindings, config.score.weights);
    const totalScore = Object.values(categoryScores).reduce((sum, item) => sum + item.score, 0);
    const hasP0 = dedupedFindings.some((f) => f.severity === 'P0');

    const riskLevel = resolveRiskLevel(totalScore, hasP0);
    const pass = !hasP0 && totalScore >= config.score.threshold;
    const blocked = config.mode === 'strict_block' ? !pass : false;

    const optimizationSuggestions = buildOptimizationSuggestions(dedupedFindings, config.report.min_suggestions);

    const baseResult = {
      runId,
      timestamp: new Date().toISOString(),
      target: config.targetUrl,
      targetPath: resolveTargetPath(config.targetUrl, repoRoot),
      targetLocalFilePath: resolveTargetLocalFilePath(config.targetUrl, repoRoot),
      targetLocalFileUrl: resolveTargetLocalFileUrl(config.targetUrl, repoRoot),
      mode: config.mode,
      pass,
      blocked,
      totalScore,
      threshold: config.score.threshold,
      riskLevel,
      categoryScores,
      findings: dedupedFindings,
      optimizationSuggestions,
      evidence: {
        screenshots: evidenceScreens,
        viewportResults
      },
      disclosurePolicy: {
        visibility: config.report.visibility,
        hide_reasoning: config.report.hide_reasoning,
        forbiddenTerms: config.report.forbiddenTerms,
        violations: []
      }
    };

    const markdown = renderMarkdownReport(baseResult, config, repoRoot, runDir);
    const violations = findForbiddenTerms(markdown, config.report.forbiddenTerms);
    if (violations.length > 0) {
      baseResult.disclosurePolicy.violations = violations;
      const comp = baseResult.categoryScores.disclosureCompliance;
      comp.score = Math.max(0, comp.score - 5);
      baseResult.totalScore = Object.values(baseResult.categoryScores).reduce((sum, item) => sum + item.score, 0);
      baseResult.riskLevel = resolveRiskLevel(baseResult.totalScore, hasP0);
    }

    const finalMarkdown = renderMarkdownReport(baseResult, config, repoRoot, runDir);

    const markdownPath = path.join(runDir, 'audit-report.md');
    const jsonPath = path.join(runDir, 'audit-result.json');

    await fs.writeFile(markdownPath, finalMarkdown, 'utf8');
    await fs.writeFile(jsonPath, `${JSON.stringify(baseResult, null, 2)}\n`, 'utf8');

    const summary = {
      runId,
      mode: config.mode,
      totalScore: baseResult.totalScore,
      riskLevel: baseResult.riskLevel,
      pass: baseResult.pass,
      blocked: baseResult.blocked,
      findings: baseResult.findings.length,
      markdownReport: path.relative(repoRoot, markdownPath),
      jsonReport: path.relative(repoRoot, jsonPath)
    };

    console.log(JSON.stringify(summary, null, 2));

    if (config.mode === 'strict_block' && baseResult.blocked) {
      process.exitCode = 2;
    }
  } finally {
    await browser.close();
    if (serverHandle) {
      serverHandle.kill('SIGTERM');
    }
  }
}

async function auditViewport({ browser, viewport, config, runDir }) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height }
  });

  const page = await context.newPage();
  page.setDefaultTimeout(config.timing.navigationTimeoutMs);

  await page.goto(config.targetUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(config.timing.pageWaitMs);

  const auditData = await page.evaluate((runtime) => {
    const selectors = runtime.selectors;
    const rules = runtime.rules;

    const uniq = (arr) => [...new Set(arr)];

    const isVisible = (el) => {
      if (!el) return false;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return false;
      if (rect.bottom <= 0 || rect.right <= 0 || rect.top >= window.innerHeight || rect.left >= window.innerWidth) return false;
      return true;
    };

    const rectData = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        left: r.left,
        top: r.top,
        right: r.right,
        bottom: r.bottom,
        width: r.width,
        height: r.height
      };
    };

    const intersectionArea = (a, b) => {
      const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
      const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      return x * y;
    };

    const isOccluded = (el) => {
      if (!el || !isVisible(el)) return false;
      const rect = el.getBoundingClientRect();
      const points = [
        [rect.left + rect.width / 2, rect.top + rect.height / 2],
        [rect.left + Math.max(2, rect.width * 0.15), rect.top + rect.height / 2],
        [rect.right - Math.max(2, rect.width * 0.15), rect.top + rect.height / 2],
        [rect.left + rect.width / 2, rect.top + Math.max(2, rect.height * 0.15)],
        [rect.left + rect.width / 2, rect.bottom - Math.max(2, rect.height * 0.15)]
      ];

      return points.some(([x, y]) => {
        if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) return false;
        const topEl = document.elementFromPoint(x, y);
        if (!topEl) return false;
        return topEl !== el && !el.contains(topEl);
      });
    };

    const getLabel = (el) => {
      if (!el) return '(missing)';
      const id = el.id ? `#${el.id}` : '';
      const cls = el.className && typeof el.className === 'string' ? `.${el.className.trim().replace(/\s+/g, '.')}` : '';
      return `${el.tagName.toLowerCase()}${id}${cls}`;
    };

    const images = Array.from(document.images).map((img) => ({
      src: img.currentSrc || img.src || '',
      complete: img.complete,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      visible: isVisible(img),
      rect: rectData(img),
      label: getLabel(img)
    }));

    const brokenImages = images.filter((img) => img.visible && img.complete && (img.naturalWidth === 0 || img.naturalHeight === 0));

    const keyImageNodes = selectors.keyImages.flatMap((sel) => Array.from(document.querySelectorAll(sel)));
    const uniqueKeyImageNodes = uniq(keyImageNodes);
    const missingKeyImages = selectors.keyImages.filter((sel) => !document.querySelector(sel));
    const brokenKeyImages = uniqueKeyImageNodes
      .map((el) => ({
        selector: getLabel(el),
        complete: el.complete,
        naturalWidth: el.naturalWidth,
        naturalHeight: el.naturalHeight,
        visible: isVisible(el)
      }))
      .filter((it) => it.visible && it.complete && (it.naturalWidth === 0 || it.naturalHeight === 0));

    const logoNodes = selectors.logo.flatMap((sel) => Array.from(document.querySelectorAll(sel)));
    const uniqueLogoNodes = uniq(logoNodes);
    const visibleLogos = uniqueLogoNodes
      .map((el) => ({
        label: getLabel(el),
        visible: isVisible(el),
        rect: rectData(el)
      }))
      .filter((item) => item.visible);

    const logosWithEnoughSize = visibleLogos.filter((item) => item.rect.width >= rules.minLogoSize.width && item.rect.height >= rules.minLogoSize.height);

    const primaryCta = document.querySelector(selectors.primaryCta);
    const primaryCtaData = {
      exists: Boolean(primaryCta),
      visible: isVisible(primaryCta),
      label: primaryCta ? getLabel(primaryCta) : selectors.primaryCta,
      rect: rectData(primaryCta),
      occluded: isOccluded(primaryCta)
    };

    const allCtas = Array.from(document.querySelectorAll(selectors.cta));
    const ctaIssues = allCtas
      .filter((el) => isVisible(el))
      .map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          label: getLabel(el),
          text: (el.textContent || '').trim().slice(0, 80),
          width: rect.width,
          height: rect.height,
          smallTapTarget: rect.width < rules.minTapTarget.width || rect.height < rules.minTapTarget.height,
          occluded: isOccluded(el)
        };
      });

    const textNodes = selectors.text.flatMap((sel) => Array.from(document.querySelectorAll(sel)));
    const uniqueTextNodes = uniq(textNodes);

    const textOverflow = uniqueTextNodes
      .filter((el) => isVisible(el))
      .map((el) => {
        const overflowX = el.scrollWidth - el.clientWidth;
        const overflowY = el.scrollHeight - el.clientHeight;
        return {
          label: getLabel(el),
          text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 90),
          overflowX,
          overflowY,
          hasOverflow: overflowX > rules.overflowTolerancePx || overflowY > rules.overflowTolerancePx
        };
      })
      .filter((item) => item.hasOverflow);

    const typographyIssues = uniqueTextNodes
      .filter((el) => isVisible(el))
      .map((el) => {
        const style = window.getComputedStyle(el);
        const fontSize = Number.parseFloat(style.fontSize) || 0;
        let lineHeight = Number.parseFloat(style.lineHeight);
        if (Number.isNaN(lineHeight)) lineHeight = fontSize * 1.2;
        const ratio = fontSize > 0 ? lineHeight / fontSize : 0;
        const isButtonLike = el.tagName.toLowerCase() === 'button' || el.className.toLowerCase().includes('btn');
        const minFont = isButtonLike ? rules.minButtonFontPx : rules.minBodyFontPx;
        const issues = [];

        if (fontSize < minFont) {
          issues.push(`font-size ${fontSize.toFixed(1)}px < ${minFont}px`);
        }

        if (ratio < 1.2 || ratio > 2.0) {
          issues.push(`line-height ratio ${ratio.toFixed(2)} out of [1.20, 2.00]`);
        }

        return {
          label: getLabel(el),
          text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80),
          fontSize,
          lineHeight,
          ratio,
          issues
        };
      })
      .filter((item) => item.issues.length > 0);

    const heroTitleNode = document.querySelector('#heroTitle');
    let heroTitleLines = null;
    if (heroTitleNode && isVisible(heroTitleNode)) {
      const rect = heroTitleNode.getBoundingClientRect();
      const style = window.getComputedStyle(heroTitleNode);
      let lineHeight = Number.parseFloat(style.lineHeight);
      if (Number.isNaN(lineHeight)) {
        const fontSize = Number.parseFloat(style.fontSize) || 0;
        lineHeight = fontSize * 1.2;
      }
      heroTitleLines = lineHeight > 0 ? Math.round(rect.height / lineHeight) : null;
    }

    const scrollingEl = document.scrollingElement || document.documentElement;
    const horizontalOverflow = {
      hasOverflow: scrollingEl.scrollWidth > scrollingEl.clientWidth + rules.overflowTolerancePx,
      scrollWidth: scrollingEl.scrollWidth,
      clientWidth: scrollingEl.clientWidth
    };

    const fixedNodes = selectors.fixed
      .flatMap((sel) => Array.from(document.querySelectorAll(sel)))
      .filter((el) => isVisible(el));

    const fixedOverlaps = [];
    for (let i = 0; i < fixedNodes.length; i += 1) {
      for (let j = i + 1; j < fixedNodes.length; j += 1) {
        const a = fixedNodes[i].getBoundingClientRect();
        const b = fixedNodes[j].getBoundingClientRect();
        const area = intersectionArea(a, b);
        if (area > 0) {
          fixedOverlaps.push({
            a: getLabel(fixedNodes[i]),
            b: getLabel(fixedNodes[j]),
            overlapArea: area
          });
        }
      }
    }

    const reducedMotionRuleFound = (() => {
      for (const sheet of Array.from(document.styleSheets)) {
        let ruleset = null;
        try {
          ruleset = sheet.cssRules;
        } catch (_err) {
          continue;
        }

        if (!ruleset) continue;
        for (const rule of Array.from(ruleset)) {
          if ('media' in rule && rule.media?.mediaText?.includes('prefers-reduced-motion')) {
            return true;
          }
        }
      }
      return false;
    })();

    return {
      brokenImages,
      missingKeyImages,
      brokenKeyImages,
      logos: {
        visibleCount: visibleLogos.length,
        enoughSizeCount: logosWithEnoughSize.length,
        samples: visibleLogos.slice(0, 5)
      },
      primaryCta: primaryCtaData,
      ctaIssues,
      textOverflow,
      typographyIssues,
      heroTitleLines,
      horizontalOverflow,
      fixedOverlaps,
      reducedMotionRuleFound,
      meta: {
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight
      }
    };
  }, { selectors: config.selectors, rules: config.rules });

  const viewName = viewport.name;
  const viewShot = path.join(runDir, `view-${viewName}.png`);
  const fullShot = path.join(runDir, `full-${viewName}.png`);

  await page.screenshot({ path: viewShot, fullPage: false });
  await page.screenshot({ path: fullShot, fullPage: true });

  await context.close();

  return {
    viewport: viewName,
    width: viewport.width,
    height: viewport.height,
    auditData,
    evidenceScreens: [
      { viewport: viewName, type: 'view', path: viewShot },
      { viewport: viewName, type: 'full', path: fullShot }
    ]
  };
}

function collectViewportFindings(result, findings, config) {
  const { viewport, auditData } = result;

  if (auditData.brokenImages.length > 0) {
    findings.push({
      id: `broken-image-${viewport}`,
      severity: 'P0',
      category: 'assetIntegrity',
      title: '存在破图或空图资源',
      detail: `检测到 ${auditData.brokenImages.length} 个可见图片资源加载异常。`,
      impact: '关键视觉或品牌素材可能无法展示，直接影响信任与转化。',
      action: '修复图片路径并补充 onerror 占位策略，确保失败时不出现浏览器破图图标。',
      selector: auditData.brokenImages[0]?.label || '(image)',
      viewport,
      evidence: `view-${viewport}.png`
    });
  }

  if (auditData.missingKeyImages.length > 0) {
    findings.push({
      id: `missing-key-image-${viewport}`,
      severity: 'P1',
      category: 'assetIntegrity',
      title: '关键图片节点缺失',
      detail: `未匹配到关键图片选择器：${auditData.missingKeyImages.join(', ')}。`,
      impact: '品牌识别或核心素材可能缺失，降低页面完整性。',
      action: '恢复关键图片节点并确保资源地址有效。',
      selector: auditData.missingKeyImages[0],
      viewport,
      evidence: `view-${viewport}.png`
    });
  }

  if (auditData.brokenKeyImages.length > 0) {
    findings.push({
      id: `broken-key-image-${viewport}`,
      severity: 'P0',
      category: 'assetIntegrity',
      title: '关键品牌图片加载失败',
      detail: `关键图片 ${auditData.brokenKeyImages[0].selector} 加载失败。`,
      impact: '品牌曝光位失效会显著降低品牌感知。',
      action: '优先修复品牌图片资源并增加本地兜底资源。',
      selector: auditData.brokenKeyImages[0].selector,
      viewport,
      evidence: `view-${viewport}.png`
    });
  }

  if (auditData.logos.visibleCount === 0) {
    findings.push({
      id: `logo-missing-${viewport}`,
      severity: 'P0',
      category: 'assetIntegrity',
      title: '未检测到可见 App Logo',
      detail: '首屏范围内未找到可见的品牌 Logo。',
      impact: '用户无法在首屏建立品牌识别。',
      action: '在首屏固定位置补充 Logo，并确保图片可见与加载成功。',
      selector: config.selectors.logo[0],
      viewport,
      evidence: `view-${viewport}.png`
    });
  } else if (auditData.logos.enoughSizeCount === 0) {
    findings.push({
      id: `logo-small-${viewport}`,
      severity: 'P1',
      category: 'assetIntegrity',
      title: 'Logo 可见但尺寸不达标',
      detail: `可见 Logo 存在，但未达到最小建议尺寸 ${config.rules.minLogoSize.width}x${config.rules.minLogoSize.height}px。`,
      impact: '品牌位存在但辨识度不足。',
      action: '提升首屏主 Logo 尺寸或调整摆位，保证在首屏快速识别。',
      selector: auditData.logos.samples[0]?.label || config.selectors.logo[0],
      viewport,
      evidence: `view-${viewport}.png`
    });
  }

  if (!auditData.primaryCta.exists || !auditData.primaryCta.visible) {
    findings.push({
      id: `cta-missing-${viewport}`,
      severity: 'P0',
      category: 'interactionConversion',
      title: '首屏主 CTA 不可见或缺失',
      detail: '主 CTA 在当前视口未被检测到可见状态。',
      impact: '用户无法完成核心转化动作。',
      action: '将主 CTA 保持在首屏可见区域，避免被滚动或动画状态隐藏。',
      selector: config.selectors.primaryCta,
      viewport,
      evidence: `view-${viewport}.png`
    });
  }

  if (auditData.primaryCta.exists && auditData.primaryCta.visible) {
    if (auditData.primaryCta.occluded) {
      findings.push({
        id: `cta-occluded-${viewport}`,
        severity: 'P0',
        category: 'layoutVisibility',
        title: '主 CTA 被其他元素遮挡',
        detail: `${auditData.primaryCta.label} 存在遮挡风险。`,
        impact: '主转化入口可点区域受阻，直接影响点击率。',
        action: '调整固定层 z-index 与底部安全区，确保 CTA 不被覆盖。',
        selector: auditData.primaryCta.label,
        viewport,
        evidence: `view-${viewport}.png`
      });
    }

    const rect = auditData.primaryCta.rect;
    if (rect && (rect.width < config.rules.minTapTarget.width || rect.height < config.rules.minTapTarget.height)) {
      findings.push({
        id: `cta-small-${viewport}`,
        severity: 'P1',
        category: 'interactionConversion',
        title: '主 CTA 触控尺寸不足',
        detail: `主 CTA 当前尺寸 ${Math.round(rect.width)}x${Math.round(rect.height)}px，小于建议触控尺寸。`,
        impact: '移动端点击命中率下降，易误触。',
        action: `将主 CTA 最小尺寸提升至 ${config.rules.minTapTarget.width}x${config.rules.minTapTarget.height}px 以上。`,
        selector: auditData.primaryCta.label,
        viewport,
        evidence: `view-${viewport}.png`
      });
    }
  }

  const smallCtas = auditData.ctaIssues.filter((item) => item.smallTapTarget);
  if (smallCtas.length > 0) {
    findings.push({
      id: `small-cta-${viewport}`,
      severity: 'P2',
      category: 'accessibilityBaseline',
      title: '存在触控尺寸偏小的按钮',
      detail: `检测到 ${smallCtas.length} 个 CTA 触控尺寸不足。`,
      impact: '影响可点击性与无障碍体验。',
      action: '统一 CTA 的最小高度和左右内边距，保障触控尺寸达标。',
      selector: smallCtas[0].label,
      viewport,
      evidence: `view-${viewport}.png`
    });
  }

  const occludedCtas = auditData.ctaIssues.filter((item) => item.occluded);
  if (occludedCtas.length > 0) {
    findings.push({
      id: `occluded-cta-${viewport}`,
      severity: 'P1',
      category: 'layoutVisibility',
      title: '存在被遮挡的转化按钮',
      detail: `检测到 ${occludedCtas.length} 个 CTA 遮挡风险。`,
      impact: '部分转化入口可能无法稳定触达。',
      action: '重新梳理 fixed/sticky 元素层级，避免遮挡交互控件。',
      selector: occludedCtas[0].label,
      viewport,
      evidence: `view-${viewport}.png`
    });
  }

  if (auditData.textOverflow.length > 0) {
    findings.push({
      id: `text-overflow-${viewport}`,
      severity: 'P1',
      category: 'layoutVisibility',
      title: '检测到文本裁切或容器溢出',
      detail: `检测到 ${auditData.textOverflow.length} 处文本存在裁切或溢出。`,
      impact: '用户读取关键信息受阻，影响内容理解。',
      action: '调整文本容器宽度、行高与换行策略，必要时限制文案长度。',
      selector: auditData.textOverflow[0].label,
      viewport,
      evidence: `view-${viewport}.png`
    });
  }

  if (typeof auditData.heroTitleLines === 'number' && auditData.heroTitleLines > config.rules.maxTitleLines) {
    findings.push({
      id: `title-lines-${viewport}`,
      severity: 'P2',
      category: 'typographyReadability',
      title: '主标题换行层数偏多',
      detail: `主标题约 ${auditData.heroTitleLines} 行，超过建议上限 ${config.rules.maxTitleLines} 行。`,
      impact: '首屏视觉聚焦被削弱，节奏感下降。',
      action: '缩短主标题或调整字号/容器宽度，控制在 2-3 行。',
      selector: '#heroTitle',
      viewport,
      evidence: `view-${viewport}.png`
    });
  }

  if (auditData.typographyIssues.length > 0) {
    findings.push({
      id: `typography-${viewport}`,
      severity: 'P2',
      category: 'typographyReadability',
      title: '发现字号或行高不协调',
      detail: `检测到 ${auditData.typographyIssues.length} 处排版参数异常。`,
      impact: '影响阅读舒适度与页面精致感。',
      action: '统一字号梯度与行高比例，正文建议 >=14px，按钮建议 >=16px。',
      selector: auditData.typographyIssues[0].label,
      viewport,
      evidence: `view-${viewport}.png`
    });
  }

  if (auditData.horizontalOverflow.hasOverflow) {
    findings.push({
      id: `horizontal-overflow-${viewport}`,
      severity: 'P1',
      category: 'responsiveStability',
      title: '页面出现横向溢出',
      detail: `scrollWidth ${auditData.horizontalOverflow.scrollWidth}px > clientWidth ${auditData.horizontalOverflow.clientWidth}px。`,
      impact: '移动端会出现横向滚动，破坏阅读与交互体验。',
      action: '排查超宽元素并限制最大宽度，确保小屏无横向滚动。',
      selector: 'html, body',
      viewport,
      evidence: `full-${viewport}.png`
    });
  }

  if (auditData.fixedOverlaps.length > 0) {
    findings.push({
      id: `fixed-overlap-${viewport}`,
      severity: 'P1',
      category: 'layoutVisibility',
      title: '固定层存在重叠冲突',
      detail: `检测到 ${auditData.fixedOverlaps.length} 组 fixed/sticky 元素重叠。`,
      impact: '可能遮挡信息或交互按钮。',
      action: '梳理 fixed 元素堆叠顺序与安全区边距，避免重叠。',
      selector: `${auditData.fixedOverlaps[0].a} + ${auditData.fixedOverlaps[0].b}`,
      viewport,
      evidence: `view-${viewport}.png`
    });
  }

  if (!auditData.reducedMotionRuleFound) {
    findings.push({
      id: `reduced-motion-${viewport}`,
      severity: 'P2',
      category: 'accessibilityBaseline',
      title: '缺少 reduced-motion 降级规则',
      detail: '未检测到 prefers-reduced-motion 媒体查询。',
      impact: '对动效敏感用户的可访问性体验下降。',
      action: '补充 prefers-reduced-motion 降级规则，降低动画时长或关闭复杂动效。',
      selector: 'style.css',
      viewport,
      evidence: `view-${viewport}.png`
    });
  }
}

function dedupeFindings(findings) {
  const map = new Map();

  for (const finding of findings) {
    const key = `${finding.title}|${finding.viewport}|${finding.selector}`;
    const current = map.get(key);
    if (!current) {
      map.set(key, finding);
      continue;
    }

    if (severityRank[finding.severity] < severityRank[current.severity]) {
      map.set(key, finding);
    }
  }

  return Array.from(map.values()).sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}

function computeCategoryScores(findings, weights) {
  const out = {};
  for (const [category, maxScore] of Object.entries(weights)) {
    out[category] = { score: maxScore, max: maxScore };
  }

  for (const finding of findings) {
    const bucket = out[finding.category];
    if (!bucket) continue;
    const penalty = severityPenalty[finding.severity] || 1;
    bucket.score = Math.max(0, Number((bucket.score - penalty).toFixed(1)));
  }

  for (const value of Object.values(out)) {
    value.score = Number(value.score.toFixed(1));
  }

  return out;
}

function resolveRiskLevel(totalScore, hasP0) {
  if (hasP0) return 'critical';
  if (totalScore >= 90) return 'low';
  if (totalScore >= 85) return 'medium';
  if (totalScore >= 70) return 'high';
  return 'critical';
}

function buildOptimizationSuggestions(findings, minSuggestions) {
  const expectedGainByCategory = {
    assetIntegrity: '提升品牌可信度与首屏完整性',
    layoutVisibility: '降低遮挡风险并提升信息可达性',
    typographyReadability: '提升可读性与视觉质量',
    responsiveStability: '提升多机型稳定性',
    interactionConversion: '提升点击率与转化效率',
    accessibilityBaseline: '提升可访问性与触达范围',
    disclosureCompliance: '提升报告可披露合规性'
  };

  const suggestions = [];
  const used = new Set();

  for (const finding of findings) {
    const key = `${finding.category}|${finding.title}`;
    if (used.has(key)) continue;
    used.add(key);

    suggestions.push({
      priority: finding.severity,
      issue: finding.title,
      action: finding.action,
      expected_gain: expectedGainByCategory[finding.category] || '提升落地页整体质量'
    });

    if (suggestions.length >= Math.max(minSuggestions, 5)) break;
  }

  const fallback = [
    {
      priority: 'P1',
      issue: '关键图片缺少加载兜底策略',
      action: '为关键图片补充 onerror 占位与本地后备资源，避免出现破图图标。',
      expected_gain: '提升首屏稳定性与品牌信任度'
    },
    {
      priority: 'P2',
      issue: '文案长度与容器约束可能不匹配',
      action: '为标题和正文设置最大行数与自适应字号策略，规避异常换行。',
      expected_gain: '提升阅读流畅度与视觉一致性'
    },
    {
      priority: 'P2',
      issue: '固定层与主内容层级可能冲突',
      action: '梳理 z-index 分层规范并统一底部安全区间距。',
      expected_gain: '提升交互稳定性并减少误触'
    }
  ];

  for (const item of fallback) {
    if (suggestions.length >= minSuggestions) break;
    suggestions.push(item);
  }

  return suggestions.slice(0, Math.max(minSuggestions, 3));
}

function renderMarkdownReport(result, config, repoRoot, runDir) {
  const categoryName = {
    assetIntegrity: '视觉资源完整性',
    layoutVisibility: '布局完整性与无遮挡',
    typographyReadability: '排版与可读性',
    responsiveStability: '响应式稳定性',
    interactionConversion: '交互与转化链路',
    accessibilityBaseline: '可访问性基线',
    disclosureCompliance: '披露合规'
  };

  const findingLines = result.findings.length
    ? result.findings
        .map((f, index) => {
          return [
            `${index + 1}. **[${f.severity}] ${f.title}** (${categoryName[f.category] || f.category})`,
            `现象：${f.detail}`,
            `影响：${f.impact}`,
            `建议：${f.action}`,
            `证据：\`${f.evidence}\`（视口：${f.viewport}）`
          ].join('\n');
        })
        .join('\n\n')
    : '未检测到高优先级问题。';

  const screenshots = result.evidence.screenshots
    .map((item) => {
      const rel = path.relative(repoRoot, item.path);
      return `- ${item.viewport} ${item.type}: \`${rel}\``;
    })
    .join('\n');

  const scoreTable = Object.entries(result.categoryScores)
    .map(([key, value]) => `| ${categoryName[key] || key} | ${value.score} | ${value.max} |`)
    .join('\n');

  const suggestionTable = result.optimizationSuggestions
    .map((s) => `| ${s.priority} | ${s.issue} | ${s.action} | ${s.expected_gain} |`)
    .join('\n');

  const reportPath = path.relative(repoRoot, runDir);
  const statusText = result.pass ? '通过（建议继续优化）' : '未达标（本阶段仅报告，不阻断）';

  return `# H5 落地页审核报告\n\n- 运行 ID：\`${result.runId}\`\n- 审核时间：${result.timestamp}\n- 审核模式：\`${result.mode}\`\n- 目标页面（HTTP）：${result.target}\n- 目标路径：\`${result.targetPath}\`\n- 本地文件路径：\`${result.targetLocalFilePath || '(unknown)'}\`\n- 浏览器直开链接（本地）：${result.targetLocalFileUrl || '(unavailable)'}\n- 结论：**${statusText}**\n- 报告目录：\`${reportPath}\`\n\n## 总分与风险等级\n\n- 总分：**${result.totalScore} / 100**\n- 风险等级：**${result.riskLevel}**\n- 评分阈值：${result.threshold}\n\n| 维度 | 得分 | 满分 |\n|---|---:|---:|\n${scoreTable}\n\n## 关键问题列表\n\n${findingLines}\n\n## 证据截图\n\n${screenshots}\n\n## 优化建议\n\n| 优先级 | 问题 | 修复动作 | 预期收益 |\n|---|---|---|---|\n${suggestionTable}\n\n## 下一步动作\n\n1. 优先修复 P0/P1 问题并复跑审核。\n2. 根据优化建议完成排版与响应式微调。\n3. 在连续两次审核总分 >= ${result.threshold} 后再进入投放或提审流程。\n`;
}

function findForbiddenTerms(text, terms) {
  const content = text.toLowerCase();
  return terms.filter((term) => content.includes(term.toLowerCase()));
}

function resolveTargetPath(targetUrl, root) {
  try {
    const parsed = new URL(targetUrl);
    const pathname = decodeURIComponent(parsed.pathname || '');
    if (!pathname) return '(unknown)';
    return pathname.startsWith('/') ? pathname : `/${pathname}`;
  } catch (_err) {
    const abs = path.resolve(root, targetUrl);
    return path.relative(root, abs);
  }
}

function resolveTargetLocalFilePath(targetUrl, root) {
  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol === 'file:') {
      return path.resolve(decodeURIComponent(parsed.pathname));
    }
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      const pathname = decodeURIComponent(parsed.pathname || '');
      if (!pathname || pathname === '/') return null;
      return path.resolve(root, `.${pathname}`);
    }
    return null;
  } catch (_err) {
    return path.resolve(root, targetUrl);
  }
}

function resolveTargetLocalFileUrl(targetUrl, root) {
  const filePath = resolveTargetLocalFilePath(targetUrl, root);
  if (!filePath) return null;
  return pathToFileURL(filePath).href;
}

async function probeLinkLogic(config, root) {
  const scriptPath = path.resolve(root, config.paramProbe.scriptPath);
  if (!existsSync(scriptPath)) {
    return {
      ok: false,
      message: `脚本文件不存在：${scriptPath}`,
      scriptPath
    };
  }

  const source = await fs.readFile(scriptPath, 'utf8');

  const missingCustom = (config.paramProbe.requiredCustom || []).filter((key) => !source.includes(`'${key}'`) && !source.includes(`"${key}"`));
  const missingPass = (config.paramProbe.requiredPassthrough || []).filter((key) => !source.includes(`'${key}'`) && !source.includes(`"${key}"`));

  if (missingCustom.length === 0 && missingPass.length === 0) {
    return { ok: true, message: '参数透传规则匹配', scriptPath };
  }

  const chunks = [];
  if (missingCustom.length) chunks.push(`缺少自定义参数: ${missingCustom.join(', ')}`);
  if (missingPass.length) chunks.push(`缺少透传参数: ${missingPass.join(', ')}`);

  return {
    ok: false,
    message: chunks.join('；'),
    scriptPath
  };
}

async function ensureLocalPreviewServer(targetUrl, cwd) {
  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch (_err) {
    return null;
  }

  if (!['127.0.0.1', 'localhost'].includes(parsed.hostname)) {
    return null;
  }

  const reachable = await pingUrl(targetUrl);
  if (reachable) return null;

  const port = Number(parsed.port || 80);
  const server = spawn('python3', ['-m', 'http.server', String(port)], {
    cwd,
    stdio: 'ignore'
  });

  const started = await waitUntil(async () => pingUrl(targetUrl), 7000, 280);
  if (!started) {
    server.kill('SIGTERM');
    throw new Error(`无法启动本地预览服务: ${targetUrl}`);
  }

  return server;
}

async function pingUrl(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1200);

  try {
    const response = await fetch(url, { method: 'GET', signal: controller.signal });
    return response.ok;
  } catch (_err) {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function waitUntil(fn, timeoutMs, pollMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ok = await fn();
    if (ok) return true;
    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }
  return false;
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

async function loadJsonIfExists(filePath) {
  if (!existsSync(filePath)) return null;

  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

function deepMerge(base, incoming) {
  const out = { ...base };

  for (const [key, value] of Object.entries(incoming)) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      key in out &&
      out[key] &&
      typeof out[key] === 'object' &&
      !Array.isArray(out[key])
    ) {
      out[key] = deepMerge(out[key], value);
      continue;
    }

    out[key] = value;
  }

  return out;
}

function buildRunId() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `audit-${y}${m}${d}-${hh}${mm}${ss}`;
}

main().catch((err) => {
  console.error('[audit-landing] failed:', err?.message || err);
  process.exitCode = 1;
});
