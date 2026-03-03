(() => {
  const app = document.getElementById('app');
  const brandLogo = document.getElementById('brandLogo');
  const brandSub = document.getElementById('brandSub');
  const heroBase = document.getElementById('heroBase');
  const heroOverlay = document.getElementById('heroOverlay');
  const heroTitle = document.getElementById('heroTitle');
  const heroSubline = document.getElementById('heroSubline');
  const heroTopline = document.getElementById('heroTopline');
  const confidenceStrip = document.getElementById('confidenceStrip');
  const storyScene = document.getElementById('storyScene');
  const storySticker = document.getElementById('storySticker');
  const storyChip = document.getElementById('storyChip');
  const storyCards = document.getElementById('storyCards');
  const countdown = document.getElementById('countdown');
  const meterBar = document.getElementById('meterBar');
  const stickyMain = document.getElementById('stickyMain');

  const state = {
    config: null,
    heroBeat: -1,
    storyBeat: -1,
    storyActive: false,
    heroStart: 0,
    heroFrame: 0,
    storyStart: 0
  };

  function getBeatIndex(seconds, beats) {
    for (let i = 0; i < beats.length; i += 1) {
      if (seconds >= beats[i].start && seconds < beats[i].end) return i;
    }
    return beats.length - 1;
  }

  window.setCtaIntensity = function setCtaIntensity(level) {
    app.dataset.ctaIntensity = String(level);
  };

  window.setHeroBeat = function setHeroBeat(index) {
    if (!state.config || state.heroBeat === index) return;
    state.heroBeat = index;

    const beat = state.config.timing.heroBeats[index];
    heroTitle.textContent = beat.title;
    heroSubline.textContent = beat.sub;

    const scene = state.config.visuals.scenes[index % state.config.visuals.scenes.length];
    heroOverlay.src = scene;
    heroOverlay.style.opacity = beat.ctaLevel > 0 ? '0.3' : '0.2';

    [...heroTopline.children].forEach((pill, i) => {
      pill.classList.toggle('active', i === index);
    });

    window.setCtaIntensity(beat.ctaLevel);
  };

  window.setStoryBeat = function setStoryBeat(index) {
    if (!state.config || state.storyBeat === index) return;
    state.storyBeat = index;

    const beat = state.config.timing.storyBeats[index];
    storyScene.src = state.config.visuals.scenes[index % state.config.visuals.scenes.length];
    storyChip.textContent = `${beat.title} · ${beat.sub}`;

    [...storyCards.children].forEach((card, i) => {
      card.classList.toggle('active', i === index);
    });

    window.setCtaIntensity(beat.ctaLevel);
  };

  function applyUrlParams(baseUrl, source) {
    const target = new URL(baseUrl);
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
        window.location.href = applyUrlParams(state.config.cta.androidUrl, btn.dataset.source);
      });
    });
  }

  function renderHeroTopline() {
    heroTopline.innerHTML = state.config.timing.heroBeats
      .map((beat, i) => `<span class="step-pill ${i === 0 ? 'active' : ''}" role="listitem">${beat.title}</span>`)
      .join('');
  }

  function renderConfidenceStrip() {
    confidenceStrip.innerHTML = state.config.benefits
      .slice(0, 3)
      .map((item) => `<span>${item.split('/')[0].trim()}</span>`)
      .join('');
  }

  function renderStoryCards() {
    storyCards.innerHTML = state.config.timing.storyBeats
      .map(
        (beat, i) =>
          `<article class="story-card ${i === 0 ? 'active' : ''}" role="listitem"><strong>${beat.title}</strong><span>${beat.sub}</span></article>`
      )
      .join('');
  }

  function startHeroLoop() {
    const frames = [state.config.visuals.hero, ...state.config.visuals.scenes];
    state.heroStart = performance.now();
    heroBase.src = frames[0];

    const tick = () => {
      const elapsed = ((performance.now() - state.heroStart) % 4000) / 1000;
      const index = getBeatIndex(elapsed, state.config.timing.heroBeats);
      window.setHeroBeat(index);

      const frameIndex = index % frames.length;
      if (frameIndex !== state.heroFrame) {
        state.heroFrame = frameIndex;
        heroBase.src = frames[frameIndex];
      }

      window.requestAnimationFrame(tick);
    };

    window.requestAnimationFrame(tick);
  }

  function startStoryLoop() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          state.storyActive = entry.isIntersecting;
        });
      },
      { threshold: 0.35 }
    );

    observer.observe(document.getElementById('storySection'));

    state.storyStart = performance.now();
    window.setInterval(() => {
      if (!state.storyActive) return;
      const elapsed = ((performance.now() - state.storyStart) % 8000) / 1000;
      const index = getBeatIndex(elapsed, state.config.timing.storyBeats);
      window.setStoryBeat(index);
    }, 180);
  }

  function startCountdown(total = 240) {
    let remaining = total;

    const tick = () => {
      const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
      const ss = String(remaining % 60).padStart(2, '0');
      countdown.textContent = `${mm}:${ss}`;

      const progress = ((total - remaining) / total) * 100;
      meterBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;

      remaining = remaining <= 0 ? total : remaining - 1;
    };

    tick();
    window.setInterval(tick, 1000);
  }

  async function loadConfig() {
    if (window.__LP_CONFIG) return window.__LP_CONFIG;
    try {
      const response = await fetch('../../input/landing-config.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('config fetch failed');
      return await response.json();
    } catch (error) {
      console.warn('landing config fallback failed', error);
      return null;
    }
  }

  async function init() {
    state.config = await loadConfig();
    if (!state.config) return;

    brandLogo.src = state.config.brand.logoUrl;
    brandSub.textContent = state.config.brand.slogan;
    storySticker.src = state.config.visuals.stickers[0];
    storyScene.src = state.config.visuals.scenes[0];

    document.getElementById('heroCta').textContent = state.config.cta.text;
    stickyMain.textContent = state.config.cta.text.replace('拼多多', '');

    renderHeroTopline();
    renderConfidenceStrip();
    renderStoryCards();
    bindCtas();

    window.setHeroBeat(0);
    window.setStoryBeat(0);

    startHeroLoop();
    startStoryLoop();
    startCountdown(240);
  }

  init();
})();
