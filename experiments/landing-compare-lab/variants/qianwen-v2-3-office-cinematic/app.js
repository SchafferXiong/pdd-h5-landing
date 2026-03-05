(() => {
  const config = window.__LP_CONFIG_V2_3 || {};

  const PHASE = {
    HOOK: 'hook',
    ENGAGE: 'engage',
    DEMO: 'demo',
    CONVERT: 'convert'
  };

  const DEMO_STEP_MS = 420;

  const el = {
    pageRoot: document.getElementById('pageRoot'),
    logo: document.getElementById('brandLogo'),
    heroTitle: document.getElementById('heroTitle'),
    heroSub: document.getElementById('heroSub'),
    tabs: document.getElementById('sceneTabs'),
    stageImage: document.getElementById('stageImage'),
    chipScene: document.getElementById('chipScene'),
    chipSaved: document.getElementById('chipSaved'),
    beforeMin: document.getElementById('beforeMin'),
    afterMin: document.getElementById('afterMin'),
    statusText: document.getElementById('statusText'),
    progressFill: document.getElementById('progressFill'),
    taskList: document.getElementById('taskList'),
    engageBtn: document.getElementById('engageBtn'),
    engageHint: document.getElementById('engageHint'),
    heroCta: document.getElementById('heroCta'),
    ctaSub: document.getElementById('ctaSub'),
    benefitGrid: document.getElementById('benefitGrid'),
    midCta: document.getElementById('midCta'),
    stickyCta: document.getElementById('stickyCta'),
    legalText: document.getElementById('legalText')
  };

  const state = {
    phase: PHASE.HOOK,
    scenarioIndex: 0,
    demoRunning: false,
    demoTimer: null,
    progressTimer: null,
    completedCount: 0,
    ctaReady: false,
    autoHintTimer: null,
    autoDemoTimer: null
  };

  function resolveAsset(path) {
    try {
      return new URL(path, document.baseURI).href;
    } catch (_err) {
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

  function setPhase(phase) {
    state.phase = phase;
    if (el.pageRoot) {
      el.pageRoot.dataset.phase = phase;
    }
  }

  function getScenario() {
    const scenarios = config.scenarios || [];
    return scenarios[state.scenarioIndex] || scenarios[0] || null;
  }

  function setTabActive(index) {
    const buttons = Array.from(el.tabs?.querySelectorAll('.pill') || []);
    buttons.forEach((btn, i) => btn.classList.toggle('is-active', i === index));
  }

  function renderBenefits() {
    const items = config.benefits || [];
    if (!el.benefitGrid) return;

    el.benefitGrid.innerHTML = items
      .map(
        (item, idx) =>
          `<article class="benefit-card" data-idx="${idx}"><p class="benefit-title">${item.title}</p><p class="benefit-desc">${item.desc}</p></article>`
      )
      .join('');

    const cards = Array.from(el.benefitGrid.querySelectorAll('.benefit-card'));
    cards.forEach((card, idx) => {
      window.setTimeout(() => card.classList.add('is-visible'), 140 + idx * 110);
    });
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
            status = '已完成';
            cls = 'done';
          } else if (index === state.completedCount) {
            status = '处理中';
            cls = 'running';
          }
        }

        if (mode === 'done') {
          status = '已完成';
          cls = 'done';
        }

        return `<li><span class="task-text">${task}</span><span class="task-status ${cls}">${status}</span></li>`;
      })
      .join('');
  }

  function animateMinutes(from, to, element, duration = 700) {
    const start = performance.now();

    function frame(now) {
      const progress = Math.min((now - start) / duration, 1);
      const value = Math.round(from + (to - from) * progress);
      element.textContent = String(value);
      if (progress < 1) window.requestAnimationFrame(frame);
    }

    window.requestAnimationFrame(frame);
  }

  function renderScenarioBase() {
    const scenario = getScenario();
    if (!scenario) return;

    if (el.beforeMin) el.beforeMin.textContent = String(scenario.beforeMin);
    if (el.afterMin) el.afterMin.textContent = String(scenario.afterMin);

    const saved = scenario.beforeMin - scenario.afterMin;
    if (el.chipScene) el.chipScene.textContent = `${scenario.name}模式`;
    if (el.chipSaved) el.chipSaved.textContent = `节省 ${saved} 分钟`;

    if (el.statusText) el.statusText.textContent = '准备就绪，开始生成可交付结果';
    if (el.heroSub) el.heroSub.textContent = `${scenario.name}任务可快速接管，直接产出可交付内容。`;
    if (el.progressFill) el.progressFill.style.width = '0%';

    renderTasks('pending');
  }

  function setCtaReady(ready) {
    state.ctaReady = ready;

    if (el.heroCta) {
      el.heroCta.classList.toggle('is-locked', !ready);
    }

    if (el.ctaSub) {
      el.ctaSub.textContent = ready
        ? (config.narrative?.convert?.sub || '打开就能开始下一份任务')
        : '完成演示后解锁下载';
    }

    updateStickyVisibility();
  }

  function clearTimers() {
    if (state.demoTimer) {
      window.clearInterval(state.demoTimer);
      state.demoTimer = null;
    }

    if (state.progressTimer) {
      window.clearTimeout(state.progressTimer);
      state.progressTimer = null;
    }

    if (state.autoHintTimer) {
      window.clearTimeout(state.autoHintTimer);
      state.autoHintTimer = null;
    }

    if (state.autoDemoTimer) {
      window.clearTimeout(state.autoDemoTimer);
      state.autoDemoTimer = null;
    }
  }

  function finishDemo() {
    const scenario = getScenario();
    if (!scenario) return;

    state.demoRunning = false;
    setPhase(PHASE.CONVERT);
    setCtaReady(true);

    if (el.progressFill) el.progressFill.style.width = '100%';
    renderTasks('done');

    if (el.statusText) {
      el.statusText.textContent = config.narrative?.demo?.done || '结果已就绪，直接进入高效办公';
    }

    if (el.heroTitle) {
      el.heroTitle.textContent = config.narrative?.convert?.title || '下载千问，立即进入AI办公模式';
    }

    if (el.engageBtn) {
      el.engageBtn.disabled = false;
    }

    if (el.engageHint) {
      el.engageHint.textContent = '可再次演示不同任务场景';
    }
  }

  function runDemo(source = 'user') {
    const scenario = getScenario();
    if (!scenario || state.demoRunning) return;

    state.demoRunning = true;
    state.completedCount = 0;

    setPhase(PHASE.DEMO);
    setCtaReady(false);

    if (el.engageBtn) {
      el.engageBtn.disabled = true;
    }

    if (el.statusText) {
      el.statusText.textContent = source === 'auto' ? '正在为你生成示例结果' : config.narrative?.demo?.running || '千问正在生成可交付结果';
    }

    animateMinutes(scenario.beforeMin + 6, scenario.beforeMin, el.beforeMin, 560);
    animateMinutes(scenario.afterMin + 9, scenario.afterMin, el.afterMin, 760);

    renderTasks('running');

    const total = scenario.tasks.length || 1;
    state.demoTimer = window.setInterval(() => {
      state.completedCount += 1;
      const pct = Math.min(Math.round((state.completedCount / total) * 100), 100);
      if (el.progressFill) el.progressFill.style.width = `${pct}%`;

      if (state.completedCount < total) {
        renderTasks('running');
        return;
      }

      window.clearInterval(state.demoTimer);
      state.demoTimer = null;
      finishDemo();
    }, DEMO_STEP_MS);
  }

  function startHook() {
    clearTimers();
    state.demoRunning = false;
    state.completedCount = 0;

    setPhase(PHASE.HOOK);
    setCtaReady(false);
    renderScenarioBase();

    if (el.heroTitle) {
      el.heroTitle.textContent = config.narrative?.hook?.title || '你的下一份工作任务，10分钟交付';
    }

    if (el.heroSub) {
      el.heroSub.textContent = config.narrative?.hook?.sub || '从周报到PPT，再到调研，一次交给千问。';
    }

    if (el.engageHint) {
      el.engageHint.textContent = config.narrative?.engage?.hint || '点一下，马上看结果如何生成';
    }

    state.autoHintTimer = window.setTimeout(() => {
      if (state.phase !== PHASE.HOOK) return;
      setPhase(PHASE.ENGAGE);
    }, 880);

    state.autoDemoTimer = window.setTimeout(() => {
      if (state.phase === PHASE.HOOK || state.phase === PHASE.ENGAGE) {
        runDemo('auto');
      }
    }, 2400);
  }

  function shakeCta(button) {
    button.animate(
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-4px)' },
        { transform: 'translateX(4px)' },
        { transform: 'translateX(0)' }
      ],
      { duration: 240, easing: 'ease-out' }
    );
  }

  function updateStickyVisibility() {
    const show = state.ctaReady && window.scrollY > 80;
    if (el.stickyCta) el.stickyCta.classList.toggle('is-visible', show);
    if (el.legalText) el.legalText.classList.toggle('is-visible', show);
  }

  function bindEvents() {
    if (el.tabs) {
      el.tabs.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLButtonElement)) return;

        const idx = Number(target.dataset.scene);
        if (!Number.isInteger(idx)) return;

        state.scenarioIndex = idx;
        setTabActive(idx);
        startHook();
      });
    }

    if (el.engageBtn) {
      el.engageBtn.addEventListener('click', () => {
        if (state.demoRunning) return;
        runDemo('user');
      });
    }

    const targetUrl = config.cta?.androidUrl || 'https://app.mi.com/details?id=com.aliyun.tongyi';
    document.querySelectorAll('[data-source]').forEach((button) => {
      button.addEventListener('click', () => {
        if (!state.ctaReady && button !== el.midCta) {
          shakeCta(button);
          return;
        }
        window.location.href = appendParams(targetUrl, button.dataset.source || 'main');
      });
    });

    window.addEventListener('scroll', updateStickyVisibility, { passive: true });
  }

  function initVisuals() {
    if (el.logo && config.brand?.logoUrl) {
      el.logo.src = resolveAsset(config.brand.logoUrl);
      el.logo.addEventListener('error', () => {
        el.logo.style.display = 'none';
      });
    }

    if (el.stageImage && config.visuals?.stageImage) {
      el.stageImage.src = resolveAsset(config.visuals.stageImage);
      el.stageImage.addEventListener('error', () => {
        el.stageImage.style.display = 'none';
      });
    }

    if (el.engageBtn && config.narrative?.engage?.button) {
      const main = el.engageBtn.querySelector('.engage-main');
      if (main) main.textContent = config.narrative.engage.button;
    }
  }

  function initCopyGuardLog() {
    const guard = config.copyGuard;
    if (!guard || !Array.isArray(guard.bannedPhrases)) return;

    const text = document.body?.innerText || '';
    const hit = guard.bannedPhrases.find((phrase) => phrase && text.includes(phrase));
    if (hit) {
      console.warn('[CopyGuard] banned phrase detected:', hit);
    }
  }

  function init() {
    initVisuals();
    renderBenefits();
    bindEvents();
    setTabActive(state.scenarioIndex);
    startHook();
    updateStickyVisibility();
    initCopyGuardLog();
  }

  init();
})();
