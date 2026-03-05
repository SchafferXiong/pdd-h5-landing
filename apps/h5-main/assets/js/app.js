(() => {
  const defaultConfig = {
    downloadUrl: 'https://app.mi.com/details?id=com.aliyun.tongyi',
    trialSeconds: 119,
    brand: {
      name: '千问 App',
      iconUrl: '/assets/img/generated/qianwen-app-icon-192.png',
      iconAlt: '千问 App 图标'
    },
    animationDurations: {
      absorbMs: 900,
      synthMs: 1200,
      explodeMs: 900
    },
    tickerIntervalMs: 2200,
    copy: {
      heroKicker: '碎片变精华',
      heroTitle: '上传文件，一键出报告',
      heroSub: '几秒提炼摘要、关键词、结构化报告',
      ctaText: '上传文件，一键出报告',
      readyButtonText: '下载千问，查看完整报告',
      secondTitle: '不止文档摘要，千问还能一键完成更多办公任务'
    },
    capabilities: [
      {
        title: '写作生成',
        desc: '输入主题和口吻，几秒生成可直接编辑的结构化初稿。',
        badge: '写作',
        flow: '输入主题 -> 生成初稿'
      },
      {
        title: 'PPT 生成',
        desc: '自动拆解章节，输出封面、目录、核心页的讲述提纲。',
        badge: 'PPT',
        flow: '输入目标 -> 一键成稿'
      },
      {
        title: '表格整理',
        desc: '自动识别原始数据，补齐字段并生成可复用统计视图。',
        badge: '表格',
        flow: '上传数据 -> 自动归档'
      },
      {
        title: '周报输出',
        desc: '提取本周关键进展、风险与下周计划，一键形成周报。',
        badge: '周报',
        flow: '输入素材 -> 周报成稿'
      }
    ],
    couponPool: ['7 天高级版', 'PPT 模板礼包', '100 次文件解析', '写作增强包']
  };

  const userConfig =
    window.__QIANWEN_H5_CONFIG && typeof window.__QIANWEN_H5_CONFIG === 'object'
      ? window.__QIANWEN_H5_CONFIG
      : {};
  const config = mergeConfig(defaultConfig, userConfig);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const durations = {
    absorb: sanitizeDuration(config.animationDurations.absorbMs, defaultConfig.animationDurations.absorbMs, reduceMotion),
    synth: sanitizeDuration(config.animationDurations.synthMs, defaultConfig.animationDurations.synthMs, reduceMotion),
    explode: sanitizeDuration(config.animationDurations.explodeMs, defaultConfig.animationDurations.explodeMs, reduceMotion)
  };

  const el = {
    pageRoot: document.getElementById('pageRoot'),
    brandName: document.getElementById('brandName'),
    heroKicker: document.querySelector('.hero-kicker'),
    heroTitle: document.getElementById('heroTitle'),
    heroSub: document.getElementById('heroSub'),
    trialChip: document.getElementById('trialChip'),
    trialCountdown: document.getElementById('trialCountdown'),
    transformStage: document.getElementById('transformStage'),
    stagePhase: document.getElementById('stagePhase'),
    synthProgress: document.getElementById('synthProgress'),
    summaryText: document.getElementById('summaryText'),
    keywordList: document.getElementById('keywordList'),
    reportTitle: document.getElementById('reportTitle'),
    reportBullets: document.getElementById('reportBullets'),
    transformBtn: document.getElementById('transformBtn'),
    heroDownloadBtn: document.getElementById('heroDownloadBtn'),
    capabilityTitle: document.getElementById('secondTitle'),
    capabilityList: document.getElementById('capabilityList'),
    liveFeedTrack: document.getElementById('liveFeedTrack'),
    feedLineTop: document.getElementById('feedLineTop'),
    feedLineBottom: document.getElementById('feedLineBottom')
  };

  if (!el.pageRoot || !el.transformStage) return;

  const resultPool = {
    summaries: [
      '已从 28 页资料中提炼 3 条决策结论，并自动标注执行优先级。',
      '已将会议纪要压缩为 6 行可执行结论，附带负责人与时间节点。',
      '已把多源文档合并成一份结构化报告，保留关键证据和风险提示。',
      '已从项目素材中抽取核心洞察，生成便于汇报的一页摘要版本。'
    ],
    keywords: [
      ['目标拆解', '执行节点', '风险预警', '负责人'],
      ['数据结论', '预算控制', '时程推进', '交付标准'],
      ['客户诉求', '方案亮点', '竞争对比', '行动建议'],
      ['会议决策', '资源协同', '版本节奏', '复盘指标']
    ],
    reportTitles: ['《季度推进精华版》', '《项目评审速览版》', '《业务调研压缩版》', '《会议纪要可执行版》'],
    reportBullets: [
      ['结论先行，2 分钟读完核心要点', '关键词自动聚类，保留原始出处', '导出版式适合直接汇报'],
      ['自动生成执行清单与风险提醒', '保留关键数字并统一口径', '可继续扩展为完整报告'],
      ['面向管理层的摘要结构', '重点信息按优先级排序', '支持后续一键补全细节'],
      ['任务归属、截止时间自动提取', '会议决议转为待办事项', '一键生成分享版报告']
    ]
  };

  const tickerPool = {
    docTypes: ['市场周报', '合同评审', '项目复盘', '需求文档', '竞品分析', '投标方案'],
    couponPool: Array.isArray(config.couponPool) && config.couponPool.length > 0 ? config.couponPool : defaultConfig.couponPool
  };

  const state = {
    phase: 'idle',
    running: false,
    trialSeconds: sanitizeNonNegative(config.trialSeconds, defaultConfig.trialSeconds),
    countdownTimerId: 0,
    tickerTimerId: 0,
    tickerRollingId: 0,
    transformTimers: []
  };

  applyCopy();
  applyBrand();
  renderCapabilities();
  setStageDurations();
  writeInitialResult();
  writeInitialTicker();
  bindEvents();
  startCountdown();
  startTicker();

  window.addEventListener('pagehide', clearAllTimers);

  function mergeConfig(base, incoming) {
    const output = { ...base };

    Object.keys(incoming).forEach((key) => {
      const baseValue = output[key];
      const incomingValue = incoming[key];

      if (
        baseValue &&
        incomingValue &&
        typeof baseValue === 'object' &&
        typeof incomingValue === 'object' &&
        !Array.isArray(baseValue) &&
        !Array.isArray(incomingValue)
      ) {
        output[key] = mergeConfig(baseValue, incomingValue);
        return;
      }

      output[key] = incomingValue;
    });

    return output;
  }

  function sanitizeNonNegative(value, fallback) {
    const num = Number(value);
    if (!Number.isFinite(num)) return fallback;
    return Math.max(0, Math.floor(num));
  }

  function sanitizeDuration(value, fallback, reducedMotion) {
    const num = Number(value);
    const safe = Number.isFinite(num) ? Math.max(200, Math.floor(num)) : fallback;
    return reducedMotion ? 80 : safe;
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick(list) {
    return list[randomInt(0, list.length - 1)];
  }

  function buildMaskedPhone() {
    const prefixList = ['138', '137', '151', '186', '159', '133', '177', '188'];
    return `${pick(prefixList)}****${randomInt(1000, 9999)}`;
  }

  function stageCopy(phase) {
    const copyMap = {
      idle: '点击开始：文件吸入 AI，几秒生成精华报告',
      absorbing: '文件吸入中：正在捕捉文档核心信息...',
      synthesizing: '正在提炼关键信息，准备生成摘要与关键词...',
      exploding: '结果爆发中：摘要、关键词和排版报告即将完成',
      ready: '报告已生成：立即下载千问，体验完整 AI 办公流程'
    };

    return copyMap[phase] || copyMap.idle;
  }

  function applyCopy() {
    const copy = config.copy || {};

    if (el.heroKicker) el.heroKicker.textContent = copy.heroKicker || defaultConfig.copy.heroKicker;
    if (el.heroTitle) el.heroTitle.textContent = copy.heroTitle || defaultConfig.copy.heroTitle;
    if (el.heroSub) el.heroSub.textContent = copy.heroSub || defaultConfig.copy.heroSub;
    if (el.transformBtn) el.transformBtn.textContent = copy.ctaText || defaultConfig.copy.ctaText;
    if (el.heroDownloadBtn) el.heroDownloadBtn.textContent = copy.readyButtonText || defaultConfig.copy.readyButtonText;
    if (el.capabilityTitle) el.capabilityTitle.textContent = copy.secondTitle || defaultConfig.copy.secondTitle;
  }

  function applyBrand() {
    const brand = config.brand || {};
    const iconUrl = brand.iconUrl || defaultConfig.brand.iconUrl;
    const iconAlt = brand.iconAlt || defaultConfig.brand.iconAlt;

    if (el.brandName) {
      el.brandName.textContent = brand.name || defaultConfig.brand.name;
    }

    document.querySelectorAll('[data-brand-icon]').forEach((icon) => {
      if (!(icon instanceof HTMLImageElement)) return;
      icon.src = iconUrl;
      if (icon.getAttribute('alt') !== '') {
        icon.alt = iconAlt;
      }
    });
  }

  function setStageDurations() {
    el.transformStage.style.setProperty('--absorb-ms', `${durations.absorb}ms`);
    el.transformStage.style.setProperty('--synth-ms', `${durations.synth}ms`);
  }

  function renderCapabilities() {
    if (!el.capabilityList) return;

    const capabilities = Array.isArray(config.capabilities) && config.capabilities.length > 0 ? config.capabilities : defaultConfig.capabilities;
    const fragment = document.createDocumentFragment();

    capabilities.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'cap-card';

      const badge = document.createElement('p');
      badge.className = 'cap-badge';
      badge.textContent = item.badge || '能力';

      const title = document.createElement('h3');
      title.className = 'cap-title';
      title.textContent = item.title || 'AI 办公';

      const desc = document.createElement('p');
      desc.className = 'cap-desc';
      desc.textContent = item.desc || '输入目标后自动生成可用结果。';

      const flow = document.createElement('p');
      flow.className = 'cap-flow';
      flow.textContent = item.flow || '输入目标 -> 一键生成';

      card.append(badge, title, desc, flow);
      fragment.appendChild(card);
    });

    el.capabilityList.replaceChildren(fragment);
  }

  function writeInitialResult() {
    if (!el.keywordList || !el.reportBullets) return;

    renderKeywords(resultPool.keywords[0]);
    renderReportBullets(resultPool.reportBullets[0]);

    if (el.summaryText) {
      el.summaryText.textContent = '已准备好，点击开始生成';
    }

    if (el.reportTitle) {
      el.reportTitle.textContent = resultPool.reportTitles[0];
    }
  }

  function populateResultContent() {
    const index = randomInt(0, resultPool.summaries.length - 1);

    if (el.summaryText) {
      el.summaryText.textContent = resultPool.summaries[index];
    }

    if (el.reportTitle) {
      el.reportTitle.textContent = resultPool.reportTitles[index];
    }

    renderKeywords(resultPool.keywords[index]);
    renderReportBullets(resultPool.reportBullets[index]);
  }

  function renderKeywords(keywordList) {
    if (!el.keywordList) return;

    const fragment = document.createDocumentFragment();
    keywordList.forEach((word) => {
      const chip = document.createElement('span');
      chip.textContent = word;
      fragment.appendChild(chip);
    });

    el.keywordList.replaceChildren(fragment);
  }

  function renderReportBullets(bulletList) {
    if (!el.reportBullets) return;

    const fragment = document.createDocumentFragment();
    bulletList.forEach((point) => {
      const li = document.createElement('li');
      li.textContent = point;
      fragment.appendChild(li);
    });

    el.reportBullets.replaceChildren(fragment);
  }

  function setPhase(nextPhase) {
    const phaseClasses = ['is-absorbing', 'is-synthesizing', 'is-exploding', 'is-ready'];
    el.transformStage.classList.remove(...phaseClasses);

    if (nextPhase === 'absorbing') el.transformStage.classList.add('is-absorbing');
    if (nextPhase === 'synthesizing') el.transformStage.classList.add('is-synthesizing');
    if (nextPhase === 'exploding') el.transformStage.classList.add('is-exploding');
    if (nextPhase === 'ready') el.transformStage.classList.add('is-ready');

    state.phase = nextPhase;

    if (el.stagePhase) {
      el.stagePhase.textContent = stageCopy(nextPhase);
    }
  }

  function resetSynthProgress() {
    if (!el.synthProgress) return;

    el.synthProgress.style.transition = 'none';
    el.synthProgress.style.width = '0';
    void el.synthProgress.offsetWidth;
    el.synthProgress.style.transition = '';
  }

  function scheduleTransformStep(callback, delayMs) {
    const timerId = window.setTimeout(callback, delayMs);
    state.transformTimers.push(timerId);
  }

  function clearTransformTimers() {
    state.transformTimers.forEach((timerId) => window.clearTimeout(timerId));
    state.transformTimers = [];
  }

  function runTransformation(source) {
    if (state.running) return;

    state.running = true;
    clearTransformTimers();

    if (el.transformBtn) {
      el.transformBtn.disabled = true;
      el.transformBtn.textContent = '正在生成中...';
    }

    if (el.heroDownloadBtn) {
      el.heroDownloadBtn.hidden = true;
    }

    resetSynthProgress();
    setPhase('idle');
    void el.transformStage.offsetWidth;

    setPhase('absorbing');
    track('lp_transform_start', { source });

    scheduleTransformStep(() => {
      setPhase('synthesizing');
    }, durations.absorb);

    scheduleTransformStep(() => {
      populateResultContent();
      setPhase('exploding');
    }, durations.absorb + durations.synth);

    scheduleTransformStep(() => {
      setPhase('ready');
      state.running = false;

      if (el.transformBtn) {
        el.transformBtn.disabled = false;
        el.transformBtn.textContent = '再试一次，一键出报告';
      }

      if (el.heroDownloadBtn) {
        el.heroDownloadBtn.hidden = false;
      }

      track('lp_transform_ready', { source });
    }, durations.absorb + durations.synth + durations.explode);
  }

  function bindEvents() {
    if (el.transformBtn) {
      el.transformBtn.addEventListener('click', () => runTransformation('hero_button'));
    }

    el.transformStage.addEventListener('click', () => runTransformation('stage_tap'));
    el.transformStage.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      runTransformation('stage_keyboard');
    });

    document.querySelectorAll('[data-cta]').forEach((button) => {
      button.addEventListener('click', () => {
        goDownload(button.dataset.cta || 'unknown');
      });
    });
  }

  function writeInitialTicker() {
    if (!el.feedLineTop || !el.feedLineBottom) return;

    el.feedLineTop.textContent = buildTickerLine();
    el.feedLineBottom.textContent = buildTickerLine();
  }

  function startTicker() {
    const intervalMs = Math.max(1400, sanitizeNonNegative(config.tickerIntervalMs, defaultConfig.tickerIntervalMs));

    state.tickerTimerId = window.setInterval(() => {
      rollTicker();
    }, intervalMs);
  }

  function rollTicker() {
    if (!el.liveFeedTrack || !el.feedLineTop || !el.feedLineBottom) return;
    if (el.liveFeedTrack.classList.contains('is-rolling')) return;

    el.feedLineBottom.textContent = buildTickerLine();
    el.liveFeedTrack.classList.add('is-rolling');

    state.tickerRollingId = window.setTimeout(() => {
      el.feedLineTop.textContent = el.feedLineBottom.textContent;
      el.liveFeedTrack.classList.remove('is-rolling');
    }, reduceMotion ? 50 : 440);
  }

  function buildTickerLine() {
    const user = buildMaskedPhone();
    const docType = pick(tickerPool.docTypes);
    const coupon = pick(tickerPool.couponPool);

    if (Math.random() < 0.5) {
      return `用户 ${user} 刚完成《${docType}》精华摘要，领取 ${coupon}`;
    }

    const keywordCount = randomInt(6, 14);
    return `用户 ${user} 刚提炼 ${keywordCount} 个关键词，领取 ${coupon}`;
  }

  function formatCountdown(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function expireTrial() {
    if (el.trialChip) {
      el.trialChip.classList.add('is-expired');
      const label = el.trialChip.querySelector('span');
      if (label) label.textContent = '试用名额即将结束';
    }

    if (el.trialCountdown) {
      el.trialCountdown.textContent = '00:00';
    }
  }

  function startCountdown() {
    if (!el.trialCountdown) return;

    el.trialCountdown.textContent = formatCountdown(state.trialSeconds);
    if (state.trialSeconds <= 0) {
      expireTrial();
      return;
    }

    state.countdownTimerId = window.setInterval(() => {
      state.trialSeconds -= 1;

      if (state.trialSeconds <= 0) {
        state.trialSeconds = 0;
        window.clearInterval(state.countdownTimerId);
        state.countdownTimerId = 0;
        expireTrial();
        return;
      }

      el.trialCountdown.textContent = formatCountdown(state.trialSeconds);
    }, 1000);
  }

  function safeBuildUrl(source) {
    try {
      const base = config.downloadUrl || defaultConfig.downloadUrl;
      const target = new URL(base, window.location.href);
      const current = new URL(window.location.href);
      const passthrough = ['src', 'campaign', 'channel', 'utm_source', 'utm_medium', 'utm_campaign'];

      passthrough.forEach((key) => {
        const value = current.searchParams.get(key);
        if (value) target.searchParams.set(key, value);
      });

      target.searchParams.set('lp_source', source || 'unknown');
      return target.toString();
    } catch (_error) {
      return config.downloadUrl || defaultConfig.downloadUrl;
    }
  }

  function track(eventName, payload) {
    const tracker = window.__LP_TRACK__;
    if (typeof tracker !== 'function') return;

    try {
      tracker(eventName, payload || {});
    } catch (_error) {
      // Keep fallback silent to avoid breaking core flow.
    }
  }

  function goDownload(source) {
    track('lp_download_click', { source: source || 'unknown', phase: state.phase });
    window.location.href = safeBuildUrl(source);
  }

  function clearAllTimers() {
    clearTransformTimers();

    if (state.countdownTimerId) {
      window.clearInterval(state.countdownTimerId);
      state.countdownTimerId = 0;
    }

    if (state.tickerTimerId) {
      window.clearInterval(state.tickerTimerId);
      state.tickerTimerId = 0;
    }

    if (state.tickerRollingId) {
      window.clearTimeout(state.tickerRollingId);
      state.tickerRollingId = 0;
    }
  }
})();
