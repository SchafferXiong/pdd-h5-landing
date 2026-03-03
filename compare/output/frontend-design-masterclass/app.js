(() => {
  const stage = document.getElementById('stage');
  const brandLogo = document.getElementById('brandLogo');
  const brandSlogan = document.getElementById('brandSlogan');
  const layerBack = document.getElementById('layerBack');
  const layerMid = document.getElementById('layerMid');
  const layerFront = document.getElementById('layerFront');
  const heroTitle = document.getElementById('heroTitle');
  const heroSub = document.getElementById('heroSub');
  const heroTicker = document.getElementById('heroTicker');
  const beatLabel = document.getElementById('beatLabel');
  const heroShell = document.getElementById('heroShell');
  const storyVisual = document.getElementById('storyVisual');
  const storySticker = document.getElementById('storySticker');
  const storyTitle = document.getElementById('storyTitle');
  const storySub = document.getElementById('storySub');
  const storyCards = document.getElementById('storyCards');
  const clock = document.getElementById('clock');
  const burstBar = document.getElementById('burstBar');
  const stickyMain = document.getElementById('stickyMain');

  const state = {
    config: null,
    heroBeat: -1,
    storyBeat: -1,
    heroStart: 0,
    storyStart: 0,
    storyOn: false
  };

  function getBeatIndex(time, beats) {
    for (let i = 0; i < beats.length; i += 1) {
      if (time >= beats[i].start && time < beats[i].end) return i;
    }
    return beats.length - 1;
  }

  window.setCtaIntensity = function setCtaIntensity(level) {
    stage.dataset.ctaIntensity = String(level);
  };

  window.setHeroBeat = function setHeroBeat(index) {
    if (!state.config || state.heroBeat === index) return;
    state.heroBeat = index;

    const beat = state.config.timing.heroBeats[index];
    const scenes = state.config.visuals.scenes;
    const currentScene = scenes[index % scenes.length];
    const prevScene = scenes[(index + scenes.length - 1) % scenes.length];

    heroTitle.textContent = beat.title;
    heroSub.textContent = beat.sub;
    beatLabel.textContent = `${String(index + 1).padStart(2, '0')} / 04`;

    layerBack.src = index === 0 ? state.config.visuals.hero : prevScene;
    layerMid.src = currentScene;
    layerFront.src = index % 2 === 0 ? state.config.visuals.hero : currentScene;
    layerMid.style.opacity = beat.ctaLevel > 0 ? '0.3' : '0.22';

    [...heroTicker.children].forEach((item, i) => item.classList.toggle('active', i === index));
    window.setCtaIntensity(beat.ctaLevel);
  };

  window.setStoryBeat = function setStoryBeat(index) {
    if (!state.config || state.storyBeat === index) return;
    state.storyBeat = index;

    const beat = state.config.timing.storyBeats[index];
    storyVisual.src = state.config.visuals.scenes[index % state.config.visuals.scenes.length];
    storyTitle.textContent = beat.title;
    storySub.textContent = beat.sub;

    [...storyCards.children].forEach((card, i) => card.classList.toggle('active', i === index));
    window.setCtaIntensity(beat.ctaLevel);
  };

  function withParams(url, source) {
    const target = new URL(url);
    const current = new URL(window.location.href);

    ['src', 'campaign', 'adgroup', 'creative'].forEach((key) => {
      const value = current.searchParams.get(key);
      if (value) target.searchParams.set(key, value);
    });

    target.searchParams.set('lp_source', source || 'unknown');
    return target.toString();
  }

  function bindCta() {
    document.querySelectorAll('[data-source]').forEach((btn) => {
      btn.addEventListener('click', () => {
        window.location.href = withParams(state.config.cta.androidUrl, btn.dataset.source);
      });
    });
  }

  function renderHeroTicker() {
    heroTicker.innerHTML = state.config.timing.heroBeats
      .map((beat, i) => `<li class="${i === 0 ? 'active' : ''}">${beat.title}</li>`)
      .join('');
  }

  function renderStoryCards() {
    storyCards.innerHTML = state.config.timing.storyBeats
      .map(
        (beat, i) =>
          `<article class="reel-card ${i === 0 ? 'active' : ''}" role="listitem"><strong>${beat.title}</strong><span>${beat.sub}</span></article>`
      )
      .join('');
  }

  function startHeroLoop() {
    state.heroStart = performance.now();

    const tick = () => {
      const elapsed = ((performance.now() - state.heroStart) % 4000) / 1000;
      const beat = getBeatIndex(elapsed, state.config.timing.heroBeats);
      window.setHeroBeat(beat);
      window.requestAnimationFrame(tick);
    };

    window.requestAnimationFrame(tick);
  }

  function startStoryLoop() {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          state.storyOn = entry.isIntersecting;
        });
      },
      { threshold: 0.35 }
    );

    io.observe(document.getElementById('storySection'));

    state.storyStart = performance.now();
    window.setInterval(() => {
      if (!state.storyOn) return;
      const elapsed = ((performance.now() - state.storyStart) % 8000) / 1000;
      window.setStoryBeat(getBeatIndex(elapsed, state.config.timing.storyBeats));
    }, 180);
  }

  function startParallax() {
    const update = () => {
      const y = window.scrollY || 0;
      const depth = Math.max(-12, Math.min(22, y * 0.045));
      heroShell.style.setProperty('--depth-y', `${depth.toFixed(2)}px`);
      window.requestAnimationFrame(update);
    };
    window.requestAnimationFrame(update);
  }

  function startCountdown(total = 240) {
    let rest = total;

    const tick = () => {
      const mm = String(Math.floor(rest / 60)).padStart(2, '0');
      const ss = String(rest % 60).padStart(2, '0');
      clock.textContent = `${mm}:${ss}`;

      const progress = ((total - rest) / total) * 100;
      burstBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;

      rest = rest <= 0 ? total : rest - 1;
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
    brandSlogan.textContent = state.config.brand.slogan;
    storySticker.src = state.config.visuals.stickers[0];
    storyVisual.src = state.config.visuals.scenes[0];

    document.getElementById('heroBtnText').textContent = state.config.cta.text;
    stickyMain.textContent = state.config.cta.text.replace('拼多多', '');

    renderHeroTicker();
    renderStoryCards();
    bindCta();

    window.setHeroBeat(0);
    window.setStoryBeat(0);

    startHeroLoop();
    startStoryLoop();
    startParallax();
    startCountdown(240);
  }

  init();
})();
