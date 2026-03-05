(() => {
  const config = window.__LP_CONFIG_V3_2 || {};

  const el = {
    popup: document.getElementById('entryPopup'),
    popupTitle: document.getElementById('popupTitle'),
    popupSub: document.getElementById('popupSub'),
    popupBtn: document.getElementById('popupBtn'),
    page: document.getElementById('pageRoot'),
    logo: document.getElementById('logo'),
    proofText: document.getElementById('proofText'),
    subtitle: document.getElementById('subtitle'),
    tabs: document.getElementById('tabs'),
    visualImage: document.getElementById('visualImage'),
    visualPlaceholder: document.getElementById('visualPlaceholder'),
    before: document.getElementById('before'),
    after: document.getElementById('after'),
    ratio: document.getElementById('ratio'),
    status: document.getElementById('status'),
    barFill: document.getElementById('barFill'),
    taskList: document.getElementById('taskList'),
    startBtn: document.getElementById('startBtn'),
    ticker: document.getElementById('ticker'),
    benefitList: document.getElementById('benefitList'),
    stepList: document.getElementById('stepList')
  };

  const state = {
    sceneIndex: 0,
    running: false,
    doneCount: 0,
    demoTimer: null,
    tickerTimer: null,
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

  function currentScene() {
    const list = config.scenarios || [];
    return list[state.sceneIndex] || list[0] || null;
  }

  function setTab(index) {
    const buttons = Array.from(el.tabs?.querySelectorAll('.tab') || []);
    buttons.forEach((btn, i) => btn.classList.toggle('is-active', i === index));
  }

  function drawTasks(mode = 'pending') {
    const scene = currentScene();
    if (!scene || !el.taskList) return;

    el.taskList.innerHTML = scene.tasks
      .map((task, idx) => {
        let s = '待处理';
        let c = 'pending';

        if (mode === 'running') {
          if (idx < state.doneCount) {
            s = '已完成';
            c = 'done';
          } else if (idx === state.doneCount) {
            s = '处理中';
            c = 'running';
          }
        }

        if (mode === 'done') {
          s = '已完成';
          c = 'done';
        }

        return `<li><span class="task-text">${task}</span><span class="task-status ${c}">${s}</span></li>`;
      })
      .join('');
  }

  function renderScene() {
    const s = currentScene();
    if (!s) return;

    if (el.before) el.before.textContent = String(s.beforeMin);
    if (el.after) el.after.textContent = String(s.afterMin);
    if (el.ratio) el.ratio.textContent = `${(s.beforeMin / s.afterMin).toFixed(1)}x`;
    if (el.subtitle) el.subtitle.textContent = `${s.name}可交给千问先产出可用版本，再继续优化。`;
    if (el.status) el.status.textContent = '待启动 AI 办公演示';
    if (el.barFill) el.barFill.style.width = '0%';
    if (el.page) el.page.dataset.phase = 'idle';
    if (el.startBtn) {
      el.startBtn.textContent = '启动AI办公演示';
      el.startBtn.disabled = false;
    }

    drawTasks('pending');
  }

  function clearDemo() {
    if (state.demoTimer) {
      window.clearInterval(state.demoTimer);
      state.demoTimer = null;
    }
  }

  function startDemo(source = 'user') {
    const s = currentScene();
    if (!s || state.running) return;

    state.running = true;
    state.doneCount = 0;

    if (el.page) el.page.dataset.phase = 'running';
    if (el.status) el.status.textContent = source === 'auto' ? '已自动进入 AI 办公模式' : 'AI 办公模式启动中';
    if (el.startBtn) {
      el.startBtn.disabled = true;
      el.startBtn.textContent = '演示中...';
    }

    drawTasks('running');
    clearDemo();

    const total = s.tasks.length || 1;
    state.demoTimer = window.setInterval(() => {
      state.doneCount += 1;
      const p = Math.min(Math.round((state.doneCount / total) * 100), 100);
      if (el.barFill) el.barFill.style.width = `${p}%`;

      if (state.doneCount < total) {
        drawTasks('running');
        return;
      }

      clearDemo();
      state.running = false;
      drawTasks('done');

      if (el.page) el.page.dataset.phase = 'done';
      if (el.status) el.status.textContent = '结果已就绪：立即下载可继续高效办公';
      if (el.startBtn) {
        el.startBtn.disabled = false;
        el.startBtn.textContent = '再次演示';
      }
    }, 500);
  }

  function randomTickerLine() {
    const proof = config.proof || {};
    const users = Number(proof.users || 289430);
    const cities = proof.cities || ['上海', '北京', '深圳'];
    const range = proof.ratioRange || [3, 6.4];

    const city = cities[Math.floor(Math.random() * cities.length)];
    const family = ['赵', '钱', '孙', '李', '周', '吴', '郑', '王'][Math.floor(Math.random() * 8)];
    const ratio = (range[0] + Math.random() * (range[1] - range[0])).toFixed(1);

    const plus = 180 + Math.floor(Math.random() * 620);
    const next = users + plus;
    config.proof.users = next;

    if (el.proofText) {
      el.proofText.textContent = `已有 ${next} 人用千问提效`;
    }

    return `${city} ${family}** 刚刚用千问提效 ${ratio}x`;
  }

  function startTicker() {
    if (state.tickerTimer) {
      window.clearInterval(state.tickerTimer);
      state.tickerTimer = null;
    }

    if (el.ticker) {
      el.ticker.textContent = randomTickerLine();
    }

    state.tickerTimer = window.setInterval(() => {
      if (el.ticker) {
        el.ticker.textContent = randomTickerLine();
      }
    }, 2500);
  }

  function renderBlocks() {
    if (el.benefitList) {
      const benefits = config.benefits || [];
      el.benefitList.innerHTML = benefits
        .map((b) => `<article class="block"><p class="t">${b.title}</p><p class="d">${b.desc}</p></article>`)
        .join('');
    }

    if (el.stepList) {
      const steps = config.steps || [];
      el.stepList.innerHTML = steps
        .map((s, i) => `<article class="block"><p class="t">第${i + 1}步 · ${s.title}</p><p class="d">${s.desc}</p></article>`)
        .join('');
    }
  }

  function enterFromPopup() {
    if (state.entered) return;
    state.entered = true;

    if (el.popup) el.popup.classList.add('is-hidden');
    window.setTimeout(() => startDemo('auto'), 520);
  }

  function bind() {
    if (el.popupBtn) {
      el.popupBtn.addEventListener('click', enterFromPopup);
    }

    if (el.startBtn) {
      el.startBtn.addEventListener('click', () => startDemo('user'));
    }

    if (el.tabs) {
      el.tabs.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLButtonElement)) return;

        const idx = Number(target.dataset.scene);
        if (!Number.isInteger(idx)) return;

        state.sceneIndex = idx;
        setTab(idx);
        clearDemo();
        state.running = false;
        renderScene();
      });
    }

    const url = config.cta?.androidUrl || 'https://app.mi.com/details?id=com.aliyun.tongyi';
    document.querySelectorAll('[data-source]').forEach((btn) => {
      btn.addEventListener('click', () => {
        window.location.href = appendParams(url, btn.dataset.source || 'main');
      });
    });
  }

  function initAssets() {
    if (el.logo && config.brand?.logoUrl) {
      el.logo.src = resolveAsset(config.brand.logoUrl);
      el.logo.addEventListener('error', () => {
        el.logo.style.display = 'none';
      });
    }

    if (el.visualImage && config.visuals?.stageImage) {
      el.visualImage.src = resolveAsset(config.visuals.stageImage);
      el.visualImage.addEventListener('load', () => {
        if (el.visualPlaceholder) el.visualPlaceholder.classList.add('is-hidden');
      });
      el.visualImage.addEventListener('error', () => {
        if (el.visualPlaceholder) el.visualPlaceholder.classList.remove('is-hidden');
      });
    }
  }

  function initPopupCopy() {
    if (el.popupTitle && config.popup?.title) el.popupTitle.textContent = config.popup.title;
    if (el.popupSub && config.popup?.sub) el.popupSub.textContent = config.popup.sub;
    if (el.popupBtn && config.popup?.action) el.popupBtn.textContent = config.popup.action;

    window.setTimeout(() => {
      if (!state.entered) enterFromPopup();
    }, 2100);
  }

  function init() {
    initAssets();
    renderBlocks();
    setTab(state.sceneIndex);
    renderScene();
    startTicker();
    bind();
    initPopupCopy();
  }

  init();
})();
