(() => {
  const page = document.getElementById('page');
  const brandLogo = document.getElementById('brandLogo');
  const brandName = document.getElementById('brandName');
  const brandSlogan = document.getElementById('brandSlogan');
  const quickCta = document.getElementById('quickCta');
  const industryTabs = document.getElementById('industryTabs');
  const heroStage = document.getElementById('heroStage');
  const beatChips = document.getElementById('beatChips');
  const heroTitle = document.getElementById('heroTitle');
  const heroSub = document.getElementById('heroSub');
  const widgetRow = document.getElementById('widgetRow');
  const heroCta = document.getElementById('heroCta');
  const sectionSub = document.getElementById('sectionSub');
  const benefitSection = document.getElementById('benefitSection');
  const storyTitle = document.getElementById('storyTitle');
  const storySub = document.getElementById('storySub');
  const storyMetric = document.getElementById('storyMetric');
  const storyCards = document.getElementById('storyCards');
  const timer = document.getElementById('timer');
  const meterBar = document.getElementById('meterBar');
  const urgencyLabel = document.getElementById('urgencyLabel');
  const urgencyTip = document.getElementById('urgencyTip');
  const closeCta = document.getElementById('closeCta');
  const stickyMain = document.getElementById('stickyMain');
  const stickySub = document.getElementById('stickySub');

  const state = {
    profile: null,
    industryKey: 'ecommerce',
    heroBeat: -1,
    storyBeat: -1,
    heroStart: 0,
    storyStart: 0,
    storyRunning: false,
    intensity: 1
  };

  const fallbackPresets = {
    ecommerce: {
      label: '电商',
      appName: '拼多多',
      slogan: '多实惠 多乐趣',
      logoUrl: '../../../assets/img/logo/pdd-logo.png',
      ctaText: '立即下载',
      ctaUrl: 'https://app.mi.com/details?id=com.xunmeng.pinduoduo',
      palette: {
        bgStart: '#5f1009',
        bgEnd: '#1a0201',
        surface: 'rgba(255,255,255,0.12)',
        primary: '#ff2f18',
        secondary: '#ff8f2f',
        accent: '#ffe178',
        text: '#fff7ef',
        textDim: '#ffe2bf'
      },
      heroBeats: [
        { start: 0, end: 1.0, title: '百亿补贴', sub: '官方直补 价格更狠', level: 1 },
        { start: 1.0, end: 2.1, title: '天天领现金', sub: '微信打款 秒到账', level: 1 },
        { start: 2.1, end: 3.2, title: '万人团', sub: '一件也是批发价', level: 1 },
        { start: 3.2, end: 4.0, title: '现在下载', sub: '限时福利 立即解锁', level: 2 }
      ],
      storyBeats: [
        { start: 0, end: 2.8, title: '限时直补', sub: '核心爆款持续低价', metric: '低至5折' },
        { start: 2.8, end: 5.4, title: '返现加码', sub: '下单即返 叠加更省', metric: '单单返现' },
        { start: 5.4, end: 8.0, title: '现金到账', sub: '零钱提现 响应更快', metric: '秒到账' }
      ],
      widgets: ['全网低价', '返现折上折', '微信秒到账', '0元抽好礼'],
      urgency: {
        label: '限时福利进行中',
        tip: '现在下载，优先获取补贴与现金权益'
      }
    }
  };

  function getPresets() {
    if (window.__LP_V2_PRESETS && window.__LP_V2_PRESETS.industries) {
      return window.__LP_V2_PRESETS.industries;
    }
    return fallbackPresets;
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function getBeatIndex(time, beats) {
    for (let i = 0; i < beats.length; i += 1) {
      if (time >= beats[i].start && time < beats[i].end) return i;
    }
    return beats.length - 1;
  }

  function makeLogoDataUrl(appName, palette) {
    const mark = (appName || 'A').trim().slice(0, 1);
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="${palette.accent}"/>
            <stop offset="100%" stop-color="${palette.primary}"/>
          </linearGradient>
        </defs>
        <rect width="128" height="128" rx="28" fill="url(#g)"/>
        <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-size="62" font-family="Arial" font-weight="700" fill="white">${mark}</text>
      </svg>
    `.trim();
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function pickProfile() {
    const presets = getPresets();
    const params = new URLSearchParams(window.location.search);
    const industry = params.get('industry') || 'ecommerce';
    const fallback = presets.ecommerce || Object.values(presets)[0];
    const base = clone(presets[industry] || fallback);

    if (!base) {
      throw new Error('No profile found for V2');
    }

    state.industryKey = presets[industry] ? industry : 'ecommerce';
    base.appName = params.get('app') || base.appName;
    base.slogan = params.get('slogan') || base.slogan;
    base.ctaText = params.get('ctaText') || base.ctaText;
    base.ctaUrl = params.get('cta') || base.ctaUrl;
    base.logoUrl = params.get('logo') || base.logoUrl;

    if (!base.logoUrl) {
      base.logoUrl = makeLogoDataUrl(base.appName, base.palette);
    }

    return base;
  }

  function applyPalette(palette) {
    const root = document.documentElement;
    root.style.setProperty('--bg-start', palette.bgStart);
    root.style.setProperty('--bg-end', palette.bgEnd);
    root.style.setProperty('--surface', palette.surface);
    root.style.setProperty('--primary', palette.primary);
    root.style.setProperty('--secondary', palette.secondary);
    root.style.setProperty('--accent', palette.accent);
    root.style.setProperty('--text', palette.text);
    root.style.setProperty('--text-dim', palette.textDim);
  }

  function buildTabs() {
    const presets = getPresets();
    const keys = Object.keys(presets);

    industryTabs.innerHTML = keys
      .map((key) => {
        const active = key === state.industryKey ? 'active' : '';
        return `<button class="tab ${active}" data-industry="${key}" type="button">${presets[key].label}</button>`;
      })
      .join('');

    industryTabs.querySelectorAll('[data-industry]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const url = new URL(window.location.href);
        url.searchParams.set('industry', btn.dataset.industry);
        window.location.href = url.toString();
      });
    });
  }

  function buildHeroChips() {
    beatChips.innerHTML = state.profile.heroBeats
      .map((beat, i) => `<li class="${i === 0 ? 'active' : ''}">${beat.title}</li>`)
      .join('');
  }

  function buildWidgets() {
    widgetRow.innerHTML = state.profile.widgets
      .slice(0, 4)
      .map((text) => `<span>${text}</span>`)
      .join('');
  }

  function buildStoryCards() {
    storyCards.innerHTML = state.profile.storyBeats
      .map(
        (beat, i) =>
          `<article class="benefit-card ${i === 0 ? 'active' : ''}" role="listitem"><strong>${beat.title}</strong><span>${beat.sub}</span><em>${beat.metric}</em></article>`
      )
      .join('');
  }

  function setCtaIntensity(level) {
    state.intensity = level;
    page.dataset.ctaIntensity = String(level);
  }

  function setHeroBeat(index) {
    if (state.heroBeat === index) return;
    state.heroBeat = index;

    const beat = state.profile.heroBeats[index];
    heroTitle.textContent = beat.title;
    heroSub.textContent = beat.sub;

    [...beatChips.children].forEach((chip, i) => chip.classList.toggle('active', i === index));
    heroStage.style.setProperty('--motion-shift', String(index * 7 + 2));

    setCtaIntensity(beat.level);
  }

  function setStoryBeat(index) {
    if (state.storyBeat === index) return;
    state.storyBeat = index;

    const beat = state.profile.storyBeats[index];
    storyTitle.textContent = beat.title;
    storySub.textContent = beat.sub;
    storyMetric.textContent = beat.metric;

    [...storyCards.children].forEach((card, i) => card.classList.toggle('active', i === index));
    if (index === state.profile.storyBeats.length - 1) {
      setCtaIntensity(2);
    }
  }

  function appendParams(url, source) {
    const target = new URL(url, window.location.href);
    const current = new URL(window.location.href);
    ['src', 'campaign', 'adgroup', 'creative'].forEach((key) => {
      const value = current.searchParams.get(key);
      if (value) target.searchParams.set(key, value);
    });
    target.searchParams.set('lp_source', source || 'unknown');
    return target.toString();
  }

  function bindCtas() {
    document.querySelectorAll('[data-source]').forEach((btn) => {
      btn.addEventListener('click', () => {
        window.location.href = appendParams(state.profile.ctaUrl, btn.dataset.source);
      });
    });
  }

  function startHeroLoop() {
    state.heroStart = performance.now();
    const tick = () => {
      const elapsed = ((performance.now() - state.heroStart) % 4000) / 1000;
      setHeroBeat(getBeatIndex(elapsed, state.profile.heroBeats));

      const drift = Math.sin(performance.now() / 400) * 3;
      heroStage.style.setProperty('--motion-shift', String(drift + state.heroBeat * 7));

      window.requestAnimationFrame(tick);
    };
    window.requestAnimationFrame(tick);
  }

  function startStoryLoop() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          state.storyRunning = entry.isIntersecting;
        });
      },
      { threshold: 0.35 }
    );

    observer.observe(benefitSection);

    state.storyStart = performance.now();
    window.setInterval(() => {
      if (!state.storyRunning) return;
      const elapsed = ((performance.now() - state.storyStart) % 8000) / 1000;
      setStoryBeat(getBeatIndex(elapsed, state.profile.storyBeats));
    }, 180);
  }

  function startCountdown(total = 240) {
    let rest = total;
    const tick = () => {
      const mm = String(Math.floor(rest / 60)).padStart(2, '0');
      const ss = String(rest % 60).padStart(2, '0');
      timer.textContent = `${mm}:${ss}`;

      const p = ((total - rest) / total) * 100;
      meterBar.style.width = `${Math.min(100, Math.max(0, p))}%`;

      rest = rest <= 0 ? total : rest - 1;
    };

    tick();
    window.setInterval(tick, 1000);
  }

  function applyIdentity() {
    const p = state.profile;

    brandLogo.src = p.logoUrl;
    brandName.textContent = p.appName;
    brandSlogan.textContent = p.slogan;

    quickCta.textContent = p.ctaText;
    heroCta.textContent = p.ctaText;
    closeCta.textContent = p.ctaText;
    stickyMain.textContent = p.ctaText;
    stickySub.textContent = `${p.heroBeats[1].title} · ${p.heroBeats[2].title}`;

    sectionSub.textContent = `${p.heroBeats[0].title}、${p.heroBeats[1].title}、${p.heroBeats[2].title}`;
    urgencyLabel.textContent = p.urgency.label;
    urgencyTip.textContent = p.urgency.tip;
  }

  function init() {
    state.profile = pickProfile();
    applyPalette(state.profile.palette);
    applyIdentity();

    buildTabs();
    buildHeroChips();
    buildWidgets();
    buildStoryCards();
    bindCtas();

    setHeroBeat(0);
    setStoryBeat(0);

    startHeroLoop();
    startStoryLoop();
    startCountdown(240);
  }

  init();
})();
