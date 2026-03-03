(() => {
  const config = window.__LP_CONFIG_V2_1 || {};

  const FLOW_TOTAL_MS = 4000;
  const PARTICIPATE_HINT_AT = 760;
  const AUTO_PARTICIPATE_AT = 1450;
  const FORCE_UNLOCK_AT = 3600;
  const DEMO_TICK_MS = 340;

  const el = {
    pageRoot: document.getElementById('pageRoot'),
    heroSection: document.getElementById('heroSection'),
    logo: document.getElementById('brandLogo'),
    subline: document.getElementById('storySubline'),
    flowFill: document.getElementById('flowFill'),
    flowSteps: Array.from(document.querySelectorAll('.flow-step')),
    tabs: document.getElementById('sceneTabs'),
    beforeMin: document.getElementById('beforeMin'),
    afterMin: document.getElementById('afterMin'),
    savedMin: document.getElementById('savedMin'),
    statusText: document.getElementById('statusText'),
    progressFill: document.getElementById('progressFill'),
    taskList: document.getElementById('taskList'),
    handoverBtn: document.getElementById('handoverBtn'),
    officeBackdrop: document.getElementById('officeBackdrop'),
    heroCta: document.getElementById('heroCta'),
    midCta: document.getElementById('midCta'),
    stickyCta: document.getElementById('stickyCta'),
    ctaWait: document.getElementById('ctaWait'),
    legalText: document.getElementById('legalText')
  };

  const state = {
    scenarioIndex: 0,
    processing: false,
    participated: false,
    downloadReady: false,
    completedCount: 0,
    timer: null,
    flowTimers: [],
    phase: 'narrative'
  };

  function resolveAsset(path) {
    try {
      return new URL(path, document.baseURI).href;
    } catch (_error) {
      return path;
    }
  }

  function appendParams(url, source) {
    const target = new URL(url, window.location.href);
    const current = new URL(window.location.href);
    ['src', 'campaign', 'adgroup', 'creative'].forEach((key) => {
      const value = current.searchParams.get(key);
      if (value) target.searchParams.set(key, value);
    });
    target.searchParams.set('lp_source', source || 'main');
    return target.toString();
  }

  function queueFlow(delay, callback) {
    const id = window.setTimeout(callback, delay);
    state.flowTimers.push(id);
    return id;
  }

  function clearFlowTimers() {
    state.flowTimers.forEach((id) => window.clearTimeout(id));
    state.flowTimers = [];
  }

  function clearProcessTimer() {
    if (state.timer) {
      window.clearInterval(state.timer);
      state.timer = null;
    }
  }

  function setCtaLevel(level) {
    document.querySelectorAll('.cta, .sticky-cta').forEach((btn) => {
      btn.classList.remove('level-1', 'level-2', 'level-3');
      btn.classList.add(`level-${level}`);
    });
  }

  function setFlowPhase(phase) {
    state.phase = phase;
    if (el.heroSection) {
      el.heroSection.dataset.phase = phase;
    }

    el.flowSteps.forEach((step) => {
      const isActive = step.dataset.phase === phase;
      step.classList.toggle('is-active', isActive);
    });
  }

  function setFlowMeter() {
    if (!el.flowFill) return;
    el.flowFill.style.transition = 'none';
    el.flowFill.style.width = '0%';

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (!el.flowFill) return;
        el.flowFill.style.transition = `width ${FLOW_TOTAL_MS}ms linear`;
        el.flowFill.style.width = '100%';
      });
    });
  }

  function getScenario() {
    const list = config.scenarios || [];
    return list[state.scenarioIndex] || list[0] || null;
  }

  function setTabActive(index) {
    const buttons = Array.from(el.tabs?.querySelectorAll('.tab') || []);
    buttons.forEach((btn, i) => btn.classList.toggle('is-active', i === index));
  }

  function getSublineByPhase(phase, scenario) {
    if (!scenario) return '你说需求，千问接管执行';

    const save = scenario.beforeMin - scenario.afterMin;
    if (phase === 'participate') return `点一下，马上演示节省 ${save} 分钟`;
    if (phase === 'demo') return '正在秒级演示：任务接管中';
    if (phase === 'download') return `演示完成：${scenario.afterMin} 分钟交付，现在下载开始提速`;
    return `把 ${scenario.name} 交给千问，${scenario.afterMin} 分钟交付`;
  }

  function renderTasks(mode = 'pending') {
    const scenario = getScenario();
    if (!scenario || !el.taskList) return;

    el.taskList.innerHTML = scenario.tasks
      .map((task, index) => {
        let status = '待处理';
        let cls = 'pending';

        if (mode === 'running') {
          if (index < state.completedCount) {
            status = '已交付';
            cls = 'done';
          } else if (index === state.completedCount) {
            status = '处理中';
            cls = 'running';
          }
        }

        if (mode === 'done') {
          status = '已交付';
          cls = 'done';
        }

        return `<li><span class="task-text">${task}</span><span class="task-status ${cls}">${status}</span></li>`;
      })
      .join('');
  }

  function renderScenarioBase() {
    const scenario = getScenario();
    if (!scenario) return;

    if (el.beforeMin) el.beforeMin.textContent = String(scenario.beforeMin);
    if (el.afterMin) el.afterMin.textContent = String(scenario.afterMin);
    if (el.savedMin) el.savedMin.textContent = String(scenario.beforeMin - scenario.afterMin);
    if (el.subline) el.subline.textContent = getSublineByPhase(state.phase, scenario);

    if (el.statusText) el.statusText.textContent = '任务待接管';
    if (el.progressFill) el.progressFill.style.width = '0%';

    renderTasks('pending');

    if (el.handoverBtn) {
      el.handoverBtn.textContent = '点我参与 · 秒演示';
      el.handoverBtn.disabled = false;
    }
  }

  function setDownloadLocked(locked) {
    document.querySelectorAll('.gated-download').forEach((node) => {
      node.classList.toggle('is-locked', locked);
      node.classList.toggle('is-ready', !locked);
      node.setAttribute('aria-disabled', String(locked));
    });

    if (!locked) {
      window.setTimeout(() => {
        document.querySelectorAll('.gated-download').forEach((node) => node.classList.remove('is-ready'));
      }, 420);
    }

    if (el.ctaWait) {
      el.ctaWait.classList.toggle('is-hidden', !locked);
      el.ctaWait.textContent = locked ? '完成演示后自动解锁下载' : '已解锁：立即下载千问';
    }
  }

  function updateStickyVisibility() {
    const canShow = state.downloadReady && window.scrollY > 90;
    if (el.stickyCta) el.stickyCta.classList.toggle('is-visible', canShow);
    if (el.legalText) el.legalText.classList.toggle('is-visible', canShow);
  }

  function unlockDownload(reason) {
    if (state.downloadReady) return;

    state.downloadReady = true;
    setFlowPhase('download');
    setCtaLevel(3);
    setDownloadLocked(false);
    updateStickyVisibility();

    const scenario = getScenario();
    if (el.subline) {
      el.subline.textContent = getSublineByPhase('download', scenario);
      el.subline.style.color = '#e5f2ff';
    }

    if (el.statusText && scenario) {
      const save = scenario.beforeMin - scenario.afterMin;
      el.statusText.textContent = reason === 'fallback' ? `演示已就绪，立刻下载体验` : `演示完成，已节省 ${save} 分钟`;
    }

    if (el.handoverBtn) {
      el.handoverBtn.disabled = false;
      el.handoverBtn.textContent = '再演示一次';
    }
  }

  function completeDemo() {
    clearProcessTimer();
    state.processing = false;
    renderTasks('done');
    if (el.progressFill) el.progressFill.style.width = '100%';
    unlockDownload('demo');
  }

  function runDemo(triggerSource) {
    const scenario = getScenario();
    if (!scenario || state.processing) return;

    state.participated = true;
    state.processing = true;
    state.completedCount = 0;

    setFlowPhase('demo');
    setCtaLevel(2);

    if (el.subline) el.subline.textContent = getSublineByPhase('demo', scenario);
    if (el.statusText) {
      el.statusText.textContent = triggerSource === 'user' ? '你已参与，千问开始接管任务' : '自动触发演示，千问开始接管任务';
    }

    if (el.handoverBtn) {
      el.handoverBtn.disabled = true;
      el.handoverBtn.textContent = '演示中...';
    }

    renderTasks('running');
    clearProcessTimer();

    const total = scenario.tasks.length || 1;
    state.timer = window.setInterval(() => {
      state.completedCount += 1;
      const pct = Math.min(Math.round((state.completedCount / total) * 100), 100);
      if (el.progressFill) el.progressFill.style.width = `${pct}%`;

      if (state.completedCount < total) {
        renderTasks('running');
        return;
      }

      completeDemo();
    }, DEMO_TICK_MS);
  }

  function startFlow() {
    clearFlowTimers();
    clearProcessTimer();

    state.processing = false;
    state.participated = false;
    state.downloadReady = false;
    state.completedCount = 0;

    setFlowPhase('narrative');
    setCtaLevel(1);
    setDownloadLocked(true);
    renderScenarioBase();
    setFlowMeter();

    queueFlow(PARTICIPATE_HINT_AT, () => {
      if (state.processing || state.downloadReady) return;
      setFlowPhase('participate');
      const scenario = getScenario();
      if (el.subline) el.subline.textContent = getSublineByPhase('participate', scenario);
      if (el.statusText) el.statusText.textContent = '点击参与，立即触发秒级演示';
    });

    queueFlow(AUTO_PARTICIPATE_AT, () => {
      if (!state.participated && !state.processing && !state.downloadReady) {
        runDemo('auto');
      }
    });

    queueFlow(FORCE_UNLOCK_AT, () => {
      if (!state.downloadReady) {
        unlockDownload('fallback');
      }
    });
  }

  function shakeLocked(node) {
    node.classList.remove('is-ready');
    node.animate(
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-3px)' },
        { transform: 'translateX(3px)' },
        { transform: 'translateX(0)' }
      ],
      { duration: 220, easing: 'ease-out' }
    );
  }

  function bindScenarioSwitch() {
    if (!el.tabs) return;

    el.tabs.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLButtonElement)) return;

      const idx = Number(target.dataset.scene);
      if (!Number.isInteger(idx)) return;

      state.scenarioIndex = idx;
      setTabActive(idx);
      startFlow();
    });
  }

  function bindStoryAction() {
    if (!el.handoverBtn) return;

    el.handoverBtn.addEventListener('click', () => {
      if (state.processing) return;

      if (state.downloadReady) {
        startFlow();
        queueFlow(140, () => runDemo('user'));
        return;
      }

      runDemo('user');
    });
  }

  function bindDownloadCtas() {
    const targetUrl = config.cta?.androidUrl || 'https://app.mi.com/details?id=com.aliyun.tongyi';

    document.querySelectorAll('[data-source]').forEach((button) => {
      button.addEventListener('click', () => {
        if (button.classList.contains('is-locked')) {
          shakeLocked(button);
          return;
        }

        window.location.href = appendParams(targetUrl, button.dataset.source || 'main');
      });
    });
  }

  function bindSticky() {
    updateStickyVisibility();
    window.addEventListener('scroll', updateStickyVisibility, { passive: true });
  }

  function initBrand() {
    if (el.logo && config.brand?.logoUrl) {
      el.logo.src = resolveAsset(config.brand.logoUrl);
      el.logo.addEventListener('error', () => {
        el.logo.style.display = 'none';
      });
    }

    if (el.officeBackdrop && config.visuals?.officeShot) {
      el.officeBackdrop.src = resolveAsset(config.visuals.officeShot);
      el.officeBackdrop.addEventListener('error', () => {
        el.officeBackdrop.style.display = 'none';
      });
    }
  }

  function init() {
    initBrand();
    setTabActive(state.scenarioIndex);
    bindScenarioSwitch();
    bindStoryAction();
    bindDownloadCtas();
    bindSticky();
    startFlow();
  }

  init();
})();
