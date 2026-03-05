(() => {
  const root = document.documentElement;

  const lpPage = document.getElementById('lpPage');
  const heroStage = document.getElementById('heroStage');
  const benefitSection = document.getElementById('benefitSection');

  const brandLogo = document.getElementById('brandLogo');
  const brandName = document.getElementById('brandName');
  const brandSlogan = document.getElementById('brandSlogan');

  const heroImageA = document.getElementById('heroImageA');
  const heroImageB = document.getElementById('heroImageB');
  const storyImageA = document.getElementById('storyImageA');
  const storyImageB = document.getElementById('storyImageB');
  const storySticker = document.getElementById('storySticker');

  const heroPills = document.getElementById('heroPills');
  const heroTitle = document.getElementById('heroTitle');
  const heroSub = document.getElementById('heroSub');
  const rewardAmount = document.getElementById('rewardAmount');
  const heroWidgets = document.getElementById('heroWidgets');

  const storyHeadline = document.getElementById('storyHeadline');
  const storyChip = document.getElementById('storyChip');
  const benefitList = document.getElementById('benefitList');

  const countdown = document.getElementById('countdown');
  const progressBar = document.getElementById('progressBar');
  const progressPct = document.getElementById('progressPct');
  const liveFeed = document.getElementById('liveFeed');

  const stickyMain = document.getElementById('stickyMain');
  const stickySub = document.getElementById('stickySub');

  const rewardOverlay = document.getElementById('rewardOverlay');
  const overlayAmount = document.getElementById('overlayAmount');
  const overlayClose = document.getElementById('overlayClose');

  const state = {
    config: null,
    heroBeat: -1,
    storyBeat: -1,
    activeHeroLayer: 'A',
    activeStoryLayer: 'A',
    heroStart: 0,
    storyStart: 0,
    storyRunning: false,
    feedCursor: 0,
    overlayState: 'hidden',
    countdownLeft: 240
  };

  const fallbackConfig = {
    brand: {
      name: '拼多多',
      logoUrl: '../../../assets/img/logo/pdd-logo.png',
      slogan: '多实惠 多乐趣',
      colors: {
        primary: '#ff2f19',
        secondary: '#ff7a2f',
        accent: '#ffd85c'
      }
    },
    visuals: {
      hero: '../../input/visuals/hero_kv_main.jpg',
      scenes: [
        '../../input/visuals/benefit_scene_1.jpg',
        '../../input/visuals/benefit_scene_2.jpg',
        '../../input/visuals/benefit_scene_3.jpg'
      ],
      stickers: ['../../input/visuals/ui_sticker_pack.png']
    },
    benefits: [
      '百亿补贴 / 官方直补 / 单单返现折上折',
      '天天领现金 / 微信打款 / 秒到账',
      '万人团 / 一件也是批发价'
    ],
    timing: {
      heroBeats: [
        { start: 0.0, end: 0.8, title: '省多多小金库', sub: '多实惠 多乐趣', ctaLevel: 0 },
        { start: 0.8, end: 2.0, title: '百亿补贴 · 官方直补', sub: '全网低价 单单返现折上折', ctaLevel: 1 },
        { start: 2.0, end: 3.2, title: '天天领现金', sub: '微信打款 秒到账', ctaLevel: 1 },
        { start: 3.2, end: 4.0, title: '立即下载', sub: '限时福利 现在解锁', ctaLevel: 2 }
      ],
      storyBeats: [
        { start: 0.0, end: 2.7, title: '百亿补贴', sub: '官方直补 省上加省', ctaLevel: 1 },
        { start: 2.7, end: 5.4, title: '天天领现金', sub: '微信提现 秒到账', ctaLevel: 1 },
        { start: 5.4, end: 8.0, title: '万人团', sub: '一件也是批发价', ctaLevel: 2 }
      ]
    },
    conversion: {
      rewardAmount: '188.88',
      countdownSec: 240,
      progressTargetPct: 85,
      feed: [
        { nameMask: '李**华', action: '刚领取现金', amount: '+¥38.88' },
        { nameMask: '周**宁', action: '完成下单返现', amount: '+¥26.50' },
        { nameMask: '王**晨', action: '万人团拼单成功', amount: '省¥42.00' }
      ]
    },
    cta: {
      text: '立即下载拼多多',
      androidUrl: 'https://app.mi.com/details?id=com.xunmeng.pinduoduo'
    },
    layout: {
      safeTop: 12,
      safeBottom: 108,
      heroMinH: '70vh',
      cardMinH: 88,
      maxCopyLines: 2
    }
  };

  const clone = (obj) => JSON.parse(JSON.stringify(obj));

  function isAbsoluteUrl(url) {
    return /^(https?:|data:|blob:)/i.test(url || '');
  }

  function resolveAsset(path) {
    if (!path) return '';
    if (isAbsoluteUrl(path)) return path;
    try {
      return new URL(path, document.baseURI).toString();
    } catch (_err) {
      return path;
    }
  }

  function makePlaceholder(label, from = '#ff7a2f', to = '#7d130a') {
    const text = (label || '素材').slice(0, 6);
    const svg = `
      <svg xmlns='http://www.w3.org/2000/svg' width='720' height='1280' viewBox='0 0 720 1280'>
        <defs>
          <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
            <stop offset='0%' stop-color='${from}'/>
            <stop offset='100%' stop-color='${to}'/>
          </linearGradient>
        </defs>
        <rect width='720' height='1280' fill='url(#g)'/>
        <text x='50%' y='50%' text-anchor='middle' dominant-baseline='middle' font-size='56' font-family='Arial' fill='rgba(255,255,255,0.84)'>${text}</text>
      </svg>
    `.trim();
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function bindImageWithFallback(img, rawPath, label) {
    if (!img) return;
    const src = resolveAsset(rawPath);
    const backup = makePlaceholder(label);

    img.classList.remove('fallback');
    img.onerror = () => {
      img.onerror = null;
      img.classList.add('fallback');
      img.src = backup;
    };
    img.src = src || backup;
  }

  function flattenBenefitTokens() {
    const set = new Set();
    state.config.benefits.forEach((line) => {
      line
        .split('/')
        .map((x) => x.trim())
        .filter(Boolean)
        .forEach((token) => set.add(token));
    });
    return [...set];
  }

  function getBeatIndex(seconds, beats) {
    for (let i = 0; i < beats.length; i += 1) {
      if (seconds >= beats[i].start && seconds < beats[i].end) return i;
    }
    return beats.length - 1;
  }

  function applyPalette() {
    const colors = state.config.brand.colors;
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--secondary', colors.secondary);
    root.style.setProperty('--accent', colors.accent);

    root.style.setProperty('--safe-top-extra', `${state.config.layout.safeTop}px`);
    root.style.setProperty('--safe-bottom-extra', `${state.config.layout.safeBottom}px`);
    root.style.setProperty('--benefit-card-min', `${state.config.layout.cardMinH}px`);
    root.style.setProperty('--hero-min-h', state.config.layout.heroMinH);
    root.style.setProperty('--max-copy-lines', String(state.config.layout.maxCopyLines));
  }

  function renderStaticText() {
    brandName.textContent = state.config.brand.name;
    brandSlogan.textContent = state.config.brand.slogan;

    rewardAmount.textContent = state.config.conversion.rewardAmount;
    overlayAmount.textContent = state.config.conversion.rewardAmount;

    const ctaText = state.config.cta.text;
    document.querySelectorAll('.cta-main, .cta-sub, .mini-cta').forEach((btn) => {
      if (btn.id === 'benefitCta') {
        btn.textContent = '继续下载解锁福利';
        return;
      }
      if (btn.id === 'topbarCta') {
        btn.textContent = '极速下载';
        return;
      }
      btn.textContent = ctaText;
    });

    stickyMain.textContent = ctaText;
    stickySub.textContent = state.config.benefits
      .slice(0, 2)
      .map((x) => x.split('/')[0].trim())
      .join(' · ');

    storyHeadline.textContent = state.config.benefits
      .slice(0, 3)
      .map((x) => x.split('/')[0].trim())
      .join(' · ');
  }

  function buildHeroPills() {
    heroPills.innerHTML = state.config.timing.heroBeats
      .map((beat, index) => `<span class='pill ${index === 0 ? 'active' : ''}' role='listitem'>${beat.title}</span>`)
      .join('');
  }

  function buildWidgets() {
    const tokens = flattenBenefitTokens().slice(0, 5);
    heroWidgets.innerHTML = tokens.map((item) => `<span>${item}</span>`).join('');
  }

  function buildBenefits() {
    const list = state.config.benefits.slice(0, 5);
    benefitList.innerHTML = list
      .map((line, index) => {
        const parts = line
          .split('/')
          .map((item) => item.trim())
          .filter(Boolean);
        const title = parts[0] || line;
        const sub = parts.slice(1).join(' · ') || '限时权益开放中';
        return `<article class='benefit-item ${index === 0 ? 'active' : ''}' role='listitem'><strong class='clamp-2'>${title}</strong><p class='clamp-2'>${sub}</p></article>`;
      })
      .join('');
  }

  function renderFeed() {
    const all = state.config.conversion.feed;
    const visible = [];
    const count = Math.min(3, all.length);
    for (let i = 0; i < count; i += 1) {
      visible.push(all[(state.feedCursor + i) % all.length]);
    }

    liveFeed.innerHTML = visible
      .map(
        (item) =>
          `<li><span class='feed-left'><i class='feed-dot'></i><span class='feed-text'>${item.nameMask} ${item.action}</span></span><span class='feed-amount'>${item.amount}</span></li>`
      )
      .join('');
  }

  function setCtaIntensity(level) {
    lpPage.dataset.ctaIntensity = String(level);
  }

  function crossfadeImage(targetA, targetB, src, layerKey) {
    const incoming = layerKey === 'A' ? targetB : targetA;
    const outgoing = layerKey === 'A' ? targetA : targetB;

    bindImageWithFallback(incoming, src, '视觉素材');
    incoming.classList.add('show');
    outgoing.classList.remove('show');
  }

  function setHeroBeat(index) {
    if (state.heroBeat === index) return;
    state.heroBeat = index;

    const beat = state.config.timing.heroBeats[index];
    heroTitle.textContent = beat.title;
    heroSub.textContent = beat.sub;

    [...heroPills.children].forEach((pill, i) => pill.classList.toggle('active', i === index));

    const scenes = [state.config.visuals.hero, ...state.config.visuals.scenes];
    const nextFrame = scenes[index % scenes.length];

    crossfadeImage(heroImageA, heroImageB, nextFrame, state.activeHeroLayer);
    state.activeHeroLayer = state.activeHeroLayer === 'A' ? 'B' : 'A';

    setCtaIntensity(beat.ctaLevel);
  }

  function setStoryBeat(index) {
    if (state.storyBeat === index) return;
    state.storyBeat = index;

    const beat = state.config.timing.storyBeats[index];
    storyChip.textContent = `${beat.title} · ${beat.sub}`;

    const scene = state.config.visuals.scenes[index % state.config.visuals.scenes.length];
    crossfadeImage(storyImageA, storyImageB, scene, state.activeStoryLayer);
    state.activeStoryLayer = state.activeStoryLayer === 'A' ? 'B' : 'A';

    [...benefitList.children].forEach((card, i) => card.classList.toggle('active', i === index));

    setCtaIntensity(beat.ctaLevel);
  }

  function setOverlayState(next) {
    state.overlayState = next;
    rewardOverlay.dataset.state = next;
    rewardOverlay.setAttribute('aria-hidden', next === 'reward' ? 'false' : 'true');
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
        window.location.href = appendParams(state.config.cta.androidUrl, btn.dataset.source);
      });
    });
  }

  function bindOverlay() {
    overlayClose.addEventListener('click', () => {
      setOverlayState('closed');
      try {
        sessionStorage.setItem('v3_replica_overlay_closed', '1');
      } catch (_err) {
        // ignore
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && state.overlayState === 'reward') {
        setOverlayState('closed');
      }
    });
  }

  function startHeroLoop() {
    state.heroStart = performance.now();

    const tick = () => {
      const elapsed = ((performance.now() - state.heroStart) % 4000) / 1000;
      const idx = getBeatIndex(elapsed, state.config.timing.heroBeats);
      setHeroBeat(idx);
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
      const idx = getBeatIndex(elapsed, state.config.timing.storyBeats);
      setStoryBeat(idx);
    }, 180);
  }

  function startCountdown() {
    const total = Math.max(60, Number(state.config.conversion.countdownSec) || 240);
    state.countdownLeft = total;

    const tick = () => {
      const mm = String(Math.floor(state.countdownLeft / 60)).padStart(2, '0');
      const ss = String(state.countdownLeft % 60).padStart(2, '0');
      countdown.textContent = `${mm}:${ss}`;

      const used = total - state.countdownLeft;
      const ratio = used / total;
      const pct = Math.round(62 + ratio * (state.config.conversion.progressTargetPct - 62));
      progressPct.textContent = String(pct);
      progressBar.style.width = `${Math.min(100, Math.max(0, pct))}%`;
      progressBar.parentElement?.setAttribute('aria-valuenow', String(pct));

      state.countdownLeft = state.countdownLeft <= 0 ? total : state.countdownLeft - 1;
    };

    tick();
    window.setInterval(tick, 1000);
  }

  function startFeedLoop() {
    renderFeed();
    window.setInterval(() => {
      state.feedCursor = (state.feedCursor + 1) % state.config.conversion.feed.length;
      renderFeed();
    }, 1800);
  }

  function initImages() {
    bindImageWithFallback(brandLogo, state.config.brand.logoUrl, state.config.brand.name);
    if (state.config.brand.logoUrl.includes('file.market.xiaomi.com')) {
      brandLogo.onerror = () => {
        brandLogo.onerror = null;
        bindImageWithFallback(brandLogo, '../../../assets/img/logo/pdd-logo.png', state.config.brand.name);
      };
    }

    bindImageWithFallback(storySticker, state.config.visuals.stickers[0], '福利贴纸');

    bindImageWithFallback(heroImageA, state.config.visuals.hero, '主视觉');
    heroImageA.classList.add('show');
    bindImageWithFallback(heroImageB, state.config.visuals.scenes[0], '主视觉');
    heroImageB.classList.remove('show');

    bindImageWithFallback(storyImageA, state.config.visuals.scenes[0], '福利场景');
    storyImageA.classList.add('show');
    bindImageWithFallback(storyImageB, state.config.visuals.scenes[1], '福利场景');
    storyImageB.classList.remove('show');
  }

  function maybeOpenOverlay() {
    let closedBefore = false;
    try {
      closedBefore = sessionStorage.getItem('v3_replica_overlay_closed') === '1';
    } catch (_err) {
      closedBefore = false;
    }

    if (closedBefore) {
      setOverlayState('closed');
      return;
    }

    window.setTimeout(() => {
      setOverlayState('reward');
    }, 650);
  }

  function ensureConfigShape(cfg) {
    const conf = clone(cfg || fallbackConfig);
    conf.visuals = conf.visuals || fallbackConfig.visuals;
    conf.visuals.scenes = conf.visuals.scenes?.length ? conf.visuals.scenes : fallbackConfig.visuals.scenes;
    conf.visuals.stickers = conf.visuals.stickers?.length ? conf.visuals.stickers : fallbackConfig.visuals.stickers;

    conf.benefits = conf.benefits?.length ? conf.benefits : fallbackConfig.benefits;
    conf.timing = conf.timing || fallbackConfig.timing;
    conf.timing.heroBeats = conf.timing.heroBeats?.length ? conf.timing.heroBeats : fallbackConfig.timing.heroBeats;
    conf.timing.storyBeats = conf.timing.storyBeats?.length ? conf.timing.storyBeats : fallbackConfig.timing.storyBeats;

    conf.conversion = conf.conversion || fallbackConfig.conversion;
    conf.conversion.feed = conf.conversion.feed?.length ? conf.conversion.feed : fallbackConfig.conversion.feed;

    conf.layout = { ...fallbackConfig.layout, ...(conf.layout || {}) };
    conf.brand = { ...fallbackConfig.brand, ...(conf.brand || {}) };
    conf.brand.colors = { ...fallbackConfig.brand.colors, ...(conf.brand.colors || {}) };
    conf.cta = { ...fallbackConfig.cta, ...(conf.cta || {}) };

    return conf;
  }

  function initGlobalApi() {
    window.setHeroBeat = (index) => setHeroBeat(index);
    window.setStoryBeat = (index) => setStoryBeat(index);
    window.setCtaIntensity = (level) => setCtaIntensity(level);
    window.setOverlayState = (next) => setOverlayState(next);
  }

  function init() {
    state.config = ensureConfigShape(window.__LP_CONFIG);

    applyPalette();
    renderStaticText();
    buildHeroPills();
    buildWidgets();
    buildBenefits();
    initImages();

    setHeroBeat(0);
    setStoryBeat(0);

    bindCtas();
    bindOverlay();

    startHeroLoop();
    startStoryLoop();
    startCountdown();
    startFeedLoop();

    maybeOpenOverlay();
    initGlobalApi();
  }

  init();
})();
