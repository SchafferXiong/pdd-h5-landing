(() => {
  const config = window.__LP_CONFIG_V3_1 || {};

  const DEMO_INTERVAL = 460;

  const el = {
    page: document.getElementById('pageRoot'),
    overlay: document.getElementById('entryOverlay'),
    overlayTitle: document.getElementById('overlayTitle'),
    overlaySub: document.getElementById('overlaySub'),
    overlayAction: document.getElementById('overlayAction'),
    logo: document.getElementById('brandLogo'),
    proofCounter: document.getElementById('proofCounter'),
    heroTitle: document.getElementById('heroTitle'),
    heroSub: document.getElementById('heroSub'),
    tabs: document.getElementById('sceneTabs'),
    stageImage: document.getElementById('stageImage'),
    imagePlaceholder: document.getElementById('imagePlaceholder'),
    beforeMin: document.getElementById('beforeMin'),
    afterMin: document.getElementById('afterMin'),
    boostRate: document.getElementById('boostRate'),
    statusText: document.getElementById('statusText'),
    urgencyText: document.getElementById('urgencyText'),
    progressFill: document.getElementById('progressFill'),
    taskList: document.getElementById('taskList'),
    runButton: document.getElementById('runButton'),
    socialTicker: document.getElementById('socialTicker'),
    benefitList: document.getElementById('benefitList'),
    stepsList: document.getElementById('stepsList')
  };

  const state = {
    scenarioIndex: 0,
    running: false,
    completedCount: 0,
    demoTimer: null,
    socialTimer: null,
    entered: false
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

  function getScenario() {
    const list = config.scenarios || [];
    return list[state.scenarioIndex] || list[0] || null;
  }

  function setTabActive(index) {
    const buttons = Array.from(el.tabs?.querySelectorAll('.scene') || []);
    buttons.forEach((btn, i) => btn.classList.toggle('is-active', i === index));
  }

  function renderTasks(mode = 'pending') {
    const s = getScenario();
    if (!s || !el.taskList) return;

    el.taskList.innerHTML = s.tasks
      .map((task, i) => {
        let status = '待处理';
        let cls = 'pending';

        if (mode === 'running') {
          if (i < state.completedCount) {
            status = '已完成';
            cls = 'done';
          } else if (i === state.completedCount) {
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

  function renderScenarioBase() {
    const s = getScenario();
    if (!s) return;

    if (el.beforeMin) el.beforeMin.textContent = String(s.beforeMin);
    if (el.afterMin) el.afterMin.textContent = String(s.afterMin);
    if (el.boostRate) el.boostRate.textContent = `${(s.beforeMin / s.afterMin).toFixed(1)}x`;

    if (el.heroSub) {
      el.heroSub.textContent = `${s.name}正在挤占你的时间，进入AI模式后可快速提效。`;
    }

    if (el.statusText) {
      el.statusText.textContent = '准备开始：AI办公引擎待启动';
    }

    if (el.urgencyText) {
      el.urgencyText.textContent = config.urgency?.warning || '正在错过高效交付窗口';
    }

    if (el.progressFill) {
      el.progressFill.style.width = '0%';
    }

    if (el.page) {
      el.page.dataset.state = 'idle';
    }

    if (el.runButton) {
      el.runButton.textContent = '启动AI办公演示';
      el.runButton.disabled = false;
    }

    renderTasks('pending');
  }

  function clearDemoTimer() {
    if (state.demoTimer) {
      window.clearInterval(state.demoTimer);
      state.demoTimer = null;
    }
  }

  function runDemo(source = 'user') {
    const s = getScenario();
    if (!s || state.running) return;

    state.running = true;
    state.completedCount = 0;

    if (el.page) el.page.dataset.state = 'running';
    if (el.statusText) el.statusText.textContent = source === 'auto' ? '系统已自动进入AI办公模式' : 'AI办公模式已启动，正在快速处理';
    if (el.urgencyText) el.urgencyText.textContent = '现在切换千问，马上拿回时间主动权';
    if (el.runButton) {
      el.runButton.disabled = true;
      el.runButton.textContent = '演示中...';
    }

    renderTasks('running');

    const total = s.tasks.length || 1;
    clearDemoTimer();
    state.demoTimer = window.setInterval(() => {
      state.completedCount += 1;
      const pct = Math.min(Math.round((state.completedCount / total) * 100), 100);
      if (el.progressFill) el.progressFill.style.width = `${pct}%`;

      if (state.completedCount < total) {
        renderTasks('running');
        return;
      }

      clearDemoTimer();
      state.running = false;

      renderTasks('done');
      if (el.page) el.page.dataset.state = 'done';
      if (el.statusText) el.statusText.textContent = '结果已生成：可直接进入高效办公';
      if (el.urgencyText) el.urgencyText.textContent = '此刻下载，下一份任务直接提速';
      if (el.runButton) {
        el.runButton.disabled = false;
        el.runButton.textContent = '再次演示';
      }
    }, DEMO_INTERVAL);
  }

  function hideOverlayAndEnter() {
    if (state.entered) return;
    state.entered = true;

    if (el.overlay) el.overlay.classList.add('is-hidden');

    window.setTimeout(() => {
      runDemo('auto');
    }, 520);
  }

  function buildSocialLine() {
    const proof = config.socialProof || {};
    const users = Number(proof.totalUsers || 326981);
    const [minRate, maxRate] = proof.ratioRange || [3.1, 6.8];
    const cities = proof.cities || ['杭州', '上海', '深圳'];

    const city = cities[Math.floor(Math.random() * cities.length)];
    const surname = ['李', '王', '张', '陈', '杨', '刘', '吴', '赵'][Math.floor(Math.random() * 8)];
    const rate = (minRate + Math.random() * (maxRate - minRate)).toFixed(1);

    const delta = 200 + Math.floor(Math.random() * 700);
    const nextUsers = users + delta;
    config.socialProof.totalUsers = nextUsers;

    if (el.proofCounter) {
      el.proofCounter.textContent = `已有 ${nextUsers} 人用千问提效`;
    }

    return `${city} ${surname}** 刚刚用千问提效 ${rate}x`;
  }

  function startSocialTicker() {
    if (state.socialTimer) {
      window.clearInterval(state.socialTimer);
      state.socialTimer = null;
    }

    if (el.socialTicker) {
      el.socialTicker.textContent = buildSocialLine();
    }

    state.socialTimer = window.setInterval(() => {
      if (el.socialTicker) {
        el.socialTicker.textContent = buildSocialLine();
      }
    }, 2600);
  }

  function renderBenefits() {
    if (el.benefitList) {
      const items = config.benefits || [];
      el.benefitList.innerHTML = items
        .map((item) => `<article class="benefit-card"><p class="t">${item.title}</p><p class="d">${item.desc}</p></article>`)
        .join('');
    }

    if (el.stepsList) {
      const steps = config.threeSteps || [];
      el.stepsList.innerHTML = steps
        .map((step, idx) => `<article class="step-card"><p class="t">第${idx + 1}步 · ${step.title}</p><p class="d">${step.desc}</p></article>`)
        .join('');
    }
  }

  function bindEvents() {
    if (el.overlayAction) {
      el.overlayAction.addEventListener('click', hideOverlayAndEnter);
    }

    if (el.runButton) {
      el.runButton.addEventListener('click', () => runDemo('user'));
    }

    if (el.tabs) {
      el.tabs.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLButtonElement)) return;

        const idx = Number(target.dataset.scene);
        if (!Number.isInteger(idx)) return;

        state.scenarioIndex = idx;
        setTabActive(idx);
        clearDemoTimer();
        state.running = false;
        renderScenarioBase();
      });
    }

    const targetUrl = config.cta?.androidUrl || 'https://app.mi.com/details?id=com.aliyun.tongyi';
    document.querySelectorAll('[data-source]').forEach((btn) => {
      btn.addEventListener('click', () => {
        window.location.href = appendParams(targetUrl, btn.dataset.source || 'main');
      });
    });
  }

  function initBrandAndVisual() {
    if (el.logo && config.brand?.logoUrl) {
      el.logo.src = resolveAsset(config.brand.logoUrl);
      el.logo.addEventListener('error', () => {
        el.logo.style.display = 'none';
      });
    }

    if (el.stageImage && config.visuals?.stageImage) {
      el.stageImage.src = resolveAsset(config.visuals.stageImage);
      el.stageImage.addEventListener('load', () => {
        if (el.imagePlaceholder) el.imagePlaceholder.classList.add('is-hidden');
      });
      el.stageImage.addEventListener('error', () => {
        if (el.imagePlaceholder) {
          el.imagePlaceholder.classList.remove('is-hidden');
          const hint = el.imagePlaceholder.querySelector('small');
          if (hint) hint.textContent = '已使用占位视觉';
        }
      });
    }
  }

  function initOverlayCopy() {
    if (el.overlayTitle && config.urgency?.title) {
      el.overlayTitle.textContent = config.urgency.title;
    }
    if (el.overlaySub && config.urgency?.sub) {
      el.overlaySub.textContent = config.urgency.sub;
    }
    if (el.overlayAction && config.urgency?.action) {
      el.overlayAction.textContent = config.urgency.action;
    }

    window.setTimeout(() => {
      if (!state.entered) hideOverlayAndEnter();
    }, 2100);
  }

  function init() {
    initBrandAndVisual();
    renderBenefits();
    setTabActive(state.scenarioIndex);
    renderScenarioBase();
    bindEvents();
    startSocialTicker();
    initOverlayCopy();
  }

  init();
})();
